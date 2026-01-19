
const fs = require('fs');
const N8N_HOST = 'http://localhost:5678';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NjIwNGY3ZS0xMzM1LTQ5MGUtYTUzZi1iNzBlNDI5NzEyY2IiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY3OTM1MTA5fQ.SDzUtJ5S8ScZmx77Qez6QYIFC8ERxB6z9oeJdtu43Xo';

async function main() {
    try {
        console.log("📖 Reading Management Workflow JSON...");
        const wfContent = fs.readFileSync('../n8n/WF13-Task-Generation-Management.json', 'utf8');
        const wf = JSON.parse(wfContent);

        const payload = {
            name: wf.name,
            nodes: wf.nodes,
            connections: wf.connections,
            settings: wf.settings
        };

        console.log(`🚀 Deploying ${wf.name}...`);

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
            console.log("✅ SUCCESS: Management Workflow Deployed!");
            console.log(`🆔 Workflow ID: ${data.id}`);
        } else {
            console.error("❌ FAILED:", response.status, data);
        }

    } catch (error) {
        console.error("💥 Error:", error);
    }
}

main();
