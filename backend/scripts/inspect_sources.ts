
import { createClient } from '@supabase/supabase-js';

// import dotenv from 'dotenv';
// import path from 'path';

// Load env from frontend/.env.local
// dotenv.config({ path: path.resolve(__dirname, '../../frontend/.env.local') });

const supabaseUrl = 'https://goyonrowhfphooryfzif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTYxMTA4NywiZXhwIjoyMDgxMTg3MDg3fQ.O49nmTt-80E0oAx70B_QYMU7rZpcoe26x5FQr6IuKnU'; // SERVICE ROLE KEY


const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const projectId = 'c932b539-36d4-43a3-8d22-2853a58a9ecf';

    console.log(`Inspecting sources for project: ${projectId}`);

    // 1. Fetch project_sources
    const { data: projectSources, error: psError } = await supabase
        .from('project_sources')
        .select('source_id, created_at')
        .eq('project_id', projectId);

    if (psError) {
        console.error('Error fetching project_sources:', psError);
        return;
    }

    console.log(`Found ${projectSources.length} linked sources.`);

    if (projectSources.length > 0) {
        const sourceIds = projectSources.map(ps => ps.source_id);
        const { data: sources, error: sError } = await supabase
            .from('sources')
            .select('*')
            .in('id', sourceIds);

        if (sError) console.error('Error fetching sources:', sError);
        else {
            console.log('\n--- Project Sources ---');
            sources.forEach(s => {
                console.log(`ID: ${s.id}`);
                console.log(`Title: ${s.title}`);
                console.log(`Project ID: ${s.project_id}`);
                console.log(`Type: ${s.type}`); // checking if type column exists
                console.log(`Origin URL: ${s.origin_url}`);
                console.log(`Metadata:`, s.metadata);
                console.log('---------------------------');
            });
        }
    }

    // 2. Fetch one internal source (project_id is null)
    console.log('\n--- Internal Source Sample ---');
    const { data: internalSources, error: iError } = await supabase
        .from('sources')
        .select('*')
        .is('project_id', null)
        .limit(1);

    if (iError) console.error('Error fetching internal source:', iError);
    else if (internalSources.length > 0) {
        const s = internalSources[0];
        console.log(`ID: ${s.id}`);
        console.log(`Title: ${s.title}`);
        console.log(`Project ID: ${s.project_id}`); // Should be null
        console.log(`Type: ${s.type}`);
        console.log(`Origin URL: ${s.origin_url}`);
        console.log(`Metadata:`, s.metadata);
    } else {
        console.log('No internal sources found.');
    }
}

main();
