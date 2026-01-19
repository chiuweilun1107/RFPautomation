
const fs = require('fs');
const path = require('path');

// Manually read .env
const envPath = path.resolve(__dirname, '../../.env');
const envConfig = {};
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, value] = line.split('=');
            if (key && value) {
                envConfig[key.trim()] = value.trim();
            }
        }
    });
} catch (e) {
    console.warn('Could not read .env file:', e.message);
}

const supabaseUrl = envConfig.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

async function checkRecentSections() {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/sections?select=id,title,created_at,citation_source_id,citation_page,citation_quote&order=created_at.desc&limit=10`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log('Recent 10 Sections:');
        data.forEach(s => {
            console.log(`[${s.created_at}] ${s.title}`);
            console.log(`   Source ID: ${s.citation_source_id}`);
            console.log(`   Page: ${s.citation_page}`);
            console.log(`   Quote: ${s.citation_quote ? s.citation_quote.substring(0, 50) + '...' : 'null'}`);
            console.log('---');
        });
    } catch (error) {
        console.error('Error fetching sections:', error);
    }
}

checkRecentSections();
