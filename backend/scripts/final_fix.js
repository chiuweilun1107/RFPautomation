const N8N_HOST = 'http://localhost:5678';
const API_KEY = process.env.N8N_API_KEY;
const WF_ID = 'SZ4BOhfdnzhsa8H2';

async function waitAndActivate() {
    console.log("Waiting for n8n to be ready...");
    for (let i = 0; i < 30; i++) { // 30 seconds max
        try {
            const res = await fetch(`${N8N_HOST}/healthz`);
            if (res.ok) {
                console.log("n8n is UP!");
                break;
            }
        } catch (e) { }
        await new Promise(r => setTimeout(r, 1000));
    }

    try {
        console.log("Activating...");
        const res = await fetch(`${N8N_HOST}/api/v1/workflows/${WF_ID}/activate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': API_KEY }
        });
        const text = await res.text();
        console.log(`Activation Result: ${res.status} ${text}`);
    } catch (e) {
        console.error("Activation Failed:", e.message);
    }
}

waitAndActivate();
