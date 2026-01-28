#!/usr/bin/env node

// 用 n8n 現有的邏輯測試特定網頁

async function testN8nLogic() {
    const url = 'https://acebidx.com/zh-TW/docs/tender/id/febfc72f-e10c-438f-b3cb-c7a9254a5053';

    console.log('🔍 測試 n8n 現有邏輯\n');
    console.log(`目標網頁: ${url}\n`);
    console.log('='.repeat(80));

    // 1. 抓取 HTML
    console.log('\n📡 步驟 1：抓取 HTML...');
    const response = await fetch(url);
    const html = await response.text();

    console.log(`✅ HTML 長度: ${html.length} 字符\n`);

    // 2. 使用 n8n 現有的邏輯
    console.log('📊 步驟 2：使用 n8n 現有邏輯搜尋截止日期...');
    console.log('='.repeat(80));

    // n8n 現有的關鍵字
    const keywords = ['截止投標', '截止'];
    console.log(`\n關鍵字: ${JSON.stringify(keywords)}`);

    let bestDate = null;
    let minDistance = Infinity;

    // n8n 現有的日期正則
    const dateRegex = /(\d{2,3})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})(?:\s+(\d{1,2}:\d{2}))?/g;

    const dates = [];
    let match;
    while ((match = dateRegex.exec(html)) !== null) {
        dates.push({
            full: match[0],
            index: match.index
        });
    }

    console.log(`\n找到 ${dates.length} 個日期格式`);
    if (dates.length > 0) {
        console.log('前 10 個日期:');
        dates.slice(0, 10).forEach((d, i) => {
            const context = html.substring(Math.max(0, d.index - 50), Math.min(html.length, d.index + 50));
            console.log(`  ${i + 1}. ${d.full} (位置 ${d.index})`);
            console.log(`     上下文: ...${context}...`);
        });
    }

    console.log('\n');
    console.log('='.repeat(80));
    console.log('搜尋關鍵字...\n');

    // 搜尋關鍵字
    for (const kw of keywords) {
        const kwRegex = new RegExp(kw, 'g');
        let kwMatch;
        const matches = [];

        while ((kwMatch = kwRegex.exec(html)) !== null) {
            matches.push(kwMatch.index);
        }

        console.log(`關鍵字 "${kw}": 找到 ${matches.length} 次`);

        if (matches.length > 0) {
            console.log(`  位置: ${matches.join(', ')}`);

            // 顯示每個關鍵字的上下文
            matches.forEach((kwIndex, i) => {
                const context = html.substring(Math.max(0, kwIndex - 30), Math.min(html.length, kwIndex + 100));
                console.log(`\n  第 ${i + 1} 次出現的上下文:`);
                console.log(`  ...${context}...`);
            });
        }

        // n8n 現有的搜尋邏輯
        for (const kwIndex of matches) {
            for (const date of dates) {
                const distance = date.index - kwIndex;

                // n8n 現有的條件：distance > 0 && distance < 3000
                if (distance > 0 && distance < 3000 && distance < minDistance) {
                   minDistance = distance;
                   bestDate = date.full;

                   console.log(`\n  ✅ 符合條件！`);
                   console.log(`     關鍵字位置: ${kwIndex}`);
                   console.log(`     日期位置: ${date.index}`);
                   console.log(`     距離: ${distance} 字符`);
                   console.log(`     日期: ${date.full}`);
                }
            }
        }
        console.log('');
    }

    console.log('='.repeat(80));
    console.log('\n📊 結果：');

    if (bestDate) {
        console.log(`✅ 找到截止日期: ${bestDate}`);
        console.log(`   最小距離: ${minDistance} 字符`);
    } else {
        console.log('❌ 沒有找到截止日期');

        console.log('\n🔍 問題分析：');

        // 分析原因
        if (dates.length === 0) {
            console.log('  原因: HTML 中沒有找到任何日期格式');
        } else {
            console.log('  可能原因:');
            console.log('    1. 關鍵字 ["截止投標", "截止"] 在 HTML 中不存在');
            console.log('    2. 日期在關鍵字前面（distance < 0）');
            console.log('    3. 日期和關鍵字距離 > 3000 字符');

            // 檢查是否有其他可能的關鍵字
            console.log('\n  檢查其他可能的關鍵字:');
            const otherKeywords = ['DEADLINE', 'deadline', 'Deadline', '投標截止', '收件截止'];
            for (const kw of otherKeywords) {
                const count = (html.match(new RegExp(kw, 'g')) || []).length;
                if (count > 0) {
                    console.log(`    ✅ "${kw}": 找到 ${count} 次`);

                    // 顯示上下文
                    const kwIndex = html.indexOf(kw);
                    const context = html.substring(Math.max(0, kwIndex - 50), Math.min(html.length, kwIndex + 100));
                    console.log(`       上下文: ...${context}...`);
                }
            }
        }
    }

    // 3. 顯示 HTML 片段（包含 DEADLINE 相關的部分）
    console.log('\n');
    console.log('='.repeat(80));
    console.log('📄 HTML 中包含 "DEADLINE" 或 "截止" 的片段:\n');

    const searchTerms = ['DEADLINE', '截止', 'deadline'];
    for (const term of searchTerms) {
        const index = html.indexOf(term);
        if (index !== -1) {
            const snippet = html.substring(Math.max(0, index - 200), Math.min(html.length, index + 500));
            console.log(`\n找到 "${term}" (位置 ${index}):`);
            console.log('-'.repeat(80));
            console.log(snippet);
            console.log('-'.repeat(80));
        }
    }
}

testN8nLogic().catch(console.error);
