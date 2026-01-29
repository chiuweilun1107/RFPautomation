/**
 * OnlyOffice AI 自動配置腳本
 *
 * 在編輯器加載完成後自動配置 AI 提供商
 * 讓用戶無需手動配置即可直接使用 AI 功能
 */

(function() {
  'use strict';

  // 配置參數
  const AI_CONFIG = {
    providerName: 'Azure OpenAI',
    // API URL 會自動根據當前域名生成，並包含 user_id、專案 ID 和文件 IDs
    getApiUrl: function() {
      let baseUrl = window.location.origin + '/api/ai-proxy/azure-openai';
      let params = new URLSearchParams();

      // **關鍵**：添加 user_id，讓後端知道要查詢哪個用戶的偏好
      try {
        const userId = localStorage.getItem('ai_user_id');
        if (userId && userId !== 'null') {
          params.append('user_id', userId);
          console.log('[AI Auto-Config] 已添加 User ID:', userId);
        }
      } catch (e) {
        console.warn('[AI Auto-Config] 無法讀取 user_id:', e);
      }

      // 從 localStorage 讀取選中的專案 ID（備用方案）
      try {
        const projectId = localStorage.getItem('ai_selected_project_id');
        if (projectId && projectId !== 'null') {
          params.append('project_id', projectId);
          console.log('[AI Auto-Config] 已添加專案 ID:', projectId);

          // 讀取選中的文件 IDs
          const sourceIdsStr = localStorage.getItem('ai_selected_source_ids');
          if (sourceIdsStr) {
            try {
              const sourceIds = JSON.parse(sourceIdsStr);
              if (Array.isArray(sourceIds) && sourceIds.length > 0) {
                params.append('source_ids', encodeURIComponent(JSON.stringify(sourceIds)));
                console.log('[AI Auto-Config] 已添加 source IDs:', sourceIds.length, '份文件');
              }
            } catch (e) {
              console.warn('[AI Auto-Config] 無法解析 source_ids:', e);
            }
          }
        }
      } catch (e) {
        console.warn('[AI Auto-Config] 無法讀取 localStorage:', e);
      }

      const queryString = params.toString();
      return queryString ? baseUrl + '?' + queryString : baseUrl;
    },
    apiKey: 'proxy-managed',
    model: 'gpt-4',
    modelName: 'GPT-4',
  };

  // 等待編輯器準備就緒
  function waitForEditor(callback, maxAttempts = 50) {
    let attempts = 0;

    const checkInterval = setInterval(function() {
      attempts++;

      // 檢查 OnlyOffice API 是否已載入
      if (window.Asc && window.Asc.plugin) {
        clearInterval(checkInterval);
        console.log('[AI Auto-Config] OnlyOffice API 已就緒');
        callback();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('[AI Auto-Config] 等待 OnlyOffice API 超時');
      }
    }, 200);
  }

  // 配置 AI 提供商
  function configureAIProvider() {
    try {
      const apiUrl = AI_CONFIG.getApiUrl();

      console.log('[AI Auto-Config] 開始自動配置 AI 提供商');
      console.log('[AI Auto-Config] API URL:', apiUrl);

      // 檢查是否有 AI 插件 API
      if (window.Asc && window.Asc.plugin && window.Asc.plugin.executeMethod) {

        // 嘗試配置 AI 提供商
        const providerConfig = {
          name: AI_CONFIG.providerName,
          baseUrl: apiUrl,
          apiKey: AI_CONFIG.apiKey,
          models: [AI_CONFIG.model],
          defaultModel: AI_CONFIG.model
        };

        console.log('[AI Auto-Config] 提供商配置:', providerConfig);

        // 嘗試執行配置命令
        window.Asc.plugin.executeMethod('AddAIProvider', [providerConfig], function(result) {
          if (result && result.error) {
            console.warn('[AI Auto-Config] 配置失敗:', result.error);
          } else {
            console.log('[AI Auto-Config] ✅ AI 提供商配置成功');
          }
        });

      } else {
        console.log('[AI Auto-Config] 未找到 AI 插件 API，嘗試使用 localStorage');

        // 備用方案：使用 localStorage 儲存配置
        try {
          const storageKey = 'onlyoffice_ai_providers';
          const existingProviders = JSON.parse(localStorage.getItem(storageKey) || '[]');

          // 移除舊的自動配置（如果存在）
          const filteredProviders = existingProviders.filter(p => !p.autoConfigured);

          // 添加新的配置（強制更新）
          filteredProviders.push({
            name: AI_CONFIG.providerName,
            baseUrl: apiUrl,
            apiKey: AI_CONFIG.apiKey,
            models: [AI_CONFIG.model],
            defaultModel: AI_CONFIG.model,
            autoConfigured: true,
            configuredAt: new Date().toISOString()
          });

          localStorage.setItem(storageKey, JSON.stringify(filteredProviders));
          console.log('[AI Auto-Config] ✅ 配置已更新到 localStorage');
        } catch (storageError) {
          console.error('[AI Auto-Config] localStorage 操作失敗:', storageError);
        }
      }

      // 輸出配置信息到控制台（方便用戶查看）
      console.log('\n═══════════════════════════════════════════');
      console.log('  OnlyOffice AI 自動配置完成');
      console.log('═══════════════════════════════════════════');
      console.log('提供商:', AI_CONFIG.providerName);
      console.log('API 端點:', apiUrl);
      console.log('模型:', AI_CONFIG.model);
      console.log('\n如果 AI 功能無法使用，請手動配置：');
      console.log('1. 點擊 AI 插件圖標');
      console.log('2. 打開設置');
      console.log('3. 添加 AI 模型：');
      console.log('   - URL:', apiUrl);
      console.log('   - 密鑰: proxy-managed');
      console.log('   - 模型: gpt-4');
      console.log('═══════════════════════════════════════════\n');

    } catch (error) {
      console.error('[AI Auto-Config] 配置過程出錯:', error);
    }
  }

  // 監聽專案/文件切換事件，重新配置 AI
  window.addEventListener('ai-project-changed', function(event) {
    const detail = event.detail || {};
    console.log('[AI Auto-Config] 偵測到設定變更');
    console.log('[AI Auto-Config] - 專案 ID:', detail.projectId || '無');
    console.log('[AI Auto-Config] - 文件數量:', detail.sourceIds?.length || 0);
    console.log('[AI Auto-Config] 正在重新配置 OnlyOffice AI...');

    // 立即更新配置
    configureAIProvider();

    // 提示用戶配置已更新
    console.log('\n🔄 AI 設定已更新！');
    console.log('✅ 下次使用 OnlyOffice AI 時會自動套用新設定');
    console.log('💡 如果 AI 回答沒有變化，請關閉並重新開啟 AI 聊天視窗\n');
  });

  // 當 DOM 準備就緒時執行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      waitForEditor(configureAIProvider);
    });
  } else {
    waitForEditor(configureAIProvider);
  }

})();
