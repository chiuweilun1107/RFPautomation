const N8N_HOST = 'http://localhost:5678';
const API_KEY = process.env.N8N_API_KEY;

if (!API_KEY) {
    console.error("Missing N8N_API_KEY");
    process.exit(1);
}

async function inspectSchema() {
    try {
        console.log("Fetching Supabase credential schema...");
        // Fetch credential type definition
        // Note: Endpoint availability varies by version. 
        // /credential-types/supabaseApi might work.

        const res = await fetch(`${N8N_HOST}/api/v1/credential-types`, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });

        if (!res.ok) {
            throw new Error(`Fetch failed: ${res.statusText}`);
        }

        const data = await res.json();
        // Find supabase related
        const supabaseCreds = data.data.filter(c => c.name.toLowerCase().includes('supabase'));

        console.log("Found Supabase Credential Types:");
        console.log(JSON.stringify(supabaseCreds, null, 2));

    } catch (error) {
        console.error("Inspect Error:", error.message);
    }
}

inspectSchema();
