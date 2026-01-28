/**
 * OnlyOffice AI 代理測試腳本
 *
 * 用途：測試 Azure OpenAI API 代理是否正常工作
 *
 * 運行方式：
 * node test-ai-proxy.js
 */

const BASE_URL = 'http://localhost:3000';

// 測試 1：檢查 API 端點是否存在（OPTIONS）
async function testOptionsRequest() {
  console.log('\n🔍 測試 1: OPTIONS 請求（CORS preflight）');
  console.log('─'.repeat(60));

  try {
    const response = await fetch(`${BASE_URL}/api/ai-proxy/azure-openai`, {
      method: 'OPTIONS',
    });

    console.log(`✓ 狀態碼: ${response.status}`);
    console.log(`✓ Headers:`, Object.fromEntries(response.headers.entries()));

    if (response.status === 200) {
      console.log('✅ CORS 配置正常');
      return true;
    } else {
      console.log('❌ CORS 配置異常');
      return false;
    }
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    return false;
  }
}

// 測試 2：未登入用戶請求（應該返回 401）
async function testUnauthenticatedRequest() {
  console.log('\n🔍 測試 2: 未登入用戶請求（預期 401）');
  console.log('─'.repeat(60));

  try {
    const response = await fetch(`${BASE_URL}/api/ai-proxy/azure-openai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: '測試' }
        ]
      }),
    });

    console.log(`✓ 狀態碼: ${response.status}`);
    const data = await response.json();
    console.log(`✓ 回應:`, data);

    if (response.status === 401) {
      console.log('✅ 認證保護正常（未登入用戶被拒絕）');
      return true;
    } else {
      console.log('❌ 認證保護異常（應該返回 401）');
      return false;
    }
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    return false;
  }
}

// 測試 3：環境變數檢查
async function testEnvironmentVariables() {
  console.log('\n🔍 測試 3: 檢查環境變數配置');
  console.log('─'.repeat(60));

  console.log('請在伺服器啟動時檢查以下環境變數：');
  console.log('  - AZURE_OPENAI_ENDPOINT');
  console.log('  - AZURE_OPENAI_KEY');
  console.log('  - AZURE_OPENAI_DEPLOYMENT');
  console.log('  - AZURE_OPENAI_API_VERSION');
  console.log('\n如果 API 返回 500 錯誤，請檢查這些變數是否正確設置。');

  return true;
}

// 主測試流程
async function runTests() {
  console.log('');
  console.log('═'.repeat(60));
  console.log('  OnlyOffice AI 代理測試套件');
  console.log('═'.repeat(60));

  const results = [];

  // 執行測試
  results.push(await testOptionsRequest());
  results.push(await testUnauthenticatedRequest());
  results.push(await testEnvironmentVariables());

  // 總結
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  測試總結');
  console.log('═'.repeat(60));

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`\n總共: ${total} 個測試`);
  console.log(`通過: ${passed} 個 ✅`);
  console.log(`失敗: ${total - passed} 個 ❌`);

  if (passed === total) {
    console.log('\n🎉 所有基礎測試通過！');
    console.log('\n下一步：');
    console.log('  1. 啟動開發伺服器: npm run dev');
    console.log('  2. 登入系統');
    console.log('  3. 打開模板編輯器');
    console.log('  4. 安裝 AI 插件');
    console.log('  5. 配置自定義提供商');
  } else {
    console.log('\n⚠️  部分測試失敗，請檢查配置');
  }

  console.log('\n');
}

// 執行測試
runTests().catch(console.error);
