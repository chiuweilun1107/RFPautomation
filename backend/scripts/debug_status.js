const { createClient } = require('@supabase/supabase-js');

const N8N_HOST = 'http://localhost:5678';
const API_KEY = process.env.N8N_API_KEY;
const SUPABASE_URL = 'https://goyonrowhfphooryfzif.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!API_KEY || !SUPABASE_KEY) {
    console.error("Missing keys");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkStatus() {
    try {
        console.log("--- Checking Supabase Project Status ---");
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) console.error("DB Error:", error.message);
        else {
            const p = projects[0];
            console.log(`Latest Project: ${p.title} (ID: ${p.id})`);
            console.log(`Status: ${p.status}`);
            console.log(`Created At: ${p.created_at}`);
        }

        console.log("\n--- Checking n8n Executions ---");
        const res = await fetch(`${N8N_HOST}/api/v1/executions?limit=5`, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });

        if (!res.ok) {
            console.log(`n8n API Executions Error: ${res.statusText}`);
        } else {
            const execData = await res.json();
            if (execData.data.length === 0) {
                console.log("No recent executions found in n8n.");
            } else {
                execData.data.forEach(e => {
                    console.log(`Execution ID: ${e.id} | Workflow: ${e.workflowId} | Status: ${e.finished ? (e.data.resultData.error ? '❌ Failed' : '✅ Success') : '⏳ Running'}`);
                });
            }
        }

    } catch (error) {
        console.error("Check Error:", error.message);
    }
}

checkStatus();
