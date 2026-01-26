'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Upload, FileText, Loader2 } from 'lucide-react';

/**
 * ONLYOFFICE 測試 V2 - 使用 URL 編碼處理中文文件名
 *
 * 訪問：http://localhost:3000/test-onlyoffice-upload-v2
 */
export default function TestOnlyOfficeUploadV2Page() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string>('');
  const [editorReady, setEditorReady] = useState(false);

  const supabase = createClient();

  // 處理文件上傳（使用 URL 編碼）
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
      console.log('[上傳] 開始上傳文件:', file.name);

      // 使用 timestamp + 副檔名作為儲存路徑，避免中文字符問題
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'docx';
      const safeFileName = `test-uploads/${timestamp}.${fileExtension}`;

      console.log('[上傳] 安全文件名:', safeFileName);
      console.log('[上傳] 原始文件名:', file.name);

      // 上傳到 Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(safeFileName, file, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      console.log('[上傳] 成功:', data.path);

      // 獲取公開 URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

      console.log('[URL] 文檔 URL:', urlData.publicUrl);

      setDocumentUrl(urlData.publicUrl);
      setDocumentName(file.name);

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
            <h1 className="text-xl font-bold">ONLYOFFICE 上傳測試 V2 (URL編碼)</h1>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isScriptLoaded ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span>{isScriptLoaded ? '已連接' : '載入中...'}</span>
            </div>
          </div>
        </div>
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
                <p className="mt-2 text-sm text-gray-500 text-center">支持中文文件名</p>

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
                        上傳中...
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
