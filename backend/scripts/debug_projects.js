const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars
// Note: We need SERVICE_ROLE_KEY to bypass RLS for debugging
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://goyonrowhfphooryfzif.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTYxMTA4NywiZXhwIjoyMDgxMTg3MDg3fQ.O49nmTt-80E0oAx70B_QYMU7rZpcoe26x5FQr6IuKnU';

if (!SERVICE_KEY) {
    console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY. Please set it in environment or hardcode for testing.");
    // Try to read from .env.local if running locally
    try {
        const envPath = path.join(__dirname, '../../frontend/.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
        if (match) {
            console.log("Found key in .env.local");
            var key = match[1];
        }
    } catch (e) {
        console.log("Could not read .env.local");
    }
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY || 'PLACEHOLDER');

async function debugProjects() {
    console.log("🔍 Fetching Projects joined with Assessments...");

    const { data: projects, error } = await supabase
        .from('projects')
        .select(`
            id,
            title,
            status,
            project_assessments (
                basic_info
            )
        `)
        .limit(5);

    if (error) {
        console.error("❌ Error fetching projects:", error);
        return;
    }

    console.log(`✅ Found ${projects.length} projects.`);

    projects.forEach(p => {
        console.log("\n------------------------------------------------");
        console.log(`🆔 Project ID: ${p.id}`);
        console.log(`📝 Title (DB): ${p.title}`);
        console.log(`📊 Status: ${p.status}`);

        const assessment = p.project_assessments ? (Array.isArray(p.project_assessments) ? p.project_assessments[0] : p.project_assessments) : null;

        if (assessment) {
            console.log("📄 Assessment Linked: YES");
            console.log("ℹ️ Basic Info:", JSON.stringify(assessment.basic_info, null, 2));

            // Check extraction
            const info = assessment.basic_info || {};
            const agency = info['主辦機關'] || info['招標機關'] || info['機關名稱'];
            const deadline = info['投標截止'] || info['截止日期'] || info['截止投標'];
            const title = info['標案名稱'];

            console.log(`🎯 Extracted Agency: ${agency}`);
            console.log(`🎯 Extracted Deadline: ${deadline}`);
            console.log(`🎯 Extracted Title: ${title}`);
        } else {
            console.log("❌ Assessment Linked: NO");
        }
    });
}

debugProjects();
