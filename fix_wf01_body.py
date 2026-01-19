#!/usr/bin/env python3
import sqlite3
import json
import os

db_path = os.path.expanduser('~/Desktop/AI dev/n8n_data/database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 查詢現有的工作流
cursor.execute("SELECT id, nodes FROM workflow_entity WHERE name = ?",
               ('WF01-Document-Ingestion',))
row = cursor.fetchone()

if not row:
    print("❌ 找不到工作流")
    conn.close()
    exit(1)

workflow_id, nodes_json = row

try:
    nodes = json.loads(nodes_json)

    # 找到 "Call Local Parser (Direct Storage)" 節點
    http_request_node = None
    for node in nodes:
        if node.get('name') == 'Call Local Parser (Direct Storage)':
            http_request_node = node
            break

    if not http_request_node:
        print("❌ 找不到 HTTP Request 節點")
        conn.close()
        exit(1)

    print("修改前:", json.dumps(http_request_node['parameters'].get('bodyParameters'), indent=2))

    # 更新 bodyParameters
    http_request_node['parameters']['bodyParameters'] = {
        'parameters': [
            {
                'name': 'path',
                'value': '={{$json.title}}'
            },
            {
                'name': 'bucket',
                'value': 'raw-files'
            }
        ]
    }

    print("修改後:", json.dumps(http_request_node['parameters']['bodyParameters'], indent=2))

    # 更新回數據庫
    cursor.execute(
        "UPDATE workflow_entity SET nodes = ? WHERE id = ?",
        (json.dumps(nodes), workflow_id)
    )
    conn.commit()
    print("\n✅ 工作流已更新！")

except json.JSONDecodeError as e:
    print(f"❌ JSON 解析失敗: {e}")
except Exception as e:
    print(f"❌ 錯誤: {e}")
finally:
    conn.close()
