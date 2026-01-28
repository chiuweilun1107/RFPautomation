/**
 * Script to delete fake tender data from Supabase
 * Target: tender with DEADLINE='AceRiot'
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://goyonrowhfphooryfzif.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTYxMTA4NywiZXhwIjoyMDgxMTg3MDg3fQ.O49nmTt-80E0oAx70B_QYMU7rZpcoe26x5FQr6IuKnU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function deleteFakeTender() {
  try {
    console.log('🔍 Searching for fake tender data...');

    // First, let's find the fake tender
    // Based on the screenshot, deadline_date is '2026-02-09T00:00:00+00:00'
    // and the data has empty title and org_name
    const { data: tenders, error: searchError } = await supabase
      .from('tenders')
      .select('*')
      .or('title.is.null,title.eq.')
      .limit(10);

    if (searchError) {
      console.error('❌ Error searching for tenders:', searchError);
      return;
    }

    console.log('\n📋 Found tenders with empty titles:');
    console.log(JSON.stringify(tenders, null, 2));

    // Find tenders with publish_date around 2026-02-09
    const { data: suspiciousTenders, error: dateSearchError } = await supabase
      .from('tenders')
      .select('*')
      .gte('publish_date', '2026-02-08')
      .lte('publish_date', '2026-02-10');

    if (dateSearchError) {
      console.error('❌ Error searching by date:', dateSearchError);
      return;
    }

    console.log('\n📅 Found tenders with publish_date around 2026-02-09:');
    console.log(JSON.stringify(suspiciousTenders, null, 2));

    // Identify the fake tender (ID 1735 with empty title and deadline_date 2026-02-09)
    const fakeTender = tenders?.find(t => t.id === 1735);

    if (!fakeTender) {
      console.log('\n⚠️  Could not find tender with ID 1735. It may have already been deleted.');
      console.log('All tenders with empty titles:', tenders);
      return;
    }

    console.log('\n🎯 Identified fake tender:');
    console.log(JSON.stringify(fakeTender, null, 2));

    // Confirm before deletion
    console.log('\n⚠️  About to delete tender with ID:', fakeTender.id);

    // Delete the fake tender
    const { error: deleteError } = await supabase
      .from('tenders')
      .delete()
      .eq('id', fakeTender.id);

    if (deleteError) {
      console.error('❌ Error deleting tender:', deleteError);
      return;
    }

    console.log('\n✅ Successfully deleted fake tender with ID:', fakeTender.id);

    // Verify deletion
    const { data: verifyData, error: verifyError } = await supabase
      .from('tenders')
      .select('*')
      .eq('id', fakeTender.id);

    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError);
      return;
    }

    if (verifyData.length === 0) {
      console.log('✅ Deletion verified - tender no longer exists in database');
    } else {
      console.log('⚠️  Warning: Tender still exists after deletion attempt');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the deletion
deleteFakeTender();
