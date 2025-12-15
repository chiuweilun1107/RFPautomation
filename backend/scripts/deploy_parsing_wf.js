
const fs = require('fs');
const N8N_HOST = 'http://localhost:5678';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjM2Mjc1LCJleHAiOjE3NjgxOTQwMDB9.SedMQPbxYzRj2vBXyAX_CO6RtwYaPNXll7Dha2Q-BEo';

async function main() {
    try {
        console.log("📖 Reading Parsing Workflow JSON...");
        const wfContent = fs.readFileSync('backend/n8n/WF05-Parsing.json', 'utf8');
        const wf = JSON.parse(wfContent);

        const payload = {
            name: wf.name,
            nodes: wf.nodes,
            connections: wf.connections,
            settings: wf.settings
            // active: true
        };

        const WF_ID = 'VBks7CxGIOpEaPL4';
        console.log(`🚀 Upgrading Workflow ${WF_ID} to Parsing Logic...`);

        const response = await fetch(`${N8N_HOST}/api/v1/workflows/${WF_ID}`, {
            method: 'PUT',
            headers: {
                'X-N8N-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ SUCCESS: Workflow Upgraded!");
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
