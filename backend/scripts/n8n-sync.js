const fs = require('fs');
const path = require('path');

const N8N_HOST = 'http://localhost:5678';
const API_KEY = process.env.N8N_API_KEY;

if (!API_KEY) {
    console.error("Error: N8N_API_KEY environment variable is missing.");
    process.exit(1);
}

const WORKFLOW_NAME = "WF01-Document-Parsing";
const WORKFLOW_FILE = path.join(__dirname, '../n8n/WF01-Document-Parsing.json');

async function syncWorkflow() {
    try {
        // 1. Read local file
        const localWorkflow = JSON.parse(fs.readFileSync(WORKFLOW_FILE, 'utf8'));

        // 2. Find existing workflow in n8n
        console.log(`Searching for workflow: ${WORKFLOW_NAME}...`);
        const listResponse = await fetch(`${N8N_HOST}/api/v1/workflows`, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });

        if (!listResponse.ok) throw new Error(`Failed to list workflows: ${listResponse.statusText}`);

        const listData = await listResponse.json();
        const existingWorkflow = listData.data.find(w => w.name === WORKFLOW_NAME);

        if (existingWorkflow) {
            console.log(`Found workflow ID: ${existingWorkflow.id}. Updating...`);

            // 3. Update
            // Note: Update requires nodes and connections. 
            // We merge existing ID into our logical definition to keep the ID stable.
            const updatePayload = {
                name: WORKFLOW_NAME,
                nodes: localWorkflow.nodes,
                connections: localWorkflow.connections,
                settings: localWorkflow.settings || {},
                staticData: localWorkflow.staticData || null
            };

            const updateResponse = await fetch(`${N8N_HOST}/api/v1/workflows/${existingWorkflow.id}`, {
                method: 'PUT',
                headers: {
                    'X-N8N-API-KEY': API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatePayload)
            });

            if (!updateResponse.ok) {
                const errText = await updateResponse.text();
                throw new Error(`Update failed: ${errText}`);
            }

            const updated = await updateResponse.json();
            console.log(`✅ Workflow updated successfully! (Rev: ${updated.active ? 'Active' : 'Inactive'})`);

            // Ensure it's active
            if (!updated.active) {
                console.log("Activating workflow...");
                await fetch(`${N8N_HOST}/api/v1/workflows/${existingWorkflow.id}/activate`, {
                    method: 'POST',
                    headers: { 'X-N8N-API-KEY': API_KEY }
                });
                console.log("✅ Workflow activated.");
            }

        } else {
            console.log(`Workflow not found. Creating new...`);
            const createPayload = {
                name: WORKFLOW_NAME,
                nodes: localWorkflow.nodes,
                connections: localWorkflow.connections,
                settings: localWorkflow.settings || {},
            };

            const createResponse = await fetch(`${N8N_HOST}/api/v1/workflows`, {
                method: 'POST',
                headers: {
                    'X-N8N-API-KEY': API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(createPayload)
            });

            if (!createResponse.ok) {
                const errText = await createResponse.text();
                throw new Error(`Creation failed: ${errText}`);
            }
            const created = await createResponse.json();
            console.log(`✅ Workflow created successfully! ID: ${created.id}`);
        }

    } catch (error) {
        console.error("Sync Error:", error.message);
        process.exit(1);
    }
}

syncWorkflow();
