#!/usr/bin/env node

/**
 * 驗證 WF02-Evaluation-Fallback.json 工作流結構
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../n8n/WF02-Evaluation-Fallback.json');

console.log('🔍 驗證 WF02-Evaluation-Fallback 工作流...\n');

// 讀取工作流
let workflow;
try {
    const content = fs.readFileSync(workflowPath, 'utf8');
    workflow = JSON.parse(content);
    console.log('✅ JSON 格式正確\n');
} catch (error) {
    console.error('❌ JSON 格式錯誤:', error.message);
    process.exit(1);
}

// 檢查必要節點
const requiredNodes = [
    'Webhook',
    'Fetch All Sources',
    'Gemini Analysis',
    'Gemini Success?',
    'Parse Gemini Response',
    'Prepare Ollama Input',
    'Try Ollama',
    'Parse Ollama Response',
    'Upsert Assessment'
];

console.log('📋 檢查節點...');
const nodeNames = workflow.nodes.map(n => n.name);
const missingNodes = requiredNodes.filter(name => !nodeNames.includes(name));

if (missingNodes.length > 0) {
    console.error('❌ 缺少節點:', missingNodes.join(', '));
    process.exit(1);
}

console.log('✅ 所有必要節點都存在\n');

// 檢查節點配置
console.log('🔧 檢查節點配置...\n');

const checks = [];

// 1. Gemini Analysis - continueOnFail
const geminiNode = workflow.nodes.find(n => n.name === 'Gemini Analysis');
if (geminiNode.continueOnFail === true) {
    checks.push('✅ Gemini Analysis: continueOnFail 已啟用');
} else {
    checks.push('❌ Gemini Analysis: continueOnFail 未啟用');
}

// 2. Gemini Success? - IF 節點
const ifNode = workflow.nodes.find(n => n.name === 'Gemini Success?');
if (ifNode.type === 'n8n-nodes-base.if') {
    checks.push('✅ Gemini Success?: 使用 IF 節點');
} else {
    checks.push(`❌ Gemini Success?: 節點類型錯誤 (${ifNode.type})`);
}

// 3. Try Ollama - URL
const ollamaNode = workflow.nodes.find(n => n.name === 'Try Ollama');
if (ollamaNode.parameters.url.includes('11434')) {
    checks.push('✅ Try Ollama: URL 正確');
} else {
    checks.push('❌ Try Ollama: URL 錯誤');
}

// 3.5. Prepare Ollama Input - 存在且配置正確
const prepareOllamaNode = workflow.nodes.find(n => n.name === 'Prepare Ollama Input');
if (prepareOllamaNode && prepareOllamaNode.parameters.jsCode.includes("$node['Fetch All Sources']")) {
    checks.push('✅ Prepare Ollama Input: 從 Fetch All Sources 讀取數據');
} else {
    checks.push('❌ Prepare Ollama Input: 數據源配置錯誤');
}

// 3.6. Try Ollama - 使用當前數據流
const ollamaPrompt = ollamaNode.parameters.bodyParameters.parameters.find(p => p.name === 'prompt');
if (ollamaPrompt && ollamaPrompt.value.includes("$json.fullText")) {
    checks.push('✅ Try Ollama: 從當前數據流讀取 fullText');
} else {
    checks.push('❌ Try Ollama: prompt 配置錯誤');
}

// 4. Try Ollama - continueOnFail
if (ollamaNode.continueOnFail === true) {
    checks.push('✅ Try Ollama: continueOnFail 已啟用');
} else {
    checks.push('❌ Try Ollama: continueOnFail 未啟用');
}

// 5. Parse Gemini Response - model_used
const parseGeminiNode = workflow.nodes.find(n => n.name === 'Parse Gemini Response');
if (parseGeminiNode.parameters.jsCode.includes('model_used')) {
    checks.push('✅ Parse Gemini Response: 包含 model_used');
} else {
    checks.push('❌ Parse Gemini Response: 缺少 model_used');
}

// 6. Parse Ollama Response - model_used
const parseOllamaNode = workflow.nodes.find(n => n.name === 'Parse Ollama Response');
if (parseOllamaNode.parameters.jsCode.includes('model_used')) {
    checks.push('✅ Parse Ollama Response: 包含 model_used');
} else {
    checks.push('❌ Parse Ollama Response: 缺少 model_used');
}

// 7. Upsert Assessment - model_used 參數
const upsertNode = workflow.nodes.find(n => n.name === 'Upsert Assessment');
const hasModelUsedParam = upsertNode.parameters.bodyParameters.parameters.some(
    p => p.name === 'model_used'
);
if (hasModelUsedParam) {
    checks.push('✅ Upsert Assessment: 包含 model_used 參數');
} else {
    checks.push('❌ Upsert Assessment: 缺少 model_used 參數');
}

// 輸出檢查結果
checks.forEach(check => console.log(check));

// 檢查連接
console.log('\n🔗 檢查連接...\n');

const connections = workflow.connections;
const connectionChecks = [];

// Webhook → Fetch All Sources
if (connections.Webhook?.main?.[0]?.[0]?.node === 'Fetch All Sources') {
    connectionChecks.push('✅ Webhook → Fetch All Sources');
} else {
    connectionChecks.push('❌ Webhook → Fetch All Sources');
}

// Fetch All Sources → Gemini Analysis
if (connections['Fetch All Sources']?.main?.[0]?.[0]?.node === 'Gemini Analysis') {
    connectionChecks.push('✅ Fetch All Sources → Gemini Analysis');
} else {
    connectionChecks.push('❌ Fetch All Sources → Gemini Analysis');
}

// Gemini Analysis → Gemini Success?
if (connections['Gemini Analysis']?.main?.[0]?.[0]?.node === 'Gemini Success?') {
    connectionChecks.push('✅ Gemini Analysis → Gemini Success?');
} else {
    connectionChecks.push('❌ Gemini Analysis → Gemini Success?');
}

// Gemini Success? → Parse Gemini Response (True)
if (connections['Gemini Success?']?.main?.[0]?.[0]?.node === 'Parse Gemini Response') {
    connectionChecks.push('✅ Gemini Success? [True] → Parse Gemini Response');
} else {
    connectionChecks.push('❌ Gemini Success? [True] → Parse Gemini Response');
}

// Gemini Success? → Prepare Ollama Input (False)
if (connections['Gemini Success?']?.main?.[1]?.[0]?.node === 'Prepare Ollama Input') {
    connectionChecks.push('✅ Gemini Success? [False] → Prepare Ollama Input');
} else {
    connectionChecks.push('❌ Gemini Success? [False] → Prepare Ollama Input');
}

// Prepare Ollama Input → Try Ollama
if (connections['Prepare Ollama Input']?.main?.[0]?.[0]?.node === 'Try Ollama') {
    connectionChecks.push('✅ Prepare Ollama Input → Try Ollama');
} else {
    connectionChecks.push('❌ Prepare Ollama Input → Try Ollama');
}

// Try Ollama → Parse Ollama Response
if (connections['Try Ollama']?.main?.[0]?.[0]?.node === 'Parse Ollama Response') {
    connectionChecks.push('✅ Try Ollama → Parse Ollama Response');
} else {
    connectionChecks.push('❌ Try Ollama → Parse Ollama Response');
}

// Parse Gemini Response → Upsert Assessment
if (connections['Parse Gemini Response']?.main?.[0]?.[0]?.node === 'Upsert Assessment') {
    connectionChecks.push('✅ Parse Gemini Response → Upsert Assessment');
} else {
    connectionChecks.push('❌ Parse Gemini Response → Upsert Assessment');
}

// Parse Ollama Response → Upsert Assessment
if (connections['Parse Ollama Response']?.main?.[0]?.[0]?.node === 'Upsert Assessment') {
    connectionChecks.push('✅ Parse Ollama Response → Upsert Assessment');
} else {
    connectionChecks.push('❌ Parse Ollama Response → Upsert Assessment');
}

connectionChecks.forEach(check => console.log(check));

// 最終結果
const allChecks = [...checks, ...connectionChecks];
const failedChecks = allChecks.filter(c => c.startsWith('❌'));

console.log('\n' + '='.repeat(50));
if (failedChecks.length === 0) {
    console.log('🎉 所有檢查通過！工作流已準備好部署！');
    console.log('='.repeat(50));
    process.exit(0);
} else {
    console.log(`❌ ${failedChecks.length} 個檢查失敗`);
    console.log('='.repeat(50));
    process.exit(1);
}

