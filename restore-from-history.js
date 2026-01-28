#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/Users/chiuyongren/Desktop/AI dev/n8n_data/database.sqlite');

async function restoreFromHistory() {
    console.log('🔄 從歷史版本恢復工作流...\n');

    // 獲取最早的歷史版本（我修改之前）
    const getHistory = () => {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT versionId, nodes, connections, settings, createdAt 
                 FROM workflow_history 
                 WHERE workflowId = 'nY2xZKcqjfXQiVrU' 
                 ORDER BY createdAt ASC 
                 LIMIT 1`,
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    };

    const history = await getHistory();
    console.log(`✅ 找到歷史版本: ${history.versionId}`);
    console.log(`   建立時間: ${history.createdAt}\n`);

    // 恢復到主表
    const restore = () => {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE workflow_entity 
                 SET nodes = ?, 
                     connections = ?, 
                     settings = ?,
                     updatedAt = datetime('now') 
                 WHERE id = 'nY2xZKcqjfXQiVrU'`,
                [history.nodes, history.connections, history.settings],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    };

    const changes = await restore();
    console.log(`✅ 已恢復 ${changes} 個工作流\n`);

    // 驗證
    const verify = () => {
        return new Promise((resolve, reject) => {
            db.get(
                "SELECT nodes FROM workflow_entity WHERE id = 'nY2xZKcqjfXQiVrU'",
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    };

    const verifyRow = await verify();
    
    try {
        const nodes = JSON.parse(verifyRow.nodes);
        const saveNode = nodes.find(n => n.name === 'Save Tenders');
        console.log('🔍 驗證結果:');
        console.log(`   節點數量: ${nodes.length}`);
        console.log(`   Save Tenders URL: ${saveNode.parameters.url}`);
        console.log('');
    } catch (e) {
        console.log(`❌ 驗證失敗: ${e.message}`);
    }

    db.close();
    console.log('✅ 恢復完成！\n');
}

restoreFromHistory().catch(err => {
    console.error('❌ 錯誤:', err);
    db.close();
    process.exit(1);
});
