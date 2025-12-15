
const { execSync } = require('child_process');
const fs = require('fs');

// Read keys from frontend/.env.local
let envContent = '';
try {
    envContent = fs.readFileSync('frontend/.env.local', 'utf8');
} catch (e) {
    console.error("Could not read .env.local");
    process.exit(1);
}

const vars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        vars[key.trim()] = value.trim();
    }
});

const SUPABASE_URL = vars['NEXT_PUBLIC_SUPABASE_URL'];
const OPENAI_KEY = vars['OPENAI_API_KEY'];
const GEMINI_KEY = vars['GOOGLE_GEMINI_API_KEY'];
const SERVICE_KEY = vars['SUPABASE_SERVICE_ROLE_KEY'];

console.log("🚀 Starting n8n Container Update...");

try {
    console.log("⬇️  Pulling latest n8n image...");
    execSync('docker pull n8nio/n8n:latest', { stdio: 'inherit' });

    console.log("🛑 Stopping existing container...");
    try { execSync('docker stop n8n', { stdio: 'ignore' }); } catch (e) { }
    try { execSync('docker rm n8n', { stdio: 'ignore' }); } catch (e) { }

    console.log("▶️  Starting new container with ENV vars...");
    const cmd = `docker run -d --name n8n \
    -p 5678:5678 \
    -v n8n_data:/home/node/.n8n \
    -e SUPABASE_URL=${SUPABASE_URL} \
    -e SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY} \
    -e OPENAI_API_KEY=${OPENAI_KEY} \
    -e GOOGLE_GEMINI_API_KEY=${GEMINI_KEY} \
    -e N8N_SECURE_COOKIE=false \
    n8nio/n8n:latest`;

    execSync(cmd, { stdio: 'inherit' });

    console.log("✅ SUCCESS: n8n Updated and Running!");
    console.log("⏳ Waiting for health check...");

    // Poll for readiness
    for (let i = 0; i < 30; i++) {
        try {
            execSync('curl -s http://localhost:5678/healthz');
            console.log("🟢 n8n is Ready!");
            break;
        } catch (e) {
            execSync('sleep 2');
        }
    }

} catch (error) {
    console.error("❌ FAILED:", error.message);
}
