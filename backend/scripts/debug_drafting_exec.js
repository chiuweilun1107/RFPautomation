
const fetch = require('node-fetch');

const N8N_HOST = 'http://localhost:5678';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjM2Mjc1LCJleHAiOjE3NjgxOTQwMDB9.SedMQPbxYzRj2vBXyAX_CO6RtwYaPNXll7Dha2Q-BEo';
const WORKFLOW_ID = 'kd5nUczeOv9l69jz';

async function getExecutions() {
    try {
        const response = await fetch(`${N8N_HOST}/api/v1/executions?workflowId=${WORKFLOW_ID}&limit=1`, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });
        const data = await response.json();

        if (data.data && data.data.length > 0) {
            const execId = data.data[0].id;
            console.log("Analyzing Execution:", execId);

            const detailRes = await fetch(`${N8N_HOST}/api/v1/executions/${execId}?includeData=true`, {
                headers: { 'X-N8N-API-KEY': API_KEY }
            });
            const detail = await detailRes.json();

            if (detail && detail.status === 'error') {
                console.log("❌ Execution Error detected.");
                // structure varies by n8n version, try to find error
                // Often in data.resultData.error
                const error = detail.data?.resultData?.error || detail;
                console.log(JSON.stringify(error, null, 2));
            } else {
                console.log("✅ Check:", JSON.stringify(detail, null, 2));
            }
        } else {
            console.log("No executions found.");
        }

    } catch (e) {
        console.error(e);
    }
}

getExecutions();
