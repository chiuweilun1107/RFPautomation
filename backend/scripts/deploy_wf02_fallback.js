const fs = require('fs');
const path = require('path');

const N8N_HOST = process.env.N8N_HOST || 'http://localhost:5678';
const API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxOThkZGNhNi1kMTA5LTQyMTgtODFlOC0xNWMzNDA4NDNjYjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjMyODA5fQ.L1FImsBbIx4Ol-eyZm3GDMeAIU6UkvSqr5eLx9ZU1WA';

async function main() {
    try {
        console.log('🔍 讀取 WF02-Evaluation-Fallback 工作流文件...');
        const workflowPath = path.join(__dirname, '../n8n/WF02-Evaluation-Fallback.json');
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
            console.log(`   Webhook URL: ${N8N_HOST}/webhook/evaluate-project`);
            
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
            console.log(`   Webhook URL: ${N8N_HOST}/webhook/evaluate-project`);
            console.log(`   請手動激活工作流: ${N8N_HOST}/workflow/${newWorkflow.id}`);
        }

        // 4. 檢查 Ollama 是否運行
        console.log('\n🔍 檢查 Ollama 服務...');
        try {
            const ollamaResponse = await fetch('http://localhost:11434/api/tags');
            if (ollamaResponse.ok) {
                const ollamaData = await ollamaResponse.json();
                const hasQwen = ollamaData.models?.some(m => m.name.includes('qwen'));
                if (hasQwen) {
                    console.log('✅ Ollama 運行中，Qwen 模型已安裝');
                } else {
                    console.log('⚠️  Ollama 運行中，但未安裝 Qwen 模型');
                    console.log('   請執行: ollama pull qwen2.5');
                }
            }
        } catch (e) {
            console.log('❌ Ollama 未運行或無法連接');
            console.log('   請執行: ollama serve');
            console.log('   然後執行: ollama pull qwen2.5');
        }

        console.log('\n🎉 部署完成！');
        console.log('\n📚 使用指南:');
        console.log('   1. 確保 Ollama 運行: ollama serve');
        console.log('   2. 確保 Qwen 模型已安裝: ollama pull qwen2.5');
        console.log('   3. 在 n8n UI 中激活工作流');
        console.log('   4. 測試: curl -X POST http://localhost:5678/webhook/evaluate-project \\');
        console.log('            -H "Content-Type: application/json" \\');
        console.log('            -d \'{"project_id": "test", "source_ids": ["uuid"]}\'');

    } catch (error) {
        console.error('💥 錯誤:', error.message);
        process.exit(1);
    }
}

main();

