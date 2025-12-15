const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const inputFile = path.join(__dirname, '../n8n/WF02-Clean.json');
const raw = fs.readFileSync(inputFile, 'utf8');
const json = JSON.parse(raw);

// Strip credentials
json.nodes.forEach(node => {
    if (node.credentials) {
        delete node.credentials;
    }
});

// New Version ID
json.versionId = crypto.randomUUID();
// Change Name so it doesn't conflict
json.name = "WF02-Debug-NoCreds";
json.active = false; // We will activate via API

const N8N_HOST = 'http://localhost:5678';
const EMAIL = 'chiuweilun1107@gmail.com';
const PASSWORD = 'Ally0323';

async function main() {
    try {
        console.log("1. Logging in...");
        // Try emailOrLdapLoginId first as it is the new standard
        let loginRes = await fetch(`${N8N_HOST}/rest/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailOrLdapLoginId: EMAIL, password: PASSWORD })
        });

        if (!loginRes.ok) {
            // Fallback
            loginRes = await fetch(`${N8N_HOST}/rest/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: EMAIL, password: PASSWORD })
            });
        }

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
        const cookie = loginRes.headers.get('set-cookie');

        console.log("2. Getting API Key...");
        const keysList = await fetch(`${N8N_HOST}/rest/me/api-keys`, {
            headers: { 'Cookie': cookie }
        });
        const list = await keysList.json();
        const apiKey = list[0].apiKey;

        console.log("3. Uploading Clean Workflow...");
        const importRes = await fetch(`${N8N_HOST}/api/v1/workflows`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(json)
        });

        const data = await importRes.json();
        const wfId = data.id;
        console.log(`   Uploaded ID: ${wfId}`);

        console.log("4. Activating...");
        const activateRes = await fetch(`${N8N_HOST}/api/v1/workflows/${wfId}/activate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        if (activateRes.ok) {
            console.log("✅ SUCCESS! Workflow Active.");
        } else {
            console.log("❌ Activation Failed: " + await activateRes.text());
        }

    } catch (e) {
        console.error(e);
    }
}

main();
