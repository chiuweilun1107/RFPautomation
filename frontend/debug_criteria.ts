
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const projectId = '97d1df42-e5a6-4715-b158-3d0a6687d147';

    const { data: criteriaData, error: criteriaError } = await supabase
        .from('criteria')
        .select('*');

    if (criteriaError) {
        console.error("Criteria Error:", criteriaError);
    } else {
        console.log(`Found ${criteriaData?.length} rows in criteria table.`);
        console.log(JSON.stringify(criteriaData, null, 2));
    }
}

main();
