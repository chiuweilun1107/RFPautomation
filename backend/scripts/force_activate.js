const N8N_HOST = 'http://localhost:5678';
const API_KEY = process.env.N8N_API_KEY;
const WF_ID = 'SZ4BOhfdnzhsa8H2';

async function forceActivate() {
    try {
        console.log(`1. Deactivating ${WF_ID}...`);
        await fetch(`${N8N_HOST}/api/v1/workflows/${WF_ID}/deactivate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': API_KEY }
        });

        console.log("   Waiting 1s...");
        await new Promise(r => setTimeout(r, 1000));

        console.log(`2. Activating ${WF_ID}...`);
        const res = await fetch(`${N8N_HOST}/api/v1/workflows/${WF_ID}/activate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': API_KEY }
        });

        if (res.ok) {
            console.log("✅ Activated via API.");
        } else {
            console.log(`❌ Activation failed: ${res.status} ${await res.text()}`);
        }

        console.log("3. Verifying Webhook Registration...");
        // Wait for registration
        await new Promise(r => setTimeout(r, 1000));

        const webhookTest = await fetch(`${N8N_HOST}/webhook/parse-rfp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
        });

        console.log(`   Webhook Response: ${webhookTest.status} ${webhookTest.statusText}`);
        if (webhookTest.status === 200) {
            const text = await webhookTest.text();
            console.log(`   Response Body: ${text}`);
            console.log("🚀 Webhook is LIVE and REGISTERED!");
        } else {
            console.log(`⚠️ Webhook still failing: ${await webhookTest.text()}`);
        }

    } catch (e) {
        console.error(e);
    }
}

forceActivate();
