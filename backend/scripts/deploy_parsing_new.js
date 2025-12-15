
const fs = require('fs');
const N8N_HOST = 'http://localhost:5678';
// API Key from user
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjM2Mjc1LCJleHAiOjE3NjgxOTQwMDB9.SedMQPbxYzRj2vBXyAX_CO6RtwYaPNXll7Dha2Q-BEo';

async function main() {
    try {
        console.log("📖 Reading Parsing Workflow JSON...");
        const wfContent = fs.readFileSync('backend/n8n/WF05-Parsing.json', 'utf8');
        const wf = JSON.parse(wfContent);

        // Remove ID to force creation of NEW workflow
        delete wf.id;

        const payload = {
            name: wf.name,
            nodes: wf.nodes,
            connections: wf.connections,
            settings: wf.settings
            // active: true
        };

        console.log("🚀 Creating NEW Parsing Workflow...");

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
            console.log("✅ SUCCESS: Workflow Created!");
            console.log(`🆔 Workflow ID: ${data.id}`);
            console.log(`✨ Name: ${data.name}`);
        } else {
            console.error("❌ FAILED:", response.status, data);
        }

    } catch (error) {
        console.error("💥 Error:", error);
    }
}

main();
