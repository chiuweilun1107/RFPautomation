
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

        console.log("🩹 Patching Update Node Reference...");

        // Fix the URL to use Webhook data source directly instead of relying on previous node output
        // Previous: ...?id=eq.{{ $json.projectId }} (Failed because input json changed)
        // New: ...?id=eq.{{ $('Webhook').item.json.body.projectId }} (Reliable)
        updateNode.parameters.url = `=https://goyonrowhfphooryfzif.supabase.co/rest/v1/projects?id=eq.{{ $('Webhook').item.json.body.projectId }}`;

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
            console.log("✅ SUCCESS: Fixed Project ID Reference!");
        } else {
            console.log("❌ FAILED:", await updateRes.json());
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
