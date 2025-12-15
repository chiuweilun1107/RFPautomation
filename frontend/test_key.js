const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://goyonrowhfphooryfzif.supabase.co';
const TEST_KEY = 'sb_secret_i6ul9zHnJ-oQDxrviY6U8Q_iiwSI096'; // The key user provided

if (!SUPABASE_URL) {
    console.error("Missing SUPABASE_URL");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, TEST_KEY);

async function testConnection() {
    console.log("Testing Key:", TEST_KEY.substring(0, 15) + "...");

    // Try to list files in the private bucket 'rfp_docs'
    const { data, error } = await supabase
        .storage
        .from('rfp_docs')
        .list();

    if (error) {
        console.error("❌ Key failed:", error.message);
        // console.error("Details:", error); 
        // 401 Unauthorized usually means wrong key
    } else {
        console.log("✅ Key worked! File list retrieved.");
        console.log(data);
    }
}

testConnection();
