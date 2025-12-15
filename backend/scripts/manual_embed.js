
const { createClient } = require('@supabase/supabase-js');
// const fetch = require('node-fetch'); // Native fetch in Node 18+

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://goyonrowhfphooryfzif.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Requires service role for storage/db update
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

if (!SUPABASE_KEY || !GEMINI_API_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY or GOOGLE_GEMINI_API_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function embedText(text) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: { parts: [{ text }] }
            })
        }
    );
    const data = await response.json();
    if (!data.embedding) throw new Error(JSON.stringify(data));
    return data.embedding.values;
}

async function processPendingDocs() {
    console.log("🔍 Fetching pending documents...");
    const { data: docs, error } = await supabase
        .from('knowledge_docs')
        .select('*')
        .eq('embedding_status', 'pending');

    if (error) {
        console.error("Error fetching docs:", error);
        return;
    }

    if (!docs || docs.length === 0) {
        console.log("✅ No pending documents found.");
        return;
    }

    console.log(`Found ${docs.length} docs. Processing...`);

    for (const doc of docs) {
        try {
            console.log(`📄 Processing ${doc.filename}...`);

            // 1. Download Content
            const { data: fileData, error: dlError } = await supabase.storage
                .from('documents')
                .download(doc.file_path);

            if (dlError) throw dlError;

            const text = await fileData.text();

            // 2. Chunking (Simple)
            const CHUNK_SIZE = 1000;
            const chunks = [];
            for (let i = 0; i < text.length; i += CHUNK_SIZE) {
                chunks.push(text.slice(i, i + CHUNK_SIZE));
            }

            // 3. Embed & Insert
            for (const chunk of chunks) {
                const embedding = await embedText(chunk);
                await supabase.from('document_embeddings').insert({
                    doc_id: doc.id,
                    chunk_text: chunk,
                    embedding
                });
            }

            // 4. Update Status
            await supabase.from('knowledge_docs')
                .update({ embedding_status: 'embedded' })
                .eq('id', doc.id);

            console.log(`✅ Completed ${doc.filename}`);

        } catch (err) {
            console.error(`❌ Failed ${doc.filename}:`, err.message);
        }
    }
}

processPendingDocs();
