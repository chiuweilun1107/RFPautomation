const fs = require('fs');
const path = require('path');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjcxMjkyfQ.84BT07fqcjpCyGorIkDxvIisyHox7yQc4WN4fxSf7RQ';
const N8N_HOST = 'http://localhost:5678';

async function main() {
    // Get file from command line arg or default
    const argPath = process.argv[2];
    if (!argPath) {
        console.error("Please provide a workflow file path");
        process.exit(1);
    }
    const workflowPath = path.resolve(process.cwd(), argPath);

    try {
        console.log(`📖 Reading Workflow JSON from ${workflowPath}...`);
        const workflowJson = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

        const payload = {
            name: workflowJson.name,
            nodes: workflowJson.nodes,
            connections: workflowJson.connections,
            settings: workflowJson.settings
            // Removed meta to avoid 400 error
        };

        // Create NEW workflow
        console.log(`🚀 Creating New Workflow...`);
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
