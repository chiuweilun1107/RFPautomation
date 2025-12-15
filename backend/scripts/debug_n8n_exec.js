const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjQ1NTY5fQ.yJLUhF9fMabDikB2wRa4LAac_95vG1yfXSDczU5s-x8';
const N8N_HOST = 'http://localhost:5678';

async function main() {
    try {
        const res = await fetch(`${N8N_HOST}/api/v1/executions?limit=5`, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();
