
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://goyonrowhfphooryfzif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTYxMTA4NywiZXhwIjoyMDgxMTg3MDg3fQ.O49nmTt-80E0oAx70B_QYMU7rZpcoe26x5FQr6IuKnU'; // SERVICE ROLE KEY

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const searchTitle = '附件3-建議書徵求文件.pdf';
    console.log(`Checking status for source with title like: ${searchTitle}`);

    const { data: sources, error } = await supabase
        .from('sources')
        .select('id, title, status, created_at, project_id, type')
        .ilike('title', `%${searchTitle}%`);

    if (error) {
        console.error('Error fetching source:', error);
        return;
    }

    if (sources && sources.length > 0) {
        console.log('\n--- Match Found ---');
        sources.forEach(s => {
            console.log(`Title: ${s.title}`);
            console.log(`Status: ${s.status}`); // THIS IS THE KEY FIELD
            console.log(`ID: ${s.id}`);
            console.log(`Created At: ${s.created_at}`);
            console.log(`Type: ${s.type}`);
            console.log('-------------------');
        });
    } else {
        console.log('No source found with that title.');
    }
}

main();
