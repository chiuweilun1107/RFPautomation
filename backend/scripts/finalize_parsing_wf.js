
const fs = require('fs');
const N8N_HOST = 'http://localhost:5678';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjM2Mjc1LCJleHAiOjE3NjgxOTQwMDB9.SedMQPbxYzRj2vBXyAX_CO6RtwYaPNXll7Dha2Q-BEo';
const WORKFLOW_ID = 'pHmmxSuYjtRMAxny';

async function main() {
    try {
        console.log("📥 Fetching current workflow...");
        const response = await fetch(`${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}`, {
            method: 'GET',
            headers: { 'X-N8N-API-KEY': API_KEY }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const workflow = await response.json();
        const nodes = workflow.nodes;
        const connections = workflow.connections;

        console.log("🔧 Injecting Parsing Logic...");

        // 1. Find and Update Gemini Node
        const geminiNode = nodes.find(n => n.name === 'Analyze document');
        if (!geminiNode) {
            throw new Error("Generic 'Analyze document' node not found!");
        }

        // Add the critical Prompt for JSON extraction
        geminiNode.parameters.text = `You are a professional RFP analyst. Analyze the attached document and extract key information into a strict JSON structure.

Required JSON Format:
{
  "summary": "Brief project summary",
  "tasks": [
    { "title": "Task Name", "description": "Details", "status": "todo" }
  ],
  "timeline": [
    { "phase": "Phase Name", "date": "YYYY-MM-DD" }
  ]
}

Return ONLY the JSON. No markdown backticks.`;

        // Increase Max Tokens to avoid truncation
        if (!geminiNode.parameters.options) geminiNode.parameters.options = {};
        geminiNode.parameters.options.maxOutputTokens = 8192;

        // 2. Fix Connections
        // Ensure Download -> Analyze
        if (!connections['Download File']) {
            connections['Download File'] = { main: [[{ node: 'Analyze document', type: 'main', index: 0 }]] };
        }

        // Ensure Analyze -> Clean JSON (Crucial Link!)
        connections['Analyze document'] = {
            main: [[
                { node: 'Clean JSON', type: 'main', index: 0 }
            ]]
        };

        // Ensure Clean JSON -> Insert Tasks (Should already exist)
        if (!connections['Clean JSON']) {
            connections['Clean JSON'] = { main: [[{ node: 'Insert Sample Task', type: 'main', index: 0 }]] };
        }

        // 3. Update Workflow
        const updatePayload = {
            name: workflow.name, // Required field
            nodes: nodes,
            connections: connections,
            settings: workflow.settings
            // active: true // Removed to avoid 400 error
        };

        console.log("pw Sending update...");
        const updateResponse = await fetch(`${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}`, {
            method: 'PUT',
            headers: {
                'X-N8N-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatePayload)
        });

        const updateData = await updateResponse.json();

        if (updateResponse.ok) {
            console.log("✅ SUCCESS: Workflow Logic Integrated!");
            console.log("Ready to Activate and Test!");
        } else {
            console.error("❌ FAILED UPDATE:", updateData);
        }

    } catch (error) {
        console.error("💥 Error:", error);
    }
}

main();
