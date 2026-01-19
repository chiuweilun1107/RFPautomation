const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'n8n_data/database.sqlite'));

db.serialize(() => {
    // 查詢現有的工作流
    db.get("SELECT id, nodes FROM workflow_entity WHERE name = ?",
        ['WF01-Document-Ingestion'],
        (err, row) => {
            if (err) {
                console.error('查詢失敗:', err);
                db.close();
                return;
            }

            if (!row) {
                console.error('找不到工作流');
                db.close();
                return;
            }

            try {
                const nodes = JSON.parse(row.nodes);

                // 找到 "Call Local Parser (Direct Storage)" 節點
                const httpRequestNode = nodes.find(n => n.name === 'Call Local Parser (Direct Storage)');

                if (!httpRequestNode) {
                    console.error('找不到 HTTP Request 節點');
                    db.close();
                    return;
                }

                console.log('修改前:', JSON.stringify(httpRequestNode.parameters.bodyParameters, null, 2));

                // 更新 bodyParameters
                httpRequestNode.parameters.bodyParameters = {
                    parameters: [
                        {
                            name: 'path',
                            value: '={{$json.title}}'
                        },
                        {
                            name: 'bucket',
                            value: 'raw-files'
                        }
                    ]
                };

                console.log('修改後:', JSON.stringify(httpRequestNode.parameters.bodyParameters, null, 2));

                // 更新回數據庫
                db.run(
                    "UPDATE workflow_entity SET nodes = ? WHERE id = ?",
                    [JSON.stringify(nodes), row.id],
                    (err) => {
                        if (err) {
                            console.error('更新失敗:', err);
                        } else {
                            console.log('✅ 工作流已更新！');
                        }
                        db.close();
                    }
                );
            } catch (err) {
                console.error('JSON 解析失敗:', err);
                db.close();
            }
        }
    );
});
