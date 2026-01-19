#!/usr/bin/env node
/**
 * 自動更新 WF01-Document-Ingestion-Hybrid 工作流到 n8n
 */

const fs = require('fs');
const path = require('path');

const N8N_HOST = 'http://localhost:5678';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxOThkZGNhNi1kMTA5LTQyMTgtODFlOC0xNWMzNDA4NDNjYjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjMyODA5fQ.L1FImsBbIx4Ol-eyZm3GDMeAIU6UkvSqr5eLx9ZU1WA';

async function main() {
    try {
        console.log('🔍 讀取工作流文件...');
        const workflowPath = path.join(__dirname, '../../backend/n8n/WF01-Document-Ingestion-Hybrid.json');
        const workflowContent = fs.readFileSync(workflowPath, 'utf8');
        const workflow = JSON.parse(workflowContent);

        console.log(`📝 工作流名稱: ${workflow.name}`);

        // 1. 查找現有工作流
        console.log('\n🔎 查找現有工作流...');
        const listResponse = await fetch(`${N8N_HOST}/api/v1/workflows`, {
            headers: {
                'X-N8N-API-KEY': API_KEY
            }
        });

        if (!listResponse.ok) {
            throw new Error(`Failed to list workflows: ${listResponse.status}`);
        }

        const workflows = await listResponse.json();
        const existingWorkflow = workflows.data.find(w => w.name === workflow.name);

        if (existingWorkflow) {
            console.log(`✅ 找到現有工作流 ID: ${existingWorkflow.id}`);
            
            // 2. 更新現有工作流
            console.log('\n🔄 更新工作流...');
            const updateResponse = await fetch(`${N8N_HOST}/api/v1/workflows/${existingWorkflow.id}`, {
                method: 'PUT',
                headers: {
                    'X-N8N-API-KEY': API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: workflow.name,
                    nodes: workflow.nodes,
                    connections: workflow.connections,
                    settings: workflow.settings || {},
                    active: existingWorkflow.active
                })
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Failed to update workflow: ${updateResponse.status} - ${errorText}`);
            }

            const updatedWorkflow = await updateResponse.json();
            console.log(`✅ 工作流已更新！`);
            console.log(`   ID: ${updatedWorkflow.id}`);
            console.log(`   狀態: ${updatedWorkflow.active ? 'Active' : 'Inactive'}`);
            
        } else {
            console.log('⚠️  未找到現有工作流');
            
            // 3. 創建新工作流
            console.log('\n➕ 創建新工作流...');
            const createResponse = await fetch(`${N8N_HOST}/api/v1/workflows`, {
                method: 'POST',
                headers: {
                    'X-N8N-API-KEY': API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: workflow.name,
                    nodes: workflow.nodes,
                    connections: workflow.connections,
                    settings: workflow.settings || {}
                })
            });

            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                throw new Error(`Failed to create workflow: ${createResponse.status} - ${errorText}`);
            }

            const newWorkflow = await createResponse.json();
            console.log(`✅ 工作流已創建！`);
            console.log(`   ID: ${newWorkflow.id}`);
            console.log(`   請手動激活工作流: http://localhost:5678/workflow/${newWorkflow.id}`);
        }

        console.log('\n🎉 完成！');
        console.log('\n📌 下一步：');
        console.log('   1. 打開 n8n: http://localhost:5678');
        console.log('   2. 檢查工作流是否正確更新');
        console.log('   3. 測試工作流');

    } catch (error) {
        console.error('\n❌ 錯誤:', error.message);
        process.exit(1);
    }
}

main();

