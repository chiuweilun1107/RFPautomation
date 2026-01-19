
const fs = require('fs');
const N8N_HOST = 'http://localhost:5678';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjM2Mjc1LCJleHAiOjE3NjgxOTQwMDB9.SedMQPbxYzRj2vBXyAX_CO6RtwYaPNXll7Dha2Q-BEo'; // Reusing key from deploy_drafting.js

const WORKFLOW_FILE = './backend/n8n/WF11-Task-Generation.json';

async function main() {
    try {
        console.log(`Loading ${WORKFLOW_FILE}...`);
        const workflowJson = JSON.parse(fs.readFileSync(WORKFLOW_FILE, 'utf8'));
        const workflowName = workflowJson.name;

        console.log(`🔍 Searching for existing workflow: "${workflowName}"...`);

        // 1. Search for existing workflow by name
        const listRes = await fetch(`${N8N_HOST}/api/v1/workflows`, {
            method: 'GET',
            headers: { 'X-N8N-API-KEY': API_KEY }
        });

        if (!listRes.ok) {
            throw new Error(`Failed to list workflows: ${listRes.statusText}`);
        }

        const listData = await listRes.json();
        const existing = listData.data.find(w => w.name === workflowName);

        let workflowId;

        // 2. Prepare Payload
        const payload = {
            name: workflowJson.name,
            nodes: workflowJson.nodes,
            connections: workflowJson.connections,
            settings: workflowJson.settings || {},
        };

        if (existing) {
            console.log(`✅ Found existing workflow ID: ${existing.id}`);
            workflowId = existing.id;

            // Update
            console.log("🔄 Updating workflow...");
            const updateRes = await fetch(`${N8N_HOST}/api/v1/workflows/${workflowId}`, {
                method: 'PUT',
                headers: {
                    'X-N8N-API-KEY': API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!updateRes.ok) {
                throw new Error(`Failed to update: ${await updateRes.text()}`);
            }
            console.log("✅ Update successful!");

        } else {
            console.log("✨ Creating NEW workflow...");
            const createRes = await fetch(`${N8N_HOST}/api/v1/workflows`, {
                method: 'POST',
                headers: {
                    'X-N8N-API-KEY': API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!createRes.ok) {
                throw new Error(`Failed to create: ${await createRes.text()}`);
            }
            const data = await createRes.json();
            workflowId = data.id;
            console.log(`✅ Created workflow ID: ${workflowId}`);
        }

        // 3. Activate
        console.log("🔌 Ensuring workflow is active...");
        // Check activation status first to avoid error if already active? 
        // n8n Activate endpoint handles idempotency well usually, but let's just call activate.
        const activateRes = await fetch(`${N8N_HOST}/api/v1/workflows/${workflowId}/activate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': API_KEY }
        });

        if (activateRes.ok || activateRes.status === 409) { // 409 might mean already active or conflict
            if (activateRes.status === 409) {
                // Force re-activation
                const deactivate = await fetch(`${N8N_HOST}/api/v1/workflows/${workflowId}/deactivate`, {
                    method: 'POST',
                    headers: { 'X-N8N-API-KEY': API_KEY }
                });
                const reactivate = await fetch(`${N8N_HOST}/api/v1/workflows/${workflowId}/activate`, {
                    method: 'POST',
                    headers: { 'X-N8N-API-KEY': API_KEY }
                });
                if (reactivate.ok) console.log("✅ Workflow Re-Activated!");
                else console.log("⚠️ Re-Activation failed:", await reactivate.json());
            } else {
                console.log("✅ Workflow Activated!");
            }
        } else {
            console.log("⚠️ Activation warning:", await activateRes.json());
        }

    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

main();
