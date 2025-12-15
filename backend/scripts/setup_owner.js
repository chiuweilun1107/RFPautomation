const N8N_HOST = 'http://localhost:5678';
const EMAIL = 'chiuweilun1107@gmail.com';
const PASSWORD = 'Ally0323';
const WF_PATH = '../n8n/WF03-NoCreds.json';
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        let authCookie;

        console.log("1. Skipping Owner Create (Assume Exists)...");


        if (true) { // Skip owner check
            // console.log("✅ Owner Account Created!");
            // authCookie = ownerRes.headers.get('set-cookie');
        } else {
            const err = await ownerRes.text();
            console.log(`ℹ️ Owner setup skipped (${ownerRes.status}): ${err}`);

            // Direct Login
            console.log("2. Attempting Login...");
            const loginRes = await fetch(`${N8N_HOST}/rest/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: EMAIL, password: PASSWORD })
            });

            if (!loginRes.ok) {
                console.log("❌ Login failed. Maybe using 'emailOrLdapLoginId'?");
                // Retry with new payload format
                const loginRes2 = await fetch(`${N8N_HOST}/rest/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emailOrLdapLoginId: EMAIL, password: PASSWORD })
                });

                if (!loginRes2.ok) {
                    throw new Error(`FATAL: Login failed: ${loginRes2.status} ${await loginRes2.text()}`);
                }
                authCookie = loginRes2.headers.get('set-cookie');
            } else {
                authCookie = loginRes.headers.get('set-cookie');
            }
        }

        console.log("🔑 Authenticated.");

        // 3. Get API Key
        console.log("3. Provisioning API Key...");
        // Get existing keys first
        const keysList = await fetch(`${N8N_HOST}/rest/me/api-keys`, {
            headers: { 'Cookie': authCookie }
        });

        let apiKey;
        if (keysList.ok) {
            const list = await keysList.json();
            if (list.length > 0) {
                apiKey = list[0].apiKey; // Reuse existing
                console.log("   Reusing existing key.");
            }
        }

        if (!apiKey) {
            const keyRes = await fetch(`${N8N_HOST}/rest/me/api-keys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': authCookie
                },
                body: JSON.stringify({ name: `AgentKey-${Date.now()}` })
            });
            const keyData = await keyRes.json();
            apiKey = keyData.apiKey;
            console.log("   New key generated.");
        }

        // 4. Push Workflow
        console.log("4. Pushing Workflow...");
        const wfContent = fs.readFileSync(path.join(__dirname, WF_PATH), 'utf8');
        const wfJson = JSON.parse(wfContent);

        // Ensure active is set (we'll activate via API separately to be safe)
        wfJson.active = false;

        // Try CREATE
        let wfId;
        const importRes = await fetch(`${N8N_HOST}/api/v1/workflows`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(wfJson)
        });

        if (importRes.ok) {
            const data = await importRes.json();
            wfId = data.id;
            console.log(`   Created Workflow ID: ${wfId}`);
        } else {
            console.log("   Create failed (duplicate?), checking list...");
            const listRes = await fetch(`${N8N_HOST}/api/v1/workflows`, {
                headers: { 'X-N8N-API-KEY': apiKey }
            });
            const list = await listRes.json();
            const found = list.data.find(w => w.name === wfJson.name);
            if (found) {
                wfId = found.id;
                console.log(`   Found existing ID: ${wfId}. Updating...`);
                await fetch(`${N8N_HOST}/api/v1/workflows/${wfId}`, {
                    method: 'PUT',
                    headers: {
                        'X-N8N-API-KEY': apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(wfJson)
                });
            } else {
                throw new Error("Could not find or create workflow.");
            }
        }

        // 5. Activate
        console.log("5. Activating...");
        const activateRes = await fetch(`${N8N_HOST}/api/v1/workflows/${wfId}/activate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        if (activateRes.ok) {
            console.log("🎉 Workflow ACTIVE.");
        } else {
            console.error("⚠️ Activation Warning:", await activateRes.text());
        }

    } catch (e) {
        console.error("ERROR:", e.message);
    }
}

main();
