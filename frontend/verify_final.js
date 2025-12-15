const N8N_HOST = 'http://localhost:5678';
const API_KEY = process.env.N8N_API_KEY;
const SUPABASE_URL = 'https://goyonrowhfphooryfzif.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verify() {
    try {
        console.log("🔍 Checking n8n Executions...");
        const execRes = await fetch(`${N8N_HOST}/api/v1/executions?limit=5&includeData=true`, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });

        if (execRes.ok) {
            const execData = await execRes.json();
            if (execData.data.length === 0) {
                console.log("⚠️ No executions found yet.");
            } else {
                execData.data.forEach(e => {
                    const status = e.finished ? (e.data.resultData.error ? '❌ Failed' : '✅ Success') : '⏳ Running';
                    console.log(`- Workflow: ${e.workflowId} | Status: ${status} | Time: ${new Date(e.startedAt).toLocaleTimeString()}`);
                    if (e.data.resultData.error) {
                        console.log(`  Error: ${JSON.stringify(e.data.resultData.error)}`);
                    }
                });
            }
        } else {
            console.log(`❌ n8n API Error: ${execRes.status} ${execRes.statusText}`);
        }

        console.log("\n🔍 Checking Supabase Project Status...");
        const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=title,status,created_at&order=created_at.desc&limit=1`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (dbRes.ok) {
            const projects = await dbRes.json();
            if (projects.length > 0) {
                const p = projects[0];
                console.log(`- Project: ${p.title}`);
                console.log(`- Status: ${p.status.toUpperCase()}`); // status is simple text
                console.log(`- Created: ${new Date(p.created_at).toLocaleTimeString()}`);
            } else {
                console.log("⚠️ No projects found in DB.");
            }
        } else {
            console.log(`❌ DB Error: ${dbRes.status} ${dbRes.statusText}`);
        }

    } catch (err) {
        console.error("Script Error:", err);
    }
}

verify();
