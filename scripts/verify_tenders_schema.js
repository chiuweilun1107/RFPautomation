const { Client } = require('pg');

// Using connection pooler details from backend/.env
// DB_HOST=aws-1-ap-northeast-1.pooler.supabase.com
// DB_PORT=6543
// DB_USER=postgres.goyonrowhfphooryfzif
// DB_PASS=9963GhOTa0jZSTi4
const connectionString = 'postgresql://postgres.goyonrowhfphooryfzif:9963GhOTa0jZSTi4@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function main() {
    try {
        console.log('Connecting to Supabase (Pooler)...');
        await client.connect();
        console.log('Connected successfully.');

        // Check if tenders table exists
        const checkTableQuery = "SELECT to_regclass('public.tenders');";
        const res = await client.query(checkTableQuery);

        if (!res.rows[0].to_regclass) {
            console.error('Error: public.tenders table does not exist!');
            process.exit(1);
        }
        console.log('Table public.tenders exists.');

        // Check for status column
        const checkStatusQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenders' 
        AND column_name = 'status';
    `;
        const statusRes = await client.query(checkStatusQuery);
        if (statusRes.rows.length === 0) {
            console.log('Adding status column...');
            await client.query("ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '招標中';");
            await client.query("COMMENT ON COLUMN public.tenders.status IS '標案狀態：招標中、已撤案、已廢標、已決標等';");
            console.log('Status column added.');
        } else {
            console.log('Status column already exists.');
        }

        // Check for deadline_date column
        const checkDeadlineQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenders' 
        AND column_name = 'deadline_date';
    `;
        const deadlineRes = await client.query(checkDeadlineQuery);
        if (deadlineRes.rows.length === 0) {
            console.log('Adding deadline_date column...');
            await client.query("ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS deadline_date TIMESTAMP WITH TIME ZONE;");
            await client.query("COMMENT ON COLUMN public.tenders.deadline_date IS '投標截止日期';");
            console.log('Deadline_date column added.');
        } else {
            console.log('Deadline_date column already exists.');
        }

        console.log('Schema verification completed successfully.');

    } catch (err) {
        console.error('Database error:', err);
        console.error('Detail:', err.message);
    } finally {
        await client.end();
    }
}

main();
