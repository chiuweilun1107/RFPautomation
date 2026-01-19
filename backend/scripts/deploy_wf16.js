#!/usr/bin/env node

/**
 * WF16-Text-Removal 工作流部署腳本
 *
 * 用途：將 WF16-Text-Removal.json 部署到本地 n8n 實例
 *
 * 使用方法：
 *   node deploy_wf16.js --activate     # 部署並啟用工作流
 *   node deploy_wf16.js --check        # 檢查部署狀態
 *   node deploy_wf16.js --delete WF_ID # 刪除已部署的工作流
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// 配置
const N8N_BASE_URL = process.env.N8N_URL || 'http://localhost:5679';
const N8N_API_KEY = process.env.N8N_API_KEY || '';
const WORKFLOW_FILE = path.join(__dirname, '../n8n/WF16-Text-Removal.json');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n`),
};

/**
 * 進行 HTTP 請求
 */
function httpRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(N8N_BASE_URL);
    const isHttps = url.protocol === 'https:';
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: `/api/v1${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // 新增 API Key (如果設定)
    if (N8N_API_KEY) {
      options.headers['X-N8N-API-KEY'] = N8N_API_KEY;
    }

    const protocol = isHttps ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * 列出所有工作流
 */
async function listWorkflows() {
  try {
    log.info('列出所有工作流...');
    const response = await httpRequest('GET', '/workflows');

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data)}`);
    }

    const workflows = response.data.data || [];
    const wf16 = workflows.find((wf) => wf.name === 'WF16-Text-Removal');

    if (wf16) {
      log.success(`找到現有 WF16-Text-Removal (ID: ${wf16.id})`);
      log.info(`狀態: ${wf16.active ? '✓ 啟用' : '✗ 停用'}`);
      return wf16;
    } else {
      log.warn('未找到 WF16-Text-Removal');
      return null;
    }
  } catch (error) {
    log.error(`列出工作流失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 讀取工作流定義
 */
function readWorkflowFile() {
  try {
    if (!fs.existsSync(WORKFLOW_FILE)) {
      throw new Error(`工作流文件不存在: ${WORKFLOW_FILE}`);
    }

    const content = fs.readFileSync(WORKFLOW_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    log.error(`讀取工作流失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 創建或更新工作流
 */
async function deployWorkflow(activate = false) {
  log.title('🚀 部署 WF16-Text-Removal');

  try {
    // 1. 檢查現有工作流
    log.info('檢查現有工作流...');
    const existing = await listWorkflows();

    // 2. 讀取工作流定義
    log.info('讀取工作流定義...');
    const workflow = readWorkflowFile();

    // 3. 刪除或更新
    if (existing) {
      log.warn(`刪除現有工作流 (ID: ${existing.id})...`);
      await deleteWorkflow(existing.id);
    }

    // 4. 創建新工作流
    log.info('創建新工作流...');

    // 準備工作流 payload（只包含 n8n API 接受的字段）
    // 注意：active 是只讀字段，不能在創建時設置
    const workflowPayload = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings || {},
      staticData: workflow.staticData || null,
    };

    // 可選字段
    if (workflow.tags && workflow.tags.length > 0) {
      workflowPayload.tags = workflow.tags;
    }

    const response = await httpRequest('POST', '/workflows', workflowPayload);

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data)}`);
    }

    const newWorkflow = response.data.data || response.data;
    log.success(`工作流創建成功! ID: ${newWorkflow.id}`);

    // 5. 啟用工作流 (如果需要)
    if (activate) {
      log.info('啟用工作流...');
      const activateResponse = await httpRequest('PATCH', `/workflows/${newWorkflow.id}`, {
        active: true,
      });

      if (activateResponse.status === 200) {
        log.success('工作流已啟用');
      } else {
        log.warn(`無法啟用工作流: ${activateResponse.status}`);
      }
    } else {
      log.info('工作流已創建但未啟用');
      log.info(`使用以下 URL 啟用: ${N8N_BASE_URL}/workflow/${newWorkflow.id}`);
    }

    // 6. 生成 Webhook URL
    const webhookPath = newWorkflow.nodes.find((n) => n.type === 'n8n-nodes-base.webhook')?.parameters?.path;
    if (webhookPath) {
      const webhookUrl = `${N8N_BASE_URL}/webhook/${webhookPath}`;
      log.info(`\nWebhook URL: ${webhookUrl}`);
      log.info(`設定環境變數: N8N_WEBHOOK_TEXT_REMOVAL=${webhookUrl}`);
    }

    return newWorkflow;
  } catch (error) {
    log.error(`部署失敗: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 刪除工作流
 */
async function deleteWorkflow(workflowId) {
  try {
    const response = await httpRequest('DELETE', `/workflows/${workflowId}`);

    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data)}`);
    }

    log.success(`工作流已刪除: ${workflowId}`);
  } catch (error) {
    log.error(`刪除工作流失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 檢查部署狀態
 */
async function checkStatus() {
  log.title('📋 檢查部署狀態');

  try {
    const wf16 = await listWorkflows();

    if (!wf16) {
      log.warn('WF16-Text-Removal 未部署');
      log.info('執行以下命令部署:');
      log.info('  node deploy_wf16.js --activate');
      return;
    }

    log.success('部署狀態檢查完成');
    log.info(`ID: ${wf16.id}`);
    log.info(`名稱: ${wf16.name}`);
    log.info(`狀態: ${wf16.active ? '✓ 啟用' : '✗ 停用'}`);
    log.info(`版本: ${wf16.updatedAt || 'N/A'}`);
  } catch (error) {
    log.error(`檢查失敗: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 主程式
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  log.title('WF16-Text-Removal 部署工具');
  log.info(`n8n URL: ${N8N_BASE_URL}`);
  log.info(`工作流文件: ${WORKFLOW_FILE}`);

  try {
    switch (command) {
      case '--activate':
        await deployWorkflow(true);
        break;

      case '--check':
        await checkStatus();
        break;

      case '--delete':
        if (!args[1]) {
          log.error('需要提供工作流 ID');
          log.info('用法: node deploy_wf16.js --delete <WORKFLOW_ID>');
          process.exit(1);
        }
        await deleteWorkflow(args[1]);
        break;

      case '--help':
      case '-h':
        console.log(`
WF16-Text-Removal 部署工具

用法:
  node deploy_wf16.js [命令]

命令:
  --activate    部署並啟用工作流
  --check       檢查部署狀態
  --delete ID   刪除指定工作流
  --help        顯示此幫助信息

環境變數:
  N8N_URL           n8n 實例 URL (預設: http://localhost:5679)
  N8N_API_KEY       API 金鑰 (可選)

示例:
  node deploy_wf16.js --activate              # 部署並啟用
  node deploy_wf16.js --check                 # 檢查狀態
  N8N_URL=http://n8n.example.com:5679 \\
    node deploy_wf16.js --activate            # 部署到遠端
        `);
        break;

      default:
        log.warn('未知命令');
        console.log('執行以下命令查看幫助: node deploy_wf16.js --help');
        process.exit(1);
    }
  } catch (error) {
    process.exit(1);
  }
}

main();
