-- Create Google OAuth tokens table for storing encrypted refresh tokens
CREATE TABLE IF NOT EXISTS public.google_oauth_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_refresh_token TEXT NOT NULL,
    encrypted_access_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id) -- One token per user
);

-- Create OAuth state tokens table for CSRF protection
CREATE TABLE IF NOT EXISTS public.oauth_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    state_token TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_google_tokens_user ON public.google_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_google_tokens_expires ON public.google_oauth_tokens(token_expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_token ON public.oauth_states(state_token);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON public.oauth_states(expires_at);

-- Enable RLS
ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies for google_oauth_tokens
CREATE POLICY "Users can view their own tokens"
    ON public.google_oauth_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
    ON public.google_oauth_tokens FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
    ON public.google_oauth_tokens FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
    ON public.google_oauth_tokens FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for oauth_states (more permissive for OAuth flow)
CREATE POLICY "Allow all operations on oauth_states"
    ON public.oauth_states FOR ALL
    USING (true);

-- Function to clean up expired OAuth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM public.oauth_states
    WHERE expires_at < NOW();
END;
$$;

-- Comment on tables
COMMENT ON TABLE public.google_oauth_tokens IS 'Stores encrypted Google OAuth refresh tokens for each user';
COMMENT ON TABLE public.oauth_states IS 'Temporary storage for OAuth state tokens (CSRF protection)';
