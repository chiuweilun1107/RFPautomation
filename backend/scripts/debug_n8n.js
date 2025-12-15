// const fetch = require('node-fetch'); // Use built-in fetch

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjQ1NTY5fQ.yJLUhF9fMabDikB2wRa4LAac_95vG1yfXSDczU5s-x8';
const N8N_HOST = 'http://localhost:5678';

async function main() {
    try {
        // List workflows
        const listRes = await fetch(`${N8N_HOST}/api/v1/workflows`, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });
        const data = await listRes.json();
        const existing = data.data.find(w => w.name === 'WF07-Embedding');

        if (existing) {
            console.log(`Found workflow: ${existing.id}`);
            // Get full details
            const detailRes = await fetch(`${N8N_HOST}/api/v1/workflows/${existing.id}`, {
                headers: { 'X-N8N-API-KEY': API_KEY }
            });
            const detail = await detailRes.json();
            console.log(JSON.stringify(detail, null, 2));
        } else {
            console.log("Workflow not found");
        }
    } catch (e) {
        console.error(e);
    }
}

main();
