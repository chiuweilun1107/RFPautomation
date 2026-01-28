#!/usr/bin/env node

// 詳細檢查 deadline_date 的時區和格式問題

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://goyonrowhfphooryfzif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTYxMTA4NywiZXhwIjoyMDgxMTg3MDg3fQ.O49nmTt-80E0oAx70B_QYMU7rZpcoe26x5FQr6IuKnU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeadlineDetails() {
    console.log('🔍 詳細檢查 deadline_date...\n');

    // 1. 查詢所有標案的 deadline_date
    const { data: tenders, error } = await supabase
        .from('tenders')
        .select('id, title, deadline_date, status, publish_date')
        .order('deadline_date', { ascending: false })
        .limit(50);

    if (error) {
        console.error('❌ 錯誤:', error);
        return;
    }

    console.log(`📋 查詢到 ${tenders.length} 筆標案\n`);

    // 當前時間
    const now = new Date();
    const nowUTC = now.toISOString();
    const nowLocal = now.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

    console.log('⏰ 當前時間：');
    console.log(`  UTC: ${nowUTC}`);
    console.log(`  台北時間: ${nowLocal}`);
    console.log('');

    // 2. 分析 deadline_date 格式
    console.log('📊 Deadline Date 分析（前 20 筆）：');
    console.log('='.repeat(80));

    let expiredCount = 0;
    let notExpiredCount = 0;

    tenders.slice(0, 20).forEach((t, i) => {
        if (!t.deadline_date) {
            console.log(`${i + 1}. [無截止日期] ${t.title.substring(0, 40)}...`);
            console.log(`   Status: ${t.status || 'NULL'}`);
            console.log('');
            return;
        }

        const deadlineDate = new Date(t.deadline_date);
        const isExpired = deadlineDate <= now;
        const statusCorrect = isExpired ? (t.status === '已截止') : (t.status === '招標中' || !t.status);

        expiredCount += isExpired ? 1 : 0;
        notExpiredCount += isExpired ? 0 : 1;

        const icon = isExpired ? '🔴' : '🟢';
        const statusIcon = statusCorrect ? '✅' : '❌';

        console.log(`${i + 1}. ${icon} ${t.title.substring(0, 40)}...`);
        console.log(`   Deadline: ${t.deadline_date}`);
        console.log(`   Parsed: ${deadlineDate.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`);
        console.log(`   已過期: ${isExpired ? '是' : '否'}`);
        console.log(`   Status: ${t.status || 'NULL'} ${statusIcon}`);
        console.log('');
    });

    console.log('='.repeat(80));
    console.log(`前 20 筆中：已過期 ${expiredCount} 筆，未過期 ${notExpiredCount} 筆`);
    console.log('');

    // 3. 統計所有 deadline_date 的格式
    console.log('📊 Deadline Date 格式分析：');
    console.log('='.repeat(80));

    const dateFormats = {};
    tenders.forEach(t => {
        if (t.deadline_date) {
            // 檢查格式
            const hasTime = t.deadline_date.includes(':');
            const format = hasTime ? 'DateTime (含時間)' : 'Date Only (僅日期)';
            dateFormats[format] = (dateFormats[format] || 0) + 1;
        }
    });

    Object.entries(dateFormats).forEach(([format, count]) => {
        console.log(`  ${format}: ${count} 筆`);
    });
    console.log('');

    // 4. 檢查今天和最近的截止日期
    console.log('📊 今天和最近截止的標案：');
    console.log('='.repeat(80));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    console.log(`今天日期: ${todayStr}`);
    console.log('');

    // 查詢今天之前的標案（含今天）
    const { data: recentTenders, error: recentError } = await supabase
        .from('tenders')
        .select('id, title, deadline_date, status')
        .not('deadline_date', 'is', null)
        .lte('deadline_date', nowUTC)
        .order('deadline_date', { ascending: false })
        .limit(10);

    if (recentError) {
        console.error('❌ 錯誤:', recentError);
        return;
    }

    console.log(`找到 ${recentTenders.length} 筆已截止標案：\n`);

    recentTenders.forEach((t, i) => {
        const deadlineDate = new Date(t.deadline_date);
        console.log(`${i + 1}. ${t.title.substring(0, 50)}...`);
        console.log(`   Deadline: ${t.deadline_date}`);
        console.log(`   Parsed: ${deadlineDate.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`);
        console.log(`   Status: ${t.status || 'NULL'}`);
        console.log('');
    });

    // 5. 統計總數
    console.log('='.repeat(80));
    console.log('📊 最終統計：');

    const { count: totalCount } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true });

    const { count: expiredTotalCount } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true })
        .not('deadline_date', 'is', null)
        .lte('deadline_date', nowUTC);

    const { count: activeCount } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true })
        .or(`deadline_date.is.null,deadline_date.gt.${nowUTC}`);

    console.log(`  總標案數: ${totalCount}`);
    console.log(`  已過期標案: ${expiredTotalCount}`);
    console.log(`  未過期標案: ${activeCount}`);
    console.log('');

    if (expiredTotalCount !== 23) {
        console.log(`⚠️  警告：實際已過期標案數 (${expiredTotalCount}) 與之前顯示的 23 筆不符！`);
    } else {
        console.log('✅ 確認：實際已過期標案確實只有 23 筆');
    }
}

checkDeadlineDetails().catch(console.error);
