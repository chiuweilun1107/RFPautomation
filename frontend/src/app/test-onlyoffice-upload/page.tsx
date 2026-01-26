'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Upload, FileText, Loader2 } from 'lucide-react';

/**
 * ONLYOFFICE 測試 - 上傳並編輯文檔
 *
 * 訪問：http://localhost:3000/test-onlyoffice-upload
 */
export default function TestOnlyOfficeUploadPage() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string>('');
  const [editorReady, setEditorReady] = useState(false);

  const supabase = createClient();

  // 處理文件上傳
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 檢查文件類型
    if (!file.name.endsWith('.docx')) {
      setError('請上傳 .docx 文件');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      console.log('[上傳] 開始上傳文件:', file.name);

      // 生成安全的文件名（避免中文和特殊字符問題）
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'docx';
      const safeFileName = `test-uploads/${timestamp}.${fileExtension}`;

      console.log('[上傳] 使用文件名:', safeFileName);
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
            review: true,
          },
        },
        editorConfig: {
          mode: 'edit',
          lang: 'zh-TW',
          customization: {
            autosave: false,
            forcesave: false,
            comments: true,
            chat: false,
          },
        },
        height: '100%',
        width: '100%',
        events: {
          onDocumentReady: () => {
            console.log('[編輯器] 文檔已就緒');
            setEditorReady(true);
          },
          onError: (event: { data?: { error?: string; message?: string } }) => {
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

  // 當文檔 URL 和腳本都就緒時，初始化編輯器
  useEffect(() => {
    if (documentUrl && isScriptLoaded) {
      initEditor();
    }
  }, [documentUrl, isScriptLoaded]);

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* 載入 ONLYOFFICE API */}
      <Script
        src="http://5.78.118.41:8080/web-apps/apps/api/documents/api.js"
        onLoad={() => {
          console.log('[ONLYOFFICE] API 載入成功');
          setIsScriptLoaded(true);
        }}
        onError={() => setError('無法載入 ONLYOFFICE API')}
      />

      {/* 頂部狀態欄 */}
      <div className="bg-white border-b shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">ONLYOFFICE 測試 - 上傳並編輯</h1>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isScriptLoaded ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="text-gray-600">
                {isScriptLoaded ? '已連接' : '載入中...'}
              </span>
            </div>
            {editorReady && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-gray-600">編輯器就緒</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Supabase Storage → ONLYOFFICE (5.78.118.41)
          </div>
        </div>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 主要內容區域 */}
      <div className="flex-1 flex">
        {/* 未上傳文檔時：顯示上傳區域 */}
        {!documentUrl && (
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-md w-full mx-auto p-8">
              <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    上傳 Word 文檔
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    選擇一個 .docx 文件在 ONLYOFFICE 中打開編輯
                  </p>

                  <div className="mt-6">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <input
                        id="file-upload"
                        type="file"
                        accept=".docx"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading || !isScriptLoaded}
                      />
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
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
                    </label>
                  </div>

                  {!isScriptLoaded && (
                    <p className="mt-4 text-xs text-gray-500">
                      等待 ONLYOFFICE API 載入...
                    </p>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      支援格式：.docx
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      文件將上傳到 Supabase Storage
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 已上傳文檔時：顯示編輯器 */}
        {documentUrl && (
          <div className="flex-1 flex flex-col">
            {/* 文檔資訊 */}
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{documentName}</p>
                    <p className="text-xs text-gray-500">正在編輯</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDocumentUrl(null);
                    setDocumentName('');
                    setEditorReady(false);
                  }}
                >
                  關閉並上傳新文件
                </Button>
              </div>
            </div>

            {/* ONLYOFFICE 編輯器 */}
            <div className="flex-1 relative">
              {!editorReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">載入編輯器...</p>
                  </div>
                </div>
              )}
              <div id="onlyoffice-editor" className="w-full h-full" />
            </div>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="bg-gray-100 border-t px-6 py-3 text-xs text-gray-600 text-center">
        💡 此為測試環境 - 編輯的內容不會自動保存到 Supabase（需要實現 callback）
      </div>
    </div>
  );
}
