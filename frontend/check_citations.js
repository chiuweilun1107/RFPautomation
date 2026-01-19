
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTaskCitations() {
    const { data, error } = await supabase
        .from('tasks')
        .select('id, requirement_text, citation_quote, citation_source_id')
        .limit(5);

    if (error) {
        console.error('Error fetching tasks:', error);
    } else {
        console.log('Task Data Sample:', JSON.stringify(data, null, 2));
    }
}

checkTaskCitations();
