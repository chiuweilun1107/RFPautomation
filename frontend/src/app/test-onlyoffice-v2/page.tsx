'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

/**
 * ONLYOFFICE 編輯器測試頁面 V2
 * 使用 Supabase Storage 中的文檔
 *
 * 訪問：http://localhost:3000/test-onlyoffice-v2
 */
export default function TestOnlyOfficeV2Page() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const supabase = createClient();

  // 創建一個測試文檔
  const createTestDocument = async () => {
    setIsLoadingDoc(true);
    setError(null);

    try {
      // 創建一個簡單的空白 .docx
      // 使用 ONLYOFFICE 的空白模板或從 Supabase 獲取已有文檔

      // 方案 1：列出 Supabase Storage 中的文檔
      const { data: files, error: listError } = await supabase.storage
        .from('documents')
        .list('', { limit: 10 });

      if (listError) throw listError;

      console.log('[Supabase] 可用文檔:', files);

      if (!files || files.length === 0) {
        setError('Supabase Storage 中沒有文檔。請先上傳一個 .docx 文件到 documents bucket。');
        setIsLoadingDoc(false);
        return;
      }

      // 使用第一個 .docx 文檔
      const docFile = files.find(f => f.name.endsWith('.docx')) || files[0];

      // 創建簽名 URL（有效期 1 小時）
      const { data: urlData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(docFile.name, 3600);

      if (urlError) throw urlError;

      console.log('[Supabase] 文檔 URL:', urlData.signedUrl);
      setDocumentUrl(urlData.signedUrl);

    } catch (err) {
      console.error('[測試] 創建文檔失敗:', err);
      setError(err instanceof Error ? err.message : '創建文檔失敗');
    } finally {
      setIsLoadingDoc(false);
    }
  };

  // 當文檔 URL 就緒且腳本已載入時，初始化編輯器
  useEffect(() => {
    if (!isScriptLoaded || !documentUrl) return;

    try {
      const config = {
        documentType: 'word',
        document: {
          fileType: 'docx',
          key: 'test_doc_' + Date.now(),
          title: '測試文檔.docx',
          url: documentUrl,
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
            autosave: false, // 關閉自動保存（測試用）
            forcesave: false,
            comments: true,
            chat: false,
            compactToolbar: false,
          },
        },
        height: '100%',
        width: '100%',
        events: {
          onDocumentReady: () => {
            console.log('[ONLYOFFICE] 文檔已就緒');
          },
          onError: (event: any) => {
            console.error('[ONLYOFFICE] 錯誤:', event);
            setError(`ONLYOFFICE 錯誤: ${JSON.stringify(event)}`);
          },
        },
      };

      console.log('[ONLYOFFICE] 初始化編輯器...', config);

      // @ts-ignore
      const editor = new window.DocsAPI.DocEditor('onlyoffice-editor', config);

      console.log('[ONLYOFFICE] 編輯器初始化成功');
    } catch (err) {
      console.error('[ONLYOFFICE] 初始化失敗:', err);
      setError(err instanceof Error ? err.message : '初始化失敗');
    }
  }, [isScriptLoaded, documentUrl]);

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
          <h1 className="font-bold text-lg">ONLYOFFICE 編輯器測試 V2</h1>
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
          {documentUrl && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600">文檔已載入</span>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500">
          ONLYOFFICE: 5.78.118.41:8080 | Supabase Storage
        </div>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
          <div className="flex items-start">
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
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{error}</p>
              {error.includes('沒有文檔') && (
                <div className="mt-2 text-xs text-red-600">
                  <p className="font-semibold mb-1">解決方案：</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>打開 Supabase Dashboard</li>
                    <li>進入 Storage → documents bucket</li>
                    <li>上傳任意一個 .docx 文件</li>
                    <li>重新整理此頁面</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 初始化按鈕（文檔未載入時） */}
      {!documentUrl && !error && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <div className="text-gray-600">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                準備載入測試文檔
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                從 Supabase Storage 載入文檔
              </p>
            </div>
            <Button
              onClick={createTestDocument}
              disabled={isLoadingDoc || !isScriptLoaded}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoadingDoc ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  載入中...
                </>
              ) : (
                '載入測試文檔'
              )}
            </Button>
            {!isScriptLoaded && (
              <p className="text-xs text-gray-500">等待 ONLYOFFICE API 載入...</p>
            )}
          </div>
        </div>
      )}

      {/* 編輯器容器 */}
      {documentUrl && (
        <div className="flex-1 relative">
          {!isScriptLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">載入 ONLYOFFICE 編輯器...</p>
              </div>
            </div>
          )}
          <div id="onlyoffice-editor" className="w-full h-full" />
        </div>
      )}

      {/* 底部說明 */}
      <div className="bg-gray-50 border-t px-4 py-2 text-xs text-gray-500">
        <p>
          💡 此測試使用 Supabase Storage 中的文檔。編輯不會保存（測試模式）。
        </p>
      </div>
    </div>
  );
}
