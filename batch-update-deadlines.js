#!/usr/bin/env node

// 批量更新標案的 deadline_date
// 從 AceBidX 網站重新抓取截止日期

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://goyonrowhfphooryfzif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTYxMTA4NywiZXhwIjoyMDgxMTg3MDg3fQ.O49nmTt-80E0oAx70B_QYMU7rZpcoe26x5FQr6IuKnU';

const supabase = createClient(supabaseUrl, supabaseKey);

// 從 HTML 中提取截止日期的正則表達式
function extractDeadline(html) {
    // 尋找 DEADLINE 標籤和日期
    const patterns = [
        /DEADLINE.*?(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/i,
        /截止.*?(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/,
        /投標截止.*?(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/,
        /"deadline":\s*"([^"]+)"/,
        /"deadlineDate":\s*"([^"]+)"/,
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

async function fetchDeadlineFromWeb(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const deadline = extractDeadline(html);
        return deadline;
    } catch (error) {
        console.error(`  ❌ 抓取失敗: ${error.message}`);
        return null;
    }
}

async function batchUpdateDeadlines() {
    console.log('🚀 開始批量更新標案截止日期...\n');

    // 1. 查詢所有沒有 deadline_date 的標案
    console.log('📊 查詢缺少截止日期的標案...');

    const { data: tenders, error: queryError } = await supabase
        .from('tenders')
        .select('id, title, url')
        .is('deadline_date', null)
        .not('url', 'is', null);

    if (queryError) {
        console.error('❌ 查詢錯誤:', queryError);
        return;
    }

    console.log(`找到 ${tenders.length} 筆需要更新的標案\n`);

    if (tenders.length === 0) {
        console.log('✅ 所有標案都有截止日期！');
        return;
    }

    // 2. 確認是否執行
    console.log('⚠️  警告：');
    console.log(`  - 將會從網站重新抓取 ${tenders.length} 筆標案的資料`);
    console.log(`  - 這可能需要 ${Math.ceil(tenders.length / 10)} 分鐘`);
    console.log(`  - 建議分批執行，每次處理 10-20 筆`);
    console.log('');

    // 限制數量（避免一次處理太多）
    const BATCH_SIZE = 10;
    const tendersToProcess = tenders.slice(0, BATCH_SIZE);

    console.log(`📋 本次處理前 ${tendersToProcess.length} 筆標案\n`);
    console.log('='.repeat(80));

    let successCount = 0;
    let failCount = 0;
    let noDeadlineCount = 0;

    // 3. 逐一處理
    for (let i = 0; i < tendersToProcess.length; i++) {
        const tender = tendersToProcess[i];
        console.log(`\n${i + 1}/${tendersToProcess.length}. ${tender.title.substring(0, 50)}...`);
        console.log(`   URL: ${tender.url}`);

        // 抓取網頁資料
        console.log('   🔍 抓取網頁資料...');
        const deadline = await fetchDeadlineFromWeb(tender.url);

        if (deadline) {
            console.log(`   ✅ 找到截止日期: ${deadline}`);

            // 更新資料庫
            const { error: updateError } = await supabase
                .from('tenders')
                .update({ deadline_date: deadline })
                .eq('id', tender.id);

            if (updateError) {
                console.log(`   ❌ 更新失敗: ${updateError.message}`);
                failCount++;
            } else {
                console.log('   ✅ 更新成功');
                successCount++;
            }
        } else {
            console.log('   ⚠️  網站上也沒有截止日期');
            noDeadlineCount++;
        }

        // 延遲避免請求過快
        if (i < tendersToProcess.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // 4. 統計結果
    console.log('\n' + '='.repeat(80));
    console.log('📊 更新結果統計：');
    console.log(`  ✅ 成功更新: ${successCount} 筆`);
    console.log(`  ❌ 更新失敗: ${failCount} 筆`);
    console.log(`  ⚠️  網站無資料: ${noDeadlineCount} 筆`);
    console.log('');

    if (tenders.length > BATCH_SIZE) {
        console.log(`ℹ️  還有 ${tenders.length - BATCH_SIZE} 筆標案需要處理`);
        console.log('   再次執行此腳本可以繼續處理下一批');
    }

    // 5. 執行狀態更新
    if (successCount > 0) {
        console.log('\n🔄 執行狀態更新...');

        const response = await fetch(
            'https://goyonrowhfphooryfzif.supabase.co/functions/v1/update-tender-status',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MTEwODcsImV4cCI6MjA4MTE4NzA4N30.uhXDnI7IvyAqu-DwrWrCZlTYDUFJl6Jb96WYq_j59WU',
                    'Content-Type': 'application/json'
                }
            }
        );

        const result = await response.json();

        if (result.success) {
            console.log(`✅ 狀態更新成功！更新了 ${result.updatedCount} 筆標案狀態`);
        } else {
            console.log('❌ 狀態更新失敗:', result.error);
        }
    }

    console.log('\n🎉 批量更新完成！');
}

batchUpdateDeadlines().catch(console.error);
