#!/usr/bin/env node

/**
 * 自動更新 WF16 工作流（使用 n8n API）
 */

const fs = require('fs');
const path = require('path');

const N8N_URL = 'http://localhost:5679';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY4NDYzOTMzfQ.7PrirFM5pzwXqhXBgKOiOg8xkLUPDbeDhXR21pZFCeM';

async function updateWorkflow() {
  try {
    // 1. 讀取工作流文件
    console.log('📖 讀取工作流文件...');
    const workflowPath = path.join(__dirname, '../n8n/WF16-Text-Removal-Simple.json');
    const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
    console.log(`✅ 工作流名稱: ${workflowData.name}`);
    console.log(`✅ 節點數量: ${workflowData.nodes.length}`);

    // 2. 獲取現有工作流列表
    console.log('\n🔍 查找現有工作流...');
    const listResponse = await fetch(`${N8N_URL}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!listResponse.ok) {
      throw new Error(`獲取工作流列表失敗: ${listResponse.status} ${await listResponse.text()}`);
    }

    const workflows = await listResponse.json();
    console.log(`✅ 找到 ${workflows.data.length} 個工作流`);

    // 3. 查找 WF16-Text-Removal 工作流
    const existingWorkflow = workflows.data.find(
      w => w.name === 'WF16-Text-Removal' || w.name === workflowData.name
    );

    if (!existingWorkflow) {
      console.log('⚠️  未找到現有工作流，將創建新的');

      // 創建新工作流
      const createResponse = await fetch(`${N8N_URL}/api/v1/workflows`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowData)
      });

      if (!createResponse.ok) {
        throw new Error(`創建工作流失敗: ${createResponse.status} ${await createResponse.text()}`);
      }

      const newWorkflow = await createResponse.json();
      console.log(`\n✅ 成功創建新工作流！`);
      console.log(`   ID: ${newWorkflow.id}`);
      console.log(`   名稱: ${newWorkflow.name}`);
      console.log(`   狀態: ${newWorkflow.active ? '已啟用' : '未啟用'}`);

      return newWorkflow;
    }

    console.log(`✅ 找到現有工作流: ${existingWorkflow.name} (ID: ${existingWorkflow.id})`);

    // 4. 更新現有工作流
    console.log('\n📝 更新工作流...');

    // 只發送 API 接受的字段（active 字段只讀，需要單獨 PATCH）
    const updatePayload = {
      name: workflowData.name,
      nodes: workflowData.nodes,
      connections: workflowData.connections,
      settings: workflowData.settings || {}
    };

    const updateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${existingWorkflow.id}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatePayload)
    });

    if (!updateResponse.ok) {
      throw new Error(`更新工作流失敗: ${updateResponse.status} ${await updateResponse.text()}`);
    }

    const updatedWorkflow = await updateResponse.json();
    console.log(`✅ 工作流更新成功！`);

    // 5. 確保工作流已啟用
    if (!updatedWorkflow.active) {
      console.log('\n🔄 啟用工作流...');
      const activateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${existingWorkflow.id}`, {
        method: 'PATCH',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: true })
      });

      if (activateResponse.ok) {
        console.log('✅ 工作流已啟用');
      }
    } else {
      console.log('✅ 工作流已處於啟用狀態');
    }

    // 6. 顯示摘要
    console.log('\n' + '='.repeat(60));
    console.log('🎉 工作流更新完成！');
    console.log('='.repeat(60));
    console.log(`ID: ${existingWorkflow.id}`);
    console.log(`名稱: ${workflowData.name}`);
    console.log(`狀態: Active`);
    console.log(`\n主要更新:`);
    console.log('  ✓ Azure OpenAI Vision → PaddleOCR');
    console.log('  ✓ 端點: http://host.docker.internal:8006/detect');
    console.log('  ✓ 支援中英文文字偵測');
    console.log(`\nWebhook URL: ${N8N_URL}/webhook/remove-text`);
    console.log('='.repeat(60));

    return updatedWorkflow;

  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    process.exit(1);
  }
}

updateWorkflow();
