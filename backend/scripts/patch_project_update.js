
const fs = require('fs');
const N8N_HOST = 'http://localhost:5678';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjM2Mjc1LCJleHAiOjE3NjgxOTQwMDB9.SedMQPbxYzRj2vBXyAX_CO6RtwYaPNXll7Dha2Q-BEo';
const WORKFLOW_ID = 'pHmmxSuYjtRMAxny';

async function main() {
    try {
        console.log("📥 Fetching workflow...");
        const response = await fetch(`${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}`, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });
        const workflow = await response.json();

        const updateNode = workflow.nodes.find(n => n.name === 'Update Project Ready');
        if (!updateNode) throw new Error("Update Project Ready node not found");

        console.log("🩹 Patching Project Status...");

        // Correct the status check constraint violation
        // Projects DB only allows: 'draft', 'processing', 'active', 'completed'
        // Workflow was trying to set 'ready'
        updateNode.parameters.bodyParameters = {
            parameters: [
                { name: "status", value: "active" }, // FIXED: 'ready' -> 'active'
                { name: "description", value: "={{ $json.summary }}" }
            ]
        };

        const updatePayload = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings
        };

        const updateRes = await fetch(`${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}`, {
            method: 'PUT',
            headers: {
                'X-N8N-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatePayload)
        });

        if (updateRes.ok) {
            console.log("✅ SUCCESS: Fixed Project Status (active)!");
        } else {
            console.log("❌ FAILED:", await updateRes.json());
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
