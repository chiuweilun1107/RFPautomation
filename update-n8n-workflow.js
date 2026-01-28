#!/usr/bin/env node

// 修改 n8n 工作流的 Save Tenders 節點為 UPSERT 模式

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/Users/chiuyongren/Desktop/AI dev/n8n_data/database.sqlite');

async function updateWorkflow() {
    console.log('🔧 開始修改 n8n 工作流...\n');

    // 1. 讀取當前工作流
    const getWorkflow = () => {
        return new Promise((resolve, reject) => {
            db.get(
                "SELECT id, nodes, updatedAt FROM workflow_entity WHERE name = 'Tender Aggregation Workflow'",
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    };

    const workflow = await getWorkflow();
    console.log(`✅ 找到工作流 ID: ${workflow.id}\n`);

    // 2. 解析節點配置
    const nodes = JSON.parse(workflow.nodes);
    console.log(`📊 總共 ${nodes.length} 個節點\n`);

    // 3. 找到並修改 Save Tenders 節點
    let saveTendersNode = nodes.find(n => n.name === 'Save Tenders');

    if (!saveTendersNode) {
        console.error('❌ 找不到 Save Tenders 節點！');
        process.exit(1);
    }

    console.log('📋 原始配置:');
    console.log('  URL:', saveTendersNode.parameters.url);
    console.log('  Prefer:', saveTendersNode.parameters.headerParameters.parameters.find(p => p.name === 'Prefer')?.value);
    console.log('');

    // 4. 修改配置為 UPSERT 模式
    // 方法：移除 URL 中的 on_conflict，改用 query parameter
    saveTendersNode.parameters.url = 'https://goyonrowhfphooryfzif.supabase.co/rest/v1/tenders';

    // 添加 query parameters
    saveTendersNode.parameters.sendQuery = true;
    saveTendersNode.parameters.queryParameters = {
        "parameters": [
            {"name": "on_conflict", "value": "url"}
        ]
    };

    // 修改 Prefer header 以確保執行 UPSERT
    const preferHeader = saveTendersNode.parameters.headerParameters.parameters.find(p => p.name === 'Prefer');
    if (preferHeader) {
        preferHeader.value = 'resolution=merge-duplicates,return=representation';
    }

    console.log('✅ 修改配置:');
    console.log('  URL:', saveTendersNode.parameters.url);
    console.log('  Query Params: on_conflict=url');
    console.log('  Prefer:', preferHeader?.value);
    console.log('');

    // 5. 更新資料庫
    const updateDb = () => {
        return new Promise((resolve, reject) => {
            db.run(
                "UPDATE workflow_entity SET nodes = ?, updatedAt = datetime('now') WHERE id = ?",
                [JSON.stringify(nodes), workflow.id],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    };

    const changes = await updateDb();
    console.log(`✅ 已更新 ${changes} 個工作流\n`);

    // 6. 驗證修改
    const verifyWorkflow = await getWorkflow();
    const verifyNodes = JSON.parse(verifyWorkflow.nodes);
    const verifySaveNode = verifyNodes.find(n => n.name === 'Save Tenders');

    console.log('🔍 驗證修改結果:');
    console.log('  URL:', verifySaveNode.parameters.url);
    console.log('  Query Params:', verifySaveNode.parameters.queryParameters?.parameters[0]);
    console.log('  Prefer:', verifySaveNode.parameters.headerParameters.parameters.find(p => p.name === 'Prefer')?.value);
    console.log('');

    db.close();

    console.log('🎉 修改完成！\n');
    console.log('📝 下一步:');
    console.log('  1. 重啟 n8n 服務（如果正在運行）');
    console.log('  2. 點擊前端的 Sync 按鈕測試');
    console.log('  3. 執行 node check-specific-tender.js 驗證');
}

updateWorkflow().catch(err => {
    console.error('❌ 錯誤:', err);
    db.close();
    process.exit(1);
});
