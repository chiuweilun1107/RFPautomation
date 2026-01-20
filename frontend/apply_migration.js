
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Parse .env.local manually
const envPath = path.resolve(__dirname, '.env.local');
let databaseUrl = process.env.DATABASE_URL;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
    if (match) {
        // Force replace host to standard Supabase direct host
        // The pooler host (aws-1...) seems unreachable from this environment
        databaseUrl = match[1].replace(/@[^:]+:/, '@db.goyonrowhfphooryfzif.supabase.co:');
        // Ensure port is 5432 for direct connection
        databaseUrl = databaseUrl.replace(/:6543\//, ':5432/');
        console.log('Using corrected Database URL host:', databaseUrl.split('@')[1]);
    }
}

if (!databaseUrl) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false } // Required for Supabase in some envs
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to database');

        const migrationPath = path.resolve(__dirname, '../supabase/migrations/20240120000001_add_template_file_url.sql');
        if (!fs.existsSync(migrationPath)) {
            console.error('Migration file not found:', migrationPath);
            process.exit(1);
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log('Applying migration:', path.basename(migrationPath));

        await client.query(sql);
        console.log('Migration applied successfully');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
