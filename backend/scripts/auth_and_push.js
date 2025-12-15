const N8N_HOST = 'http://localhost:5678';
const EMAIL = 'chiuweilun1107@gmail.com';
const PASSWORD = 'Ally0323';
const WF_PATH = '../n8n/WF01-Document-Parsing.json';
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        console.log("1. Logging in...");
        const loginRes = await fetch(`${N8N_HOST}/rest/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailOrLdapLoginId: EMAIL, password: PASSWORD })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);

        const cookie = loginRes.headers.get('set-cookie');
        console.log("   Logged in. Cookie verified.");

        console.log("2. Generating API Key...");
        const keyRes = await fetch(`${N8N_HOST}/rest/me/api-keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie
            },
            body: JSON.stringify({ name: `AgentKey-${Date.now()}` })
        });

        if (!keyRes.ok) throw new Error(`Key gen failed: ${keyRes.status} ${await keyRes.text()}`);
        const keyData = await keyRes.json();
        const apiKey = keyData.apiKey;
        console.log("   API Key obtained.");

        console.log("3. Importing Workflow...");
        const wfContent = fs.readFileSync(path.join(__dirname, WF_PATH), 'utf8');
        const wfJson = JSON.parse(wfContent);

        // Ensure active is explicitly false for import (will activate later)
        wfJson.active = false;

        const importRes = await fetch(`${N8N_HOST}/api/v1/workflows`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(wfJson)
        });

        let wfId;
        if (importRes.ok) {
            const data = await importRes.json();
            wfId = data.id;
            console.log(`   Imported as ID: ${wfId}`);
        } else {
            console.log(`   Import failed (maybe exists?), trying to find existing...`);
            // List workflows
            const listRes = await fetch(`${N8N_HOST}/api/v1/workflows`, {
                headers: { 'X-N8N-API-KEY': apiKey }
            });
            const list = await listRes.json();
            const found = list.data.find(w => w.name === wfJson.name);
            if (found) {
                wfId = found.id;
                console.log(`   Found existing ID: ${wfId}`);
                // Update it
                await fetch(`${N8N_HOST}/api/v1/workflows/${wfId}`, {
                    method: 'PUT',
                    headers: {
                        'X-N8N-API-KEY': apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(wfJson)
                });
            } else {
                throw new Error("Could not import or find workflow.");
            }
        }

        console.log("4. Activating...");
        const activateRes = await fetch(`${N8N_HOST}/api/v1/workflows/${wfId}/activate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        if (activateRes.ok) {
            console.log("✅ Workflow RELEASED & ACTIVE.");
        } else {
            console.error("❌ Activation failed:", await activateRes.text());
        }

    } catch (e) {
        console.error("FATAL:", e.message);
    }
}

main();
