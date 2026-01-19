/**
 * Generate OAuth State Token API
 * Creates a random state token for CSRF protection during OAuth flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

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

    // Generate random state token (32 bytes = 64 hex characters)
    const stateToken = randomBytes(32).toString('hex');

    // Store state token in database (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from('oauth_states')
      .insert({
        state_token: stateToken,
        user_id: user.id,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('Failed to store state token:', insertError);
      return NextResponse.json(
        { error: 'Failed to generate state token' },
        { status: 500 }
      );
    }

    // Clean up expired states (fire and forget)
    supabase.rpc('cleanup_expired_oauth_states').then();

    // Generate OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '');
    googleAuthUrl.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI || '');
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/drive.readonly');
    googleAuthUrl.searchParams.set('state', stateToken);
    googleAuthUrl.searchParams.set('access_type', 'offline'); // Get refresh token
    googleAuthUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token

    return NextResponse.json({
      state: stateToken,
      authUrl: googleAuthUrl.toString(),
    });
  } catch (error) {
    console.error('Generate state error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
