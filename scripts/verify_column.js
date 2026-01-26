const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase environment variables not found.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
    console.log('Verifying tasks table schema...');

    // Try to select the new column
    const { data, error } = await supabase
        .from('tasks')
        .select('id, workflow_type')
        .limit(1);

    if (error) {
        console.error('❌ Verification Failed:', error.message);
        if (error.message.includes('column "workflow_type" does not exist')) {
            console.error('Reason: The column workflow_type was not found in the tasks table.');
        }
    } else {
        console.log('✅ Verification Successful: "workflow_type" column exists.');
        console.log('Sample data:', data);
    }
}

verifyMigration();
