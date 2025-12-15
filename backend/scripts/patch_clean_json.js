
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

        const cleanNode = workflow.nodes.find(n => n.name === 'Clean JSON');
        if (!cleanNode) throw new Error("Clean JSON node not found");

        console.log("🩹 Patching Clean JSON Logic...");

        // Robust code to find text in standard or nested LangChain structure
        cleanNode.parameters.jsCode = `
const item = $input.item.json;
// Try to find text in multiple possible locations
const text = item.text || 
             (item.content && item.content.parts && item.content.parts[0] && item.content.parts[0].text) || 
             (item.output) || 
             '';

// Clean up potential markdown
const cleanText = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();

let parsed = {};
try {
  parsed = JSON.parse(cleanText);
} catch (e) {
  parsed = { error: 'Failed to parse JSON', raw: text };
}

// Ensure tasks array exists to prevent crash
if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
    parsed.tasks = [{ title: "No tasks found in document", status: "todo", description: "AI could not extract tasks." }];
}

return {
  json: {
    ...parsed,
    projectId: $('Webhook').item.json.body.projectId
  }
};
`;

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
            console.log("✅ SUCCESS: Clean JSON Node Patched!");
        } else {
            console.log("❌ FAILED:", await updateRes.json());
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
