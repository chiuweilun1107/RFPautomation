
const { createClient } = require('@supabase/supabase-js');

// Load env vars
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://goyonrowhfphooryfzif.supabase.co';
// Use ANON KEY to simulate frontend user
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MTEwODcsImV4cCI6MjA4MTE4NzA4N30.uhXDnI7IvyAqu-DwrWrCZlTYDUFJl6Jb96WYq_j59WU';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUpload() {
    console.log('Testing upload with ANON key...');

    // Need to be authenticated usually? 
    // If RLS allows public uploads, this works. If it requires auth, it fails unless we sign in.
    // The frontend code creates a client and uses `supabase.auth.getUser()`, implying the user is logged in.
    // But here I'm testing "public" or "anon" access.
    // If the policy is "TO authenticated", then ANON key alone without a user session will fail.
    // However, I suspect the issue is simply Missing Policy for INSERT.

    const { data, error } = await supabase.storage
        .from('raw-files')
        .upload('test_upload_check.txt', 'This is a test file', {
            upsert: true
        });

    if (error) {
        console.error('Upload FAILED:', error);
    } else {
        console.log('Upload SUCCESS:', data);
    }
}

testUpload();
