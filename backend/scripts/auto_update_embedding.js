
const fs = require('fs');
const path = require('path');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjQ1NTY5fQ.yJLUhF9fMabDikB2wRa4LAac_95vG1yfXSDczU5s-x8';
const N8N_HOST = 'http://localhost:5678';
const FILE_PATH = path.join(__dirname, '../n8n/WF07-Embedding.json');

async function main() {
    try {
        console.log("📖 Reading Workflow JSON...");
        const rawWf = fs.readFileSync(FILE_PATH, 'utf8');
        const wf = JSON.parse(rawWf);

        // 1. Get All Workflows to find existing one by name
        console.log("🔍 Searching for existing workflow...");
        const listRes = await fetch(`${N8N_HOST}/api/v1/workflows`, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });

        if (!listRes.ok) {
            throw new Error(`Failed to list workflows: ${listRes.status}`);
        }

        const data = await listRes.json();
        const existing = data.data.find(w => w.name === wf.name);

        let workflowId;

        const payload = {
            name: wf.name,
            nodes: wf.nodes,
            connections: wf.connections,
            settings: wf.settings
        };

        if (existing) {
            console.log(`🔄 Found existing workflow ${existing.id}. Updating...`);
            workflowId = existing.id;
            const updateRes = await fetch(`${N8N_HOST}/api/v1/workflows/${workflowId}`, {
                method: 'PUT',
                headers: {
                    'X-N8N-API-KEY': API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!updateRes.ok) throw new Error(`Update failed: ${updateRes.status}`);
            console.log("✅ Workflow updated.");
        } else {
            console.log("🆕 Creating new workflow...");
            const createRes = await fetch(`${N8N_HOST}/api/v1/workflows`, {
                method: 'POST',
                headers: {
                    'X-N8N-API-KEY': API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!createRes.ok) throw new Error(`Create failed: ${createRes.status}`);
            const created = await createRes.json();
            workflowId = created.id;
            console.log(`✅ Workflow created: ${workflowId}`);
        }

        // 2. Activate it
        console.log("⚡ Activating...");
        const activateRes = await fetch(`${N8N_HOST}/api/v1/workflows/${workflowId}/activate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': API_KEY }
        });

        if (activateRes.ok) {
            console.log("🟢 Workflow is ACTIVE!");
        } else {
            console.log("⚠️ Could not activate (might be missing credentials or already active).");
        }

    } catch (error) {
        console.error("💥 Error:", error);
    }
}

main();
