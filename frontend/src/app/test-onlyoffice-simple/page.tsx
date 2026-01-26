'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

/**
 * 最簡單的 ONLYOFFICE 測試 - 使用本地空白文檔
 *
 * 訪問：http://localhost:3000/test-onlyoffice-simple
 */
export default function TestOnlyOfficeSimplePage() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isScriptLoaded) return;

    try {
      const config = {
        documentType: 'word',
        document: {
          fileType: 'docx',
          key: 'test_' + Date.now(),
          title: '測試文檔.docx',
          // 使用 Supabase Storage 的公開 URL
          url: 'https://goyonrowhfphooryfzif.supabase.co/storage/v1/object/public/documents/test-onlyoffice.docx',
          permissions: {
            edit: true,
            download: true,
            print: true,
          },
        },
        editorConfig: {
          mode: 'edit',
          lang: 'zh-TW',
        },
        height: '100%',
        width: '100%',
        events: {
          onDocumentReady: () => {
            console.log('[SUCCESS] 文檔載入成功！可以開始編輯了！');
          },
          onError: (event: { data?: { error?: string; message?: string; errorCode?: string } }) => {
            console.error('[ERROR] ONLYOFFICE 錯誤:', event);
            setError(`錯誤代碼: ${event.data?.errorCode || event.data?.error || 'unknown'}`);
          },
        },
      };

      console.log('[INIT] 初始化 ONLYOFFICE 編輯器', config);

      // @ts-ignore
      new window.DocsAPI.DocEditor('onlyoffice-editor', config);

    } catch (err) {
      console.error('[FAILED] 初始化失敗:', err);
      setError(err instanceof Error ? err.message : '初始化失敗');
    }
  }, [isScriptLoaded]);

  return (
    <div className="h-screen w-full flex flex-col">
      <Script
        src="http://5.78.118.41:8080/web-apps/apps/api/documents/api.js"
        onLoad={() => setIsScriptLoaded(true)}
        onError={() => setError('無法載入 ONLYOFFICE API')}
      />

      {/* 頂部狀態欄 */}
      <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-bold">ONLYOFFICE 編輯器測試</h1>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isScriptLoaded ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
            {isScriptLoaded ? '已連接' : '載入中...'}
          </div>
        </div>
        <div className="text-xs opacity-75">localhost:3000 → 5.78.118.41:8080</div>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div className="bg-red-500 text-white px-4 py-3">
          ⚠️ 錯誤：{error}
        </div>
      )}

      {/* 編輯器 */}
      <div className="flex-1">
        <div id="onlyoffice-editor" className="w-full h-full" />
      </div>

      {/* 底部提示 */}
      <div className="bg-slate-100 px-4 py-2 text-xs text-slate-600 text-center">
        💡 這是測試環境 - 可以隨意編輯，不會保存
      </div>
    </div>
  );
}
