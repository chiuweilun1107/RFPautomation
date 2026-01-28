/**
 * List recent tenders from Supabase to identify test data
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://goyonrowhfphooryfzif.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTYxMTA4NywiZXhwIjoyMDgxMTg3MDg3fQ.O49nmTt-80E0oAx70B_QYMU7rZpcoe26x5FQr6IuKnU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function listRecentTenders() {
  console.log('🔍 Fetching recent tenders from database...\n');

  try {
    // Get last 20 tenders ordered by created_at
    const { data: recentTenders, error } = await supabase
      .from('tenders')
      .select('id, title, org_name, publish_date, deadline_date, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('❌ Error fetching tenders:', error);
      return;
    }

    console.log(`📋 Found ${recentTenders?.length || 0} recent tenders:\n`);

    if (recentTenders && recentTenders.length > 0) {
      recentTenders.forEach((tender, index) => {
        console.log(`--- Tender ${index + 1} ---`);
        console.log(`  ID:           ${tender.id}`);
        console.log(`  Title:        ${tender.title || '(empty)'}`);
        console.log(`  Organization: ${tender.org_name || '(empty)'}`);
        console.log(`  Publish Date: ${tender.publish_date}`);
        console.log(`  Deadline:     ${tender.deadline_date}`);
        console.log(`  Status:       ${tender.status}`);
        console.log(`  Created At:   ${tender.created_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No tenders found in database.');
    }

    // Also search for tenders with future publish dates (likely test data)
    console.log('\n🔍 Searching for tenders with future publish dates...\n');

    const { data: futureTenders, error: futureError } = await supabase
      .from('tenders')
      .select('id, title, org_name, publish_date, deadline_date, status, created_at')
      .gte('publish_date', '2026-02-01')
      .order('publish_date', { ascending: true });

    if (futureError) {
      console.error('❌ Error fetching future tenders:', futureError);
      return;
    }

    console.log(`📅 Found ${futureTenders?.length || 0} tenders with future publish dates:\n`);

    if (futureTenders && futureTenders.length > 0) {
      futureTenders.forEach((tender, index) => {
        console.log(`--- Future Tender ${index + 1} ---`);
        console.log(`  ID:           ${tender.id}`);
        console.log(`  Title:        ${tender.title || '(empty)'}`);
        console.log(`  Organization: ${tender.org_name || '(empty)'}`);
        console.log(`  Publish Date: ${tender.publish_date}`);
        console.log(`  Deadline:     ${tender.deadline_date}`);
        console.log(`  Status:       ${tender.status}`);
        console.log(`  Created At:   ${tender.created_at}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

listRecentTenders().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
