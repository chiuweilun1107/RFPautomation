
const fs = require('fs');

// Read keys from frontend/.env.local
let envContent = '';
try {
    envContent = fs.readFileSync('frontend/.env.local', 'utf8');
} catch (e) {
    console.error("Could not read .env.local");
    process.exit(1);
}

const vars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        vars[key.trim()] = value.trim();
    }
});

const SERVICE_KEY = vars['SUPABASE_SERVICE_ROLE_KEY'];
const N8N_HOST = 'http://localhost:5678';
// Current API Key provided by user
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjM2Mjc1LCJleHAiOjE3NjgxOTQwMDB9.SedMQPbxYzRj2vBXyAX_CO6RtwYaPNXll7Dha2Q-BEo';

async function main() {
    try {
        console.log("🔐 Restoring Supabase Credential...");

        const payload = {
            name: "Supabase Header Auth",
            type: "httpHeaderAuth",
            data: {
                name: "apikey",
                value: SERVICE_KEY
            }
        };

        const response = await fetch(`${N8N_HOST}/api/v1/credentials`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ SUCCESS: Supabase Credential Restored!");
            console.log(`🆔 ID: ${data.id}`);
        } else {
            console.error("❌ FAILED:", response.status, data);
        }

    } catch (error) {
        console.error("💥 Error:", error);
    }
}

main();
