'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

/**
 * 最簡單的 ONLYOFFICE 編輯器測試頁面
 *
 * 訪問：http://localhost:3000/test-onlyoffice
 */
export default function TestOnlyOfficePage() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isScriptLoaded) return;

    try {
      // 測試用的文檔配置
      const config = {
        documentType: 'word',
        document: {
          fileType: 'docx',
          key: 'test_document_' + Date.now(),
          title: '測試文檔.docx',
          // 使用 ONLYOFFICE 官方的測試文檔
          url: 'https://file-examples.com/storage/fe783796f1fde53a7c7a0c6/2017/02/file-sample_100kB.doc',
          permissions: {
            edit: true,
            download: true,
            print: true,
          },
        },
        editorConfig: {
          mode: 'edit',
          lang: 'zh-TW',
          customization: {
            autosave: true,
            forcesave: false,
            comments: true,
            chat: false,
            compactToolbar: false,
          },
        },
        height: '100%',
        width: '100%',
      };

      console.log('[ONLYOFFICE] 初始化編輯器...', config);

      // @ts-ignore - ONLYOFFICE API
      const editor = new window.DocsAPI.DocEditor('onlyoffice-editor', config);

      console.log('[ONLYOFFICE] 編輯器初始化成功', editor);
    } catch (err) {
      console.error('[ONLYOFFICE] 初始化失敗:', err);
      setError(err instanceof Error ? err.message : '初始化失敗');
    }
  }, [isScriptLoaded]);

  return (
    <div className="h-screen w-full flex flex-col">
      {/* 載入 ONLYOFFICE API 腳本 */}
      <Script
        src="http://5.78.118.41:8080/web-apps/apps/api/documents/api.js"
        onLoad={() => {
          console.log('[ONLYOFFICE] 腳本載入成功');
          setIsScriptLoaded(true);
        }}
        onError={(e) => {
          console.error('[ONLYOFFICE] 腳本載入失敗:', e);
          setError('無法載入 ONLYOFFICE API 腳本');
        }}
      />

      {/* 頂部狀態欄 */}
      <div className="bg-gray-100 border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg">ONLYOFFICE 編輯器測試</h1>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isScriptLoaded ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
              }`}
            />
            <span className="text-sm text-gray-600">
              {isScriptLoaded ? '已連接' : '載入中...'}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          ONLYOFFICE Server: 5.78.118.41:8080
        </div>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">錯誤：{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 編輯器容器 */}
      <div className="flex-1 relative">
        {!isScriptLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">載入 ONLYOFFICE 編輯器...</p>
            </div>
          </div>
        )}
        <div id="onlyoffice-editor" className="w-full h-full" />
      </div>

      {/* 底部說明 */}
      <div className="bg-gray-50 border-t px-4 py-2 text-xs text-gray-500">
        <p>
          💡 提示：這是一個測試頁面。編輯器使用線上範例文檔，無法保存更改。
        </p>
      </div>
    </div>
  );
}
