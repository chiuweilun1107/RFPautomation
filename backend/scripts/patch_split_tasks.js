
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

        console.log("🩹 Patching Clean JSON to UNWIND tasks...");

        // OLD Code: returned { json: { ...parsed, projectId } } (One item)
        // NEW Code: returns parsed.tasks.map(t => ({ json: { ...t, projectId, summary } })) (Multiple items)

        cleanNode.parameters.jsCode = `
const item = $input.item.json;
const text = item.text || 
             (item.content && item.content.parts && item.content.parts[0] && item.content.parts[0].text) || 
             (item.output) || 
             '';

const cleanText = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();

let parsed = {};
try {
  parsed = JSON.parse(cleanText);
} catch (e) {
  parsed = { error: 'Failed to parse JSON', raw: text };
}

if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
    parsed.tasks = [{ title: "No tasks found", status: "pending", description: "AI could not extract tasks." }];
}

const projectId = $('Webhook').item.json.body.projectId;
const summary = parsed.summary || '';

// Unwind the tasks array into separate items for n8n to process sequentially
return parsed.tasks.map(task => ({
  json: {
    title: task.title,
    description: task.description,
    status: task.status || 'pending',
    projectId: projectId,
    summary: summary // Pass summary along for the final node
  }
}));
`;

        // Update Insert Node to use direct fields instead of task[0]
        const insertNode = workflow.nodes.find(n => n.name === 'Insert Sample Task');
        if (insertNode) {
            insertNode.parameters.bodyParameters = {
                parameters: [
                    { name: "project_id", value: "={{ $json.projectId }}" },
                    { name: "status", value: "pending" }, // Force pending
                    { name: "title", value: "={{ $json.title }}" }, // Direct access now
                    { name: "description", value: "={{ $json.description }}" } // Direct access
                ]
            };
        }

        // Update Project Node to use direct summary
        const updateNode = workflow.nodes.find(n => n.name === 'Update Project Ready');
        if (updateNode) {
            updateNode.parameters.bodyParameters = {
                parameters: [
                    { name: "status", value: "active" },
                    { name: "description", value: "={{ $json.summary }}" } // Direct access
                ]
            };
            // Ensure it uses the Webhook ID still? 
            // Yes, patch_update_node.js set URL to {{ $('Webhook')... }} which is safe.
            // But we should double check parameters are correct.
        }

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
            console.log("✅ SUCCESS: Workflow Updated to Handle Multiple Tasks!");
        } else {
            console.log("❌ FAILED:", await updateRes.json());
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
