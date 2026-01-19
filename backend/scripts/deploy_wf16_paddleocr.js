#!/usr/bin/env node

/**
 * 部署 WF16 工作流（整合 PaddleOCR）
 */

const fs = require('fs');
const path = require('path');

const N8N_URL = 'http://localhost:5679';
// 使用本地 n8n API key
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2U1YmNmMS1kMDUzLTQ4ZWQtYjc3MS1kYmU5YjZhOTkzYzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjcxMjkyfQ.84BT07fqcjpCyGorIkDxvIisyHox7yQc4WN4fxSf7RQ';

// 讀取工作流文件
const workflowPath = path.join(__dirname, '../n8n/WF16-Text-Removal-Simple.json');
const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('📦 正在部署工作流:', workflowData.name);
console.log('描述:', workflowData.description);
console.log('節點數量:', workflowData.nodes.length);

async function deployWorkflow() {
  try {
    // 1. 獲取現有工作流列表
    console.log('\n🔍 檢查現有工作流...');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (N8N_API_KEY) {
      headers['X-N8N-API-KEY'] = N8N_API_KEY;
    }

    const listResponse = await fetch(`${N8N_URL}/api/v1/workflows`, {
      headers
    });

    if (!listResponse.ok) {
      throw new Error(`獲取工作流列表失敗: ${listResponse.status}`);
    }

    const workflows = await listResponse.json();
    const existingWorkflow = workflows.data?.find(
      w => w.name === workflowData.name
    );

    let workflowId;
    let method;
    let url;

    if (existingWorkflow) {
      // 更新現有工作流
      workflowId = existingWorkflow.id;
      method = 'PATCH';
      url = `${N8N_URL}/api/v1/workflows/${workflowId}`;
      console.log(`✏️  更新現有工作流 (ID: ${workflowId})`);
    } else {
      // 創建新工作流
      method = 'POST';
      url = `${N8N_URL}/api/v1/workflows`;
      console.log('🆕 創建新工作流');
    }

    // 2. 部署工作流
    const deployResponse = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(workflowData)
    });

    if (!deployResponse.ok) {
      const errorText = await deployResponse.text();
      throw new Error(`部署失敗 (${deployResponse.status}): ${errorText}`);
    }

    const result = await deployResponse.json();
    workflowId = result.id;

    console.log(`\n✅ 工作流部署成功！`);
    console.log(`ID: ${workflowId}`);
    console.log(`狀態: ${result.active ? '已啟用' : '未啟用'}`);

    // 3. 確保工作流已啟用
    if (!result.active) {
      console.log('\n🔄 啟用工作流...');
      const activateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${workflowId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ active: true })
      });

      if (activateResponse.ok) {
        console.log('✅ 工作流已啟用');
      }
    }

    // 4. 顯示 Webhook URL
    const webhookPath = workflowData.nodes.find(n => n.type === 'n8n-nodes-base.webhook')?.parameters?.path;
    if (webhookPath) {
      console.log(`\n📎 Webhook URL: ${N8N_URL}/webhook/${webhookPath}`);
    }

    console.log('\n🎉 部署完成！');
    console.log('\n主要更新:');
    console.log('  ✓ 將 Azure OpenAI Vision 替換為 PaddleOCR');
    console.log('  ✓ PaddleOCR 端點: http://host.docker.internal:8006/detect');
    console.log('  ✓ 自動解析 bboxes, texts, confidences');

  } catch (error) {
    console.error('\n❌ 部署失敗:', error.message);
    process.exit(1);
  }
}

deployWorkflow();
