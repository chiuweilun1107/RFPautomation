const fs = require('fs');
const path = require('path');

const N8N_HOST = 'http://localhost:5678';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY4NDYzOTMzfQ.7PrirFM5pzwXqhXBgKOiOg8xkLUPDbeDhXR21pZFCeM';
const WF_ID = 'CdXPTCNuCTlz8e6r';
const WF_FILE = path.join(__dirname, '../n8n/WF02-Evaluation.json');

async function sync() {
    try {
        console.log(`Step 1: Reading local file ${WF_FILE}...`);
        const wfContent = JSON.parse(fs.readFileSync(WF_FILE, 'utf8'));

        console.log(`Step 2: Pushing to n8n (ID: ${WF_ID})...`);
        const updateRes = await fetch(`${N8N_HOST}/api/v1/workflows/${WF_ID}`, {
            method: 'PUT',
            headers: {
                'X-N8N-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: wfContent.name,
                nodes: wfContent.nodes,
                connections: wfContent.connections,
                settings: wfContent.settings || {}
            })
        });

        if (!updateRes.ok) throw new Error(`Update failed: ${await updateRes.text()}`);
        console.log("✅ Workflow content updated.");

        console.log(`Step 3: Ensuring it is ACTIVE...`);
        await fetch(`${N8N_HOST}/api/v1/workflows/${WF_ID}/activate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': API_KEY }
        });
        console.log("✅ Workflow ACTIVE.");

    } catch (e) {
        console.error("Error:", e.message);
    }
}

sync();
