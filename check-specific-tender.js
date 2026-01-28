#!/usr/bin/env node

// 檢查特定標案的資料

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://goyonrowhfphooryfzif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTYxMTA4NywiZXhwIjoyMDgxMTg3MDg3fQ.O49nmTt-80E0oAx70B_QYMU7rZpcoe26x5FQr6IuKnU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificTender() {
    console.log('🔍 檢查特定標案：彰化縣永靖鄉衛生所暨長照衛福大樓新建工程\n');

    // 1. 搜尋標案標題
    const { data: tenders, error } = await supabase
        .from('tenders')
        .select('*')
        .ilike('title', '%彰化縣永靖鄉%');

    if (error) {
        console.error('❌ 查詢錯誤:', error);
        return;
    }

    console.log(`📊 找到 ${tenders.length} 筆相關標案\n`);

    if (tenders.length === 0) {
        console.log('❌ 資料庫中找不到這個標案！');
        console.log('');
        console.log('可能原因：');
        console.log('  1. n8n 工作流尚未抓取此標案');
        console.log('  2. 標案標題不完全一致');
        console.log('  3. 此標案不在訂閱的關鍵字範圍內');
        console.log('');

        // 搜尋相似標案
        console.log('🔍 搜尋包含「衛生所」的標案...\n');

        const { data: similar, error: similarError } = await supabase
            .from('tenders')
            .select('id, title, deadline_date, publish_date, status, keyword_tag')
            .ilike('title', '%衛生所%')
            .order('publish_date', { ascending: false })
            .limit(10);

        if (!similarError && similar.length > 0) {
            console.log('📋 找到類似標案：');
            similar.forEach((t, i) => {
                console.log(`\n${i + 1}. ${t.title}`);
                console.log(`   發布日期: ${t.publish_date || 'N/A'}`);
                console.log(`   截止日期: ${t.deadline_date || '未提供'}`);
                console.log(`   狀態: ${t.status || 'N/A'}`);
                console.log(`   關鍵字標籤: ${t.keyword_tag || 'N/A'}`);
            });
        } else {
            console.log('❌ 沒有找到類似的標案');
        }

        return;
    }

    // 2. 顯示標案詳細資訊
    tenders.forEach((tender, i) => {
        console.log(`📋 標案 ${i + 1}:`);
        console.log('='.repeat(80));
        console.log(`ID: ${tender.id}`);
        console.log(`標題: ${tender.title}`);
        console.log(`發布日期: ${tender.publish_date || 'N/A'}`);
        console.log(`截止日期: ${tender.deadline_date || '❌ 未提供'}`);
        console.log(`狀態: ${tender.status || 'N/A'}`);
        console.log(`機關: ${tender.org_name || 'N/A'}`);
        console.log(`關鍵字標籤: ${tender.keyword_tag || 'N/A'}`);
        console.log(`URL: ${tender.url || 'N/A'}`);
        console.log(`建立時間: ${tender.created_at}`);
        console.log(`更新時間: ${tender.updated_at}`);
        console.log('');

        // 3. 判斷問題
        if (!tender.deadline_date) {
            console.log('⚠️  問題診斷：');
            console.log('  ❌ deadline_date 為 NULL');
            console.log('');
            console.log('可能原因：');
            console.log('  1. n8n 工作流在抓取時，AceBidX 網站上尚未提供截止日期');
            console.log('  2. n8n 解析 deadline_date 的邏輯有誤');
            console.log('  3. AceBidX API 回傳的資料中沒有 deadline_date 欄位');
            console.log('');
            console.log('解決方案：');
            console.log('  1. 檢查 n8n 工作流的資料抓取邏輯');
            console.log('  2. 手動從網站抓取資料並更新');
            console.log('  3. 設定定期重新抓取更新標案資料');
        } else {
            const deadlineDate = new Date(tender.deadline_date);
            const now = new Date();
            const isExpired = deadlineDate <= now;

            console.log('✅ deadline_date 存在');
            console.log(`   截止時間: ${deadlineDate.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`);
            console.log(`   是否已過期: ${isExpired ? '是' : '否'}`);
        }
        console.log('');
    });

    // 4. 統計沒有 deadline_date 的標案數量
    console.log('='.repeat(80));
    console.log('📊 統計資料：沒有截止日期的標案');
    console.log('='.repeat(80));

    const { count: noDeadlineCount } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true })
        .is('deadline_date', null);

    const { count: totalCount } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true });

    console.log(`總標案數: ${totalCount}`);
    console.log(`沒有截止日期: ${noDeadlineCount} 筆`);
    console.log(`比例: ${((noDeadlineCount / totalCount) * 100).toFixed(1)}%`);
    console.log('');

    if (noDeadlineCount > 0) {
        console.log('⚠️  發現大量標案沒有截止日期！');
        console.log('');
        console.log('這表示：');
        console.log('  1. n8n 工作流可能沒有正確抓取 deadline_date');
        console.log('  2. AceBidX 網站上很多標案確實沒有提供截止日期');
        console.log('  3. 需要檢查 n8n 工作流的資料來源和解析邏輯');
    }
}

checkSpecificTender().catch(console.error);
