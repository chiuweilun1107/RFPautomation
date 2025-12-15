
const fetch = require('node-fetch');

const N8N_HOST = 'http://localhost:5678';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjM2Mjc1LCJleHAiOjE3NjgxOTQwMDB9.SedMQPbxYzRj2vBXyAX_CO6RtwYaPNXll7Dha2Q-BEo';
const WORKFLOW_ID = 'fdg0vY1FoOrt2gMy'; // ID from previous log

async function activate() {
    console.log(`🔌 Activating workflow ${WORKFLOW_ID}...`);
    try {
        const response = await fetch(`${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}/activate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': API_KEY }
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ SUCCESS: Workflow Activated!");
            console.log("Data:", data);
        } else {
            console.log("❌ FAILED:", data);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

activate();
