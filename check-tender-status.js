#!/usr/bin/env node

// 檢查標案狀態的 Node.js 腳本
// 需要先安裝：npm install @supabase/supabase-js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://goyonrowhfphooryfzif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTYxMTA4NywiZXhwIjoyMDgxMTg3MDg3fQ.O49nmTt-80E0oAx70B_QYMU7rZpcoe26x5FQr6IuKnU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateTenderStatus() {
    console.log('🔍 調查標案狀態問題...\n');

    // 1. 查詢所有標案的狀態分佈
    console.log('📊 步驟 1：所有標案的狀態分佈');
    console.log('='.repeat(50));

    const { data: allTenders, error: allError } = await supabase
        .from('tenders')
        .select('status');

    if (allError) {
        console.error('❌ 錯誤:', allError);
        return;
    }

    const statusCount = {};
    allTenders.forEach(t => {
        const status = t.status || 'NULL';
        statusCount[status] = (statusCount[status] || 0) + 1;
    });

    console.log('狀態分佈：');
    Object.entries(statusCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
            console.log(`  ${status}: ${count} 筆`);
        });
    console.log('');

    // 2. 查詢所有已過期的標案
    console.log('📊 步驟 2：已過期標案分析');
    console.log('='.repeat(50));

    const now = new Date().toISOString();

    const { data: expiredTenders, error: expiredError } = await supabase
        .from('tenders')
        .select('id, title, deadline_date, status')
        .not('deadline_date', 'is', null)
        .lte('deadline_date', now);

    if (expiredError) {
        console.error('❌ 錯誤:', expiredError);
        return;
    }

    console.log(`總共有 ${expiredTenders.length} 筆已過期標案`);

    // 分析狀態
    const expiredStatusCount = {};
    expiredTenders.forEach(t => {
        const status = t.status || 'NULL';
        expiredStatusCount[status] = (expiredStatusCount[status] || 0) + 1;
    });

    console.log('\n已過期標案的狀態分佈：');
    Object.entries(expiredStatusCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
            const isCorrect = status === '已截止';
            const icon = isCorrect ? '✅' : '❌';
            console.log(`  ${icon} ${status}: ${count} 筆`);
        });

    // 3. 顯示問題詳情
    const correctCount = expiredStatusCount['已截止'] || 0;
    const wrongCount = expiredTenders.length - correctCount;

    console.log('\n' + '='.repeat(50));
    console.log('📊 總結：');
    console.log(`  總計已過期: ${expiredTenders.length} 筆`);
    console.log(`  ✅ 狀態正確: ${correctCount} 筆`);
    console.log(`  ❌ 狀態錯誤: ${wrongCount} 筆`);
    console.log('');

    if (wrongCount > 0) {
        console.log('⚠️  發現問題！');
        console.log(`   有 ${wrongCount} 筆已過期標案的狀態不是「已截止」`);
        console.log('');

        // 4. 顯示前 10 筆狀態錯誤的標案
        console.log('📋 前 10 筆狀態錯誤的標案：');
        console.log('='.repeat(50));

        const wrongTenders = expiredTenders
            .filter(t => t.status !== '已截止')
            .slice(0, 10);

        wrongTenders.forEach((t, i) => {
            console.log(`${i + 1}. ${t.title}`);
            console.log(`   截止日期: ${t.deadline_date}`);
            console.log(`   當前狀態: ${t.status || 'NULL'}`);
            console.log('');
        });
    } else {
        console.log('✅ 所有已過期標案的狀態都正確！');
    }

    // 5. 查詢未過期的標案
    console.log('📊 步驟 3：未過期標案分析');
    console.log('='.repeat(50));

    const { data: activeTenders, error: activeError } = await supabase
        .from('tenders')
        .select('status')
        .or(`deadline_date.is.null,deadline_date.gt.${now}`);

    if (activeError) {
        console.error('❌ 錯誤:', activeError);
        return;
    }

    const activeStatusCount = {};
    activeTenders.forEach(t => {
        const status = t.status || 'NULL';
        activeStatusCount[status] = (activeStatusCount[status] || 0) + 1;
    });

    console.log('未過期標案的狀態分佈：');
    Object.entries(activeStatusCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
            console.log(`  ${status}: ${count} 筆`);
        });
    console.log('');
}

investigateTenderStatus().catch(console.error);
