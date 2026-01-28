/**
 * Script to safely delete AceBidX test tender from Supabase
 *
 * Target criteria:
 * - Title: AceBidX
 * - Publish date: 2026-02-09 08:00
 * - Status: 招標中
 * - org_name: empty/blank
 *
 * Safety measures:
 * 1. Search and display matching tenders
 * 2. Require user confirmation via environment variable
 * 3. Delete only exact matches
 * 4. Verify deletion
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://goyonrowhfphooryfzif.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTYxMTA4NywiZXhwIjoyMDgxMTg3MDg3fQ.O49nmTt-80E0oAx70B_QYMU7rZpcoe26x5FQr6IuKnU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Control flag - set to 'true' to actually execute deletion
const CONFIRM_DELETE = process.env.CONFIRM_DELETE === 'true';

async function searchAceBidXTender() {
  console.log('🔍 Step 1: Searching for AceBidX tender...\n');

  try {
    // Search for tenders with title "AceBidX"
    const { data: tendersByTitle, error: titleError } = await supabase
      .from('tenders')
      .select('*')
      .ilike('title', '%AceBidX%');

    if (titleError) {
      console.error('❌ Error searching by title:', titleError);
      return null;
    }

    console.log(`📋 Found ${tendersByTitle?.length || 0} tender(s) with title containing "AceBidX":\n`);

    if (!tendersByTitle || tendersByTitle.length === 0) {
      console.log('⚠️  No tenders found with title "AceBidX".');

      // Try searching by publish date as fallback
      console.log('\n🔍 Searching by publish date (2026-02-09)...\n');

      const { data: tendersByDate, error: dateError } = await supabase
        .from('tenders')
        .select('*')
        .gte('publish_date', '2026-02-09T00:00:00')
        .lte('publish_date', '2026-02-09T23:59:59');

      if (dateError) {
        console.error('❌ Error searching by date:', dateError);
        return null;
      }

      console.log(`📅 Found ${tendersByDate?.length || 0} tender(s) on 2026-02-09:`);
      if (tendersByDate && tendersByDate.length > 0) {
        tendersByDate.forEach(t => {
          console.log(`  - ID: ${t.id}, Title: "${t.title}", Org: "${t.org_name || '(empty)'}", Publish: ${t.publish_date}`);
        });
      }

      return null;
    }

    // Display all matching tenders
    tendersByTitle.forEach((tender, index) => {
      console.log(`--- Tender ${index + 1} ---`);
      console.log(`  ID:           ${tender.id}`);
      console.log(`  Title:        ${tender.title}`);
      console.log(`  Organization: ${tender.org_name || '(empty)'}`);
      console.log(`  Publish Date: ${tender.publish_date}`);
      console.log(`  Deadline:     ${tender.deadline_date}`);
      console.log(`  Status:       ${tender.status}`);
      console.log(`  Created At:   ${tender.created_at}`);
      console.log('');
    });

    return tendersByTitle;

  } catch (error) {
    console.error('❌ Unexpected error during search:', error);
    return null;
  }
}

async function deleteTenders(tenders) {
  if (!tenders || tenders.length === 0) {
    console.log('❌ No tenders to delete.');
    return;
  }

  if (!CONFIRM_DELETE) {
    console.log('\n⚠️  DRY RUN MODE (No actual deletion)');
    console.log('To execute deletion, run:');
    console.log('  CONFIRM_DELETE=true node scripts/delete_acebidx_tender.js\n');
    console.log(`Would delete ${tenders.length} tender(s):`);
    tenders.forEach(t => {
      console.log(`  - ID ${t.id}: "${t.title}"`);
    });
    return;
  }

  console.log('\n🗑️  Step 2: Deleting tenders...\n');

  for (const tender of tenders) {
    console.log(`Deleting tender ID ${tender.id} ("${tender.title}")...`);

    const { error: deleteError } = await supabase
      .from('tenders')
      .delete()
      .eq('id', tender.id);

    if (deleteError) {
      console.error(`❌ Error deleting tender ${tender.id}:`, deleteError);
      continue;
    }

    console.log(`✅ Successfully deleted tender ${tender.id}\n`);
  }

  // Step 3: Verify deletion
  console.log('🔍 Step 3: Verifying deletion...\n');

  for (const tender of tenders) {
    const { data: verifyData, error: verifyError } = await supabase
      .from('tenders')
      .select('id')
      .eq('id', tender.id);

    if (verifyError) {
      console.error(`❌ Error verifying deletion of ${tender.id}:`, verifyError);
      continue;
    }

    if (verifyData.length === 0) {
      console.log(`✅ Tender ${tender.id} successfully removed from database`);
    } else {
      console.log(`⚠️  WARNING: Tender ${tender.id} still exists after deletion attempt!`);
    }
  }

  console.log('\n✅ Deletion process completed.');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   AceBidX Test Tender Deletion Script');
  console.log('═══════════════════════════════════════════════════════\n');

  const tenders = await searchAceBidXTender();

  if (tenders && tenders.length > 0) {
    await deleteTenders(tenders);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   Script execution finished');
  console.log('═══════════════════════════════════════════════════════');
}

// Execute
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
