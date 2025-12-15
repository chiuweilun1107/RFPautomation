const { execSync } = require('child_process');

// Config
const N8N_HOST = 'http://localhost:5678';
const WF_ID = 'SZ4BOhfdnzhsa8H2';
const API_KEY = process.env.N8N_API_KEY;

// Helpers
const delay = ms => new Promise(r => setTimeout(r, ms));

async function checkHealth() {
    try {
        const res = await fetch(`${N8N_HOST}/healthz`);
        return res.ok;
    } catch { return false; }
}

async function activateWorkflow() {
    try {
        // Activate (idempotent-ish)
        const res = await fetch(`${N8N_HOST}/api/v1/workflows/${WF_ID}/activate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': API_KEY }
        });
        const text = await res.text();
        return res.ok;
    } catch (e) {
        console.error("Activation Error:", e.message);
        return false;
    }
}

async function main() {
    console.log("🛠️  Initiating n8n Repair Sequence...");

    // 1. Restart Container
    console.log("🔄 Restarting Docker Container...");
    try {
        execSync('docker restart n8n', { stdio: 'ignore' });
    } catch (e) {
        console.error("Docker restart failed. Output:", e.message);
        // Try start just in case it was stopped
        try { execSync('docker start n8n', { stdio: 'ignore' }); } catch { }
    }

    // 2. Poll for Health
    console.log("tc  Waiting for Service (max 60s)...");
    const start = Date.now();
    let healthy = false;

    while (Date.now() - start < 60000) {
        if (await checkHealth()) {
            healthy = true;
            console.log("\n✅ n8n Service is UP!");
            break;
        }
        process.stdout.write(".");
        await delay(2000);
    }

    if (!healthy) {
        console.error("\n❌ Service failed to recover.");
        process.exit(1);
    }

    // 3. Ensure Workflow Active
    console.log("🔌 Checking Workflow Activation...");
    // Give it a moment to load DB
    await delay(2000);

    const active = await activateWorkflow();
    if (active) {
        console.log("✅ Workflow 'WF01-Document-Parsing' is ACTIVE.");
    } else {
        console.error("⚠️  Workflow Activation Failed.");
        // Non-fatal, service is up at least
    }

    console.log("🎉 System Ready.");
}

main();
