'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2 } from 'lucide-react';

/**
 * ONLYOFFICE 測試 V3 - 自動處理字體替換
 *
 * 流程：
 * 1. 用戶上傳 .docx 文件
 * 2. 後端自動替換字體（標楷體 → AR PL KaitiM Big5）
 * 3. 上傳處理後的文件到 Supabase
 * 4. 在 ONLYOFFICE 中打開
 *
 * 訪問：http://localhost:3000/test-onlyoffice-upload-v3
 */
export default function TestOnlyOfficeUploadV3Page() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string>('');
  const [editorReady, setEditorReady] = useState(false);

  // 處理文件上傳（使用字體處理 API）
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setError('請上傳 .docx 文件');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      console.log('[上傳] 開始處理文件:', file.name);

      // 建立 FormData
      const formData = new FormData();
      formData.append('file', file);

      // 調用字體處理 API
      const response = await fetch('/api/process-and-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上傳失敗');
      }

      const result = await response.json();

      console.log('[成功] 文件已處理並上傳:', result.url);

      setDocumentUrl(result.url);
      setDocumentName(result.fileName);

    } catch (err) {
      console.error('[上傳] 失敗:', err);
      setError(err instanceof Error ? err.message : '上傳失敗');
    } finally {
      setIsUploading(false);
    }
  };

  // 初始化 ONLYOFFICE 編輯器
  const initEditor = () => {
    if (!documentUrl || !isScriptLoaded) return;

    try {
      const config = {
        documentType: 'word',
        document: {
          fileType: 'docx',
          key: 'doc_' + Date.now(),
          title: documentName,
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
        },
        height: '100%',
        width: '100%',
        events: {
          onDocumentReady: () => {
            console.log('[編輯器] 文檔已就緒');
            setEditorReady(true);
          },
          onError: (event: any) => {
            console.error('[編輯器] 錯誤:', event);
            setError(`編輯器錯誤: ${JSON.stringify(event)}`);
          },
        },
      };

      console.log('[編輯器] 初始化配置:', config);

      // @ts-ignore
      new window.DocsAPI.DocEditor('onlyoffice-editor', config);

    } catch (err) {
      console.error('[編輯器] 初始化失敗:', err);
      setError(err instanceof Error ? err.message : '初始化失敗');
    }
  };

  useEffect(() => {
    if (documentUrl && isScriptLoaded) {
      initEditor();
    }
  }, [documentUrl, isScriptLoaded]);

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      <Script
        src="http://5.78.118.41:8080/web-apps/apps/api/documents/api.js"
        onLoad={() => setIsScriptLoaded(true)}
        onError={() => setError('無法載入 ONLYOFFICE API')}
      />

      {/* 頂部 */}
      <div className="bg-white border-b shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">ONLYOFFICE 測試 V3 (自動字體處理)</h1>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isScriptLoaded ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span>{isScriptLoaded ? '已連接' : '載入中...'}</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          自動替換「標楷體」→「AR PL KaitiM Big5」
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex-1 flex">
        {!documentUrl ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-md w-full p-8">
              <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-dashed">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-center">上傳 Word 文檔</h3>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  自動處理字體並上傳
                </p>

                <div className="mt-6">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".docx"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading || !isScriptLoaded}
                  />
                  <Button
                    className="w-full"
                    disabled={isUploading || !isScriptLoaded}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        處理中...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        選擇文件
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="bg-blue-50 border-b px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium">{documentName}</span>
                  <span className="text-xs text-green-600">✓ 字體已處理</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDocumentUrl(null);
                    setDocumentName('');
                    setEditorReady(false);
                  }}
                >
                  關閉
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <div id="onlyoffice-editor" className="w-full h-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
