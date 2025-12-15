
const fs = require('fs');
const N8N_HOST = 'http://localhost:5678';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjM2Mjc1LCJleHAiOjE3NjgxOTQwMDB9.SedMQPbxYzRj2vBXyAX_CO6RtwYaPNXll7Dha2Q-BEo';

const WORKFLOW_FILE = './backend/n8n/WF06-Drafting-v5.json';

async function main() {
    try {
        console.log(`📤 deploying ${WORKFLOW_FILE}...`);
        const workflowJson = JSON.parse(fs.readFileSync(WORKFLOW_FILE, 'utf8'));

        // 1. Create Workflow
        const payload = {
            name: workflowJson.name,
            nodes: workflowJson.nodes,
            connections: workflowJson.connections,
            settings: workflowJson.settings || {},
            // active: true // REMOVED: Read-only
        };

        const response = await fetch(`${N8N_HOST}/api/v1/workflows`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Workflow Created Successfully!");
            console.log("ID:", data.id);

            // 2. Activate Workflow
            console.log("🔌 Activating workflow...");
            const activateRes = await fetch(`${N8N_HOST}/api/v1/workflows/${data.id}/activate`, {
                method: 'POST',
                headers: { 'X-N8N-API-KEY': API_KEY }
            });

            if (activateRes.ok) {
                console.log("✅ Workflow Activated!");
            } else {
                console.log("⚠️ Activation failed (try manual):", await activateRes.json());
            }

        } else {
            console.error("❌ Failed:", data);
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
