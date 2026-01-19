/**
 * Google OAuth Callback API
 * Handles the OAuth callback from Google, exchanges code for tokens,
 * encrypts and stores them in the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/crypto';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/dashboard/knowledge?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/knowledge?error=invalid_callback', request.url)
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized', request.url)
      );
    }

    // Verify state token (CSRF protection)
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state_token', state)
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (stateError || !stateData) {
      console.error('Invalid state token:', stateError);
      return NextResponse.redirect(
        new URL('/dashboard/knowledge?error=invalid_state', request.url)
      );
    }

    // Delete used state token
    await supabase.from('oauth_states').delete().eq('state_token', state);

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/dashboard/knowledge?error=token_exchange_failed', request.url)
      );
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    if (!tokens.refresh_token) {
      console.error('No refresh token received');
      return NextResponse.redirect(
        new URL('/dashboard/knowledge?error=no_refresh_token', request.url)
      );
    }

    // Encrypt tokens
    const encryptedRefreshToken = encrypt(tokens.refresh_token);
    const encryptedAccessToken = encrypt(tokens.access_token);

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Store encrypted tokens in database (upsert)
    const { error: upsertError } = await supabase
      .from('google_oauth_tokens')
      .upsert(
        {
          user_id: user.id,
          encrypted_refresh_token: encryptedRefreshToken,
          encrypted_access_token: encryptedAccessToken,
          token_expires_at: expiresAt,
          scope: tokens.scope,
          updated_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (upsertError) {
      console.error('Failed to store tokens:', upsertError);
      return NextResponse.redirect(
        new URL('/dashboard/knowledge?error=token_storage_failed', request.url)
      );
    }

    // Return HTML that will notify parent window via postMessage
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head>
  <title>Google Drive Connected</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .success-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
    }
    p {
      margin: 0;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">✓</div>
    <h1>Google Drive Connected!</h1>
    <p>Closing window...</p>
  </div>
  <script>
    // Notify parent window that authentication was successful
    if (window.opener) {
      window.opener.postMessage({
        type: 'GOOGLE_DRIVE_CONNECTED',
        success: true
      }, window.location.origin);

      // Close window immediately after postMessage
      setTimeout(() => {
        window.close();
      }, 100);
    } else {
      // If no opener (opened in new tab instead of popup), redirect
      setTimeout(() => {
        window.location.href = '/dashboard/knowledge';
      }, 2000);
    }
  </script>
</body>
</html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/knowledge?error=callback_failed', request.url)
    );
  }
}
