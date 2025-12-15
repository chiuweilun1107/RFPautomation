
const fs = require('fs');
const N8N_HOST = 'http://localhost:5678';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjM2Mjc1LCJleHAiOjE3NjgxOTQwMDB9.SedMQPbxYzRj2vBXyAX_CO6RtwYaPNXll7Dha2Q-BEo';

async function main() {
    try {
        // 1. Get latest execution
        const listRes = await fetch(`${N8N_HOST}/api/v1/executions?limit=1&includeData=true`, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });

        const listData = await listRes.json();

        if (!listData.data || listData.data.length === 0) {
            console.log("No executions found.");
            return;
        }

        const execution = listData.data[0];
        console.log(`🆔 ID: ${execution.id}`);
        console.log(`❌ Status: ${execution.finished ? (execution.data.resultData.error ? 'ERROR' : 'SUCCESS') : 'RUNNING'}`);

        if (execution.data && execution.data.resultData.runData) {
            const runData = execution.data.resultData.runData;

            // Check Clean JSON output
            if (runData['Clean JSON']) {
                console.log("\n🧹 Clean JSON Output:");
                console.log(JSON.stringify(runData['Clean JSON'][0].data.main[0], null, 2));
            } else {
                console.log("\n⚠️ Clean JSON did not run or has no data.");
            }

            // Check Gemini output (Analyze document)
            if (runData['Analyze document']) {
                console.log("\n🤖 Gemini Output:");
                console.log(JSON.stringify(runData['Analyze document'][0].data.main[0], null, 2));
            } else if (runData['Message a model']) {
                console.log("\n🤖 Gemini Output (Message a model):");
                console.log(JSON.stringify(runData['Message a model'][0].data.main[0], null, 2));
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
