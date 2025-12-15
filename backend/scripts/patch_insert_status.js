
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

        const insertNode = workflow.nodes.find(n => n.name === 'Insert Sample Task');
        if (!insertNode) throw new Error("Insert Sample Task node not found");

        console.log("🩹 Patching Status Value...");

        // Correct the status check constraint violation
        // Database only allows: 'pending', 'drafted', 'reviewing', 'approved', 'locked'
        insertNode.parameters.bodyParameters = {
            parameters: [
                { name: "project_id", value: "={{ $json.projectId }}" },
                { name: "status", value: "pending" },  // FIXED: 'todo' -> 'pending'
                { name: "title", value: "={{ $json.tasks[0].title }}" },
                { name: "description", value: "={{ $json.tasks[0].description }}" }
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
            console.log("✅ SUCCESS: Fixed Status Value (pending)!");
        } else {
            console.log("❌ FAILED:", await updateRes.json());
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
