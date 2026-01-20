
const { createClient } = require('@supabase/supabase-js');

// Load env vars
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://goyonrowhfphooryfzif.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTYxMTA4NywiZXhwIjoyMDgxMTg3MDg3fQ.O49nmTt-80E0oAx70B_QYMU7rZpcoe26x5FQr6IuKnU';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkBuckets() {
    console.log('Checking buckets...');
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error fetching buckets:', error);
        return;
    }

    console.log('Buckets found:');
    data.forEach(b => {
        console.log(`- [${b.id}] Public: ${b.public}`);
    });

    // Check specific bucket 'raw-files'
    const rawFiles = data.find(b => b.id === 'raw-files');
    if (rawFiles) {
        console.log('\nBucket "raw-files" exists.');
        // Keep it simple, just checking existence first.
    } else {
        console.log('\nBucket "raw-files" does NOT exist.');
    }
}

checkBuckets();
