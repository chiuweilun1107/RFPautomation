const fs = require('fs');

const N8N_HOST = 'http://localhost:5678';
const API_KEY = process.env.N8N_API_KEY;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = 'https://goyonrowhfphooryfzif.supabase.co';

if (!API_KEY || !SUPABASE_KEY) {
    console.error("Error: Missing N8N_API_KEY or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

async function setupCredentials() {
    try {
        console.log("Setting up Supabase Credentials in n8n...");

        const payload = {
            name: `Supabase Owner ${Date.now()}`, // Unique name
            type: 'supabaseApi',
            data: {
                host: SUPABASE_URL,
                serviceRole: SUPABASE_KEY
            }
        };

        console.log("Creating 'Supabase Owner' credential (supabaseApi)...");
        const createRes = await fetch(`${N8N_HOST}/api/v1/credentials`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!createRes.ok) {
            const errText = await createRes.text();
            // Ignore if already exists (simplification) or log
            console.warn(`Supabase Owner creation likely failed or dupe: ${errText}`);
        } else {
            const created = await createRes.json();
            console.log(`✅ Supabase Owner Credential ID: ${created.id}`);
        }

        // 2. Create HTTP Header Auth for Storage Download
        const headerPayload = {
            name: `Supabase Header Auth ${Date.now()}`,
            type: 'httpHeaderAuth',
            data: {
                name: 'Authorization',
                value: `Bearer ${SUPABASE_KEY}`
            }
        };

        console.log("Creating 'Supabase Header Auth' credential...");
        const headerRes = await fetch(`${N8N_HOST}/api/v1/credentials`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(headerPayload)
        });

        if (!headerRes.ok) {
            throw new Error(`Header Auth creation failed: ${await headerRes.text()}`);
        }

        const headerCreated = await headerRes.json();
        console.log(`✅ Header Auth Credential ID: ${headerCreated.id}`);


    } catch (error) {
        console.error("Setup Error:", error.message);
        process.exit(1);
    }
}

setupCredentials();
