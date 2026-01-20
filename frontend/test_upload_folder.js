
const { createClient } = require('@supabase/supabase-js');

// Load env vars
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://goyonrowhfphooryfzif.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MTEwODcsImV4cCI6MjA4MTE4NzA4N30.uhXDnI7IvyAqu-DwrWrCZlTYDUFJl6Jb96WYq_j59WU';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRecursiveUpload() {
    console.log('Testing upload to subfolder with ANON key...');

    const folderPath = `section-templates/test_${Date.now()}.txt`;

    const { data, error } = await supabase.storage
        .from('raw-files')
        .upload(folderPath, 'Child folder test content', {
            upsert: true
        });

    if (error) {
        console.error('Subfolder Upload FAILED:', error);
    } else {
        console.log('Subfolder Upload SUCCESS:', data);
    }
}

testRecursiveUpload();
