/**
 * Script to safely delete test tender ID 1738 from Supabase
 *
 * Identified test tender characteristics:
 * - ID: 1738
 * - Title: (empty)
 * - Organization: (empty)
 * - Publish Date: null
 * - Deadline: 2026-02-09
 * - Status: 招標中
 * - Created At: 2026-01-28T03:45:54
 *
 * Safety measures:
 * 1. Display tender details before deletion
 * 2. Require explicit confirmation via CONFIRM_DELETE environment variable
 * 3. Verify deletion after execution
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://goyonrowhfphooryfzif.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTYxMTA4NywiZXhwIjoyMDgxMTg3MDg3fQ.O49nmTt-80E0oAx70B_QYMU7rZpcoe26x5FQr6IuKnU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Safety control - must be explicitly set to 'true'
const CONFIRM_DELETE = process.env.CONFIRM_DELETE === 'true';

const TARGET_TENDER_ID = 1738;

async function getTenderById(id) {
  console.log(`🔍 Step 1: Fetching tender with ID ${id}...\n`);

  const { data, error } = await supabase
    .from('tenders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.error(`❌ Tender with ID ${id} not found.`);
      return null;
    }
    console.error('❌ Error fetching tender:', error);
    return null;
  }

  return data;
}

async function displayTenderDetails(tender) {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           TENDER DETAILS TO BE DELETED                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log(`  ID:                ${tender.id}`);
  console.log(`  Title:             ${tender.title || '(empty)'}`);
  console.log(`  Organization:      ${tender.org_name || '(empty)'}`);
  console.log(`  Publish Date:      ${tender.publish_date || '(null)'}`);
  console.log(`  Deadline Date:     ${tender.deadline_date}`);
  console.log(`  Status:            ${tender.status}`);
  console.log(`  Created At:        ${tender.created_at}`);
  console.log(`  Updated At:        ${tender.updated_at}`);
  console.log(`  Description:       ${tender.description ? tender.description.substring(0, 100) + '...' : '(empty)'}`);
  console.log('');
}

async function deleteTender(tenderId) {
  console.log(`🗑️  Step 2: Deleting tender ID ${tenderId}...\n`);

  const { error } = await supabase
    .from('tenders')
    .delete()
    .eq('id', tenderId);

  if (error) {
    console.error(`❌ Error deleting tender ${tenderId}:`, error);
    return false;
  }

  console.log(`✅ Tender ${tenderId} deleted successfully.\n`);
  return true;
}

async function verifyDeletion(tenderId) {
  console.log(`🔍 Step 3: Verifying deletion of tender ${tenderId}...\n`);

  const { data, error } = await supabase
    .from('tenders')
    .select('id')
    .eq('id', tenderId);

  if (error) {
    console.error('❌ Error verifying deletion:', error);
    return false;
  }

  if (data.length === 0) {
    console.log(`✅ VERIFIED: Tender ${tenderId} has been successfully removed from database.\n`);
    return true;
  } else {
    console.log(`⚠️  WARNING: Tender ${tenderId} still exists in database after deletion attempt!\n`);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('       Delete Test Tender ID 1738 Script');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Step 1: Fetch and display tender
    const tender = await getTenderById(TARGET_TENDER_ID);

    if (!tender) {
      console.log('❌ Cannot proceed - tender not found.');
      return;
    }

    await displayTenderDetails(tender);

    // Step 2: Check confirmation flag
    if (!CONFIRM_DELETE) {
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║                   DRY RUN MODE                            ║');
      console.log('╚═══════════════════════════════════════════════════════════╝\n');
      console.log('⚠️  No deletion performed (safety mode).\n');
      console.log('To execute the deletion, run:');
      console.log(`  CONFIRM_DELETE=true node scripts/delete_tender_${TARGET_TENDER_ID}.js\n`);
      return;
    }

    // Step 3: Execute deletion
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║              EXECUTING DELETION                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    const deleted = await deleteTender(TARGET_TENDER_ID);

    if (!deleted) {
      console.log('❌ Deletion failed. Aborting verification.');
      return;
    }

    // Step 4: Verify deletion
    await verifyDeletion(TARGET_TENDER_ID);

    console.log('═══════════════════════════════════════════════════════');
    console.log('       ✅ Deletion Process Completed Successfully');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Fatal error during execution:', error);
    process.exit(1);
  }
}

// Execute
main();
