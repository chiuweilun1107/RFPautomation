/**
 * Google OAuth Token Refresh API
 * Uses refresh token to get a new access token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt, encrypt } from '@/lib/crypto';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get stored tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'No tokens found. Please connect Google Drive first.' },
        { status: 404 }
      );
    }

    // Decrypt refresh token
    const refreshToken = decrypt(tokenData.encrypted_refresh_token);

    // Request new access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token refresh failed:', errorData);

      // If refresh token is invalid, delete stored tokens
      if (errorData.error === 'invalid_grant') {
        await supabase
          .from('google_oauth_tokens')
          .delete()
          .eq('user_id', user.id);

        return NextResponse.json(
          { error: 'Refresh token expired. Please reconnect Google Drive.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Token refresh failed' },
        { status: 500 }
      );
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Encrypt new access token
    const encryptedAccessToken = encrypt(tokens.access_token);

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Update tokens in database
    const { error: updateError } = await supabase
      .from('google_oauth_tokens')
      .update({
        encrypted_access_token: encryptedAccessToken,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update tokens:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tokens' },
        { status: 500 }
      );
    }

    // Return the new access token (decrypted for use)
    return NextResponse.json({
      accessToken: tokens.access_token,
      expiresAt,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get a valid access token (refresh if needed)
 * This can be imported and used by other APIs
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient();

  // Get stored tokens
  const { data: tokenData, error: tokenError } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (tokenError || !tokenData) {
    return null;
  }

  // Check if token is still valid (with 5 minute buffer)
  const expiresAt = new Date(tokenData.token_expires_at);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (expiresAt > fiveMinutesFromNow) {
    // Token is still valid, decrypt and return
    return decrypt(tokenData.encrypted_access_token);
  }

  // Token is expired or about to expire, refresh it
  const refreshToken = decrypt(tokenData.encrypted_refresh_token);

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token refresh failed');
      return null;
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Encrypt and store new access token
    const encryptedAccessToken = encrypt(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await supabase
      .from('google_oauth_tokens')
      .update({
        encrypted_access_token: encryptedAccessToken,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return tokens.access_token;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}
