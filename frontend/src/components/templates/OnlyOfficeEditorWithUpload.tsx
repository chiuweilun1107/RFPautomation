'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { Loader2, AlertCircle, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Template } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getOnlyOfficeApiScriptUrl } from '@/lib/onlyoffice-config';
import { OnlyOfficeEditorSkeleton } from '@/components/ui/skeletons/OnlyOfficeEditorSkeleton';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { logger } from '@/lib/errors/logger';
import { logAIConfig } from '@/lib/onlyoffice-ai-config';
import { scheduleAIConfiguration } from '@/lib/onlyoffice-ai-helper';
import { AIProjectSelector } from '@/components/ai/AIProjectSelector';

interface OnlyOfficeEditorWithUploadProps {
  template: Template;
  onDocumentReady?: () => void;
  onError?: (error: string) => void;
  documentKey?: string;
}

/**
 * ONLYOFFICE 編輯器（支持文件上傳）
 *
 * 如果模板有 file_path 但無法下載，允許用戶手動上傳文件
 */
export function OnlyOfficeEditorWithUpload({
  template,
  onDocumentReady,
  onError,
  documentKey,
}: OnlyOfficeEditorWithUploadProps) {
  const { handleError, handleFileError } = useErrorHandler();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [scriptLoadTimeout, setScriptLoadTimeout] = useState(false);
  const editorInstanceRef = useRef<any>(null);
  const scriptCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 處理文件上傳
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setError('請上傳 .docx 文件');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setShowUpload(false);

    try {
      logger.info('Starting file upload', 'OnlyOfficeEditorWithUpload', {
        fileName: file.name,
        fileSize: file.size,
        templateId: template.id
      });

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/process-and-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上傳失敗');
      }

      const result = await response.json();
      setDocumentUrl(result.url);
      setIsProcessing(false);

      logger.info('File uploaded successfully', 'OnlyOfficeEditorWithUpload', {
        fileName: file.name,
        documentUrl: result.url,
        templateId: template.id
      });
    } catch (err) {
      const errorInfo = handleFileError(err, 'Upload', file.name, {
        userMessage: '上傳失敗，請重試'
      });
      setError(errorInfo.message);
      setIsProcessing(false);
      setShowUpload(true);
      onError?.(errorInfo.message);
    }
  };

  // 初始化 ONLYOFFICE 編輯器
  useEffect(() => {
    if (!documentUrl || !isScriptLoaded || editorReady) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const callbackUrl = `${origin}/api/onlyoffice-callback`;

        const docKey = documentKey || `template_${template.id}_${Date.now()}`;

        const config = {
          documentType: 'word',
          document: {
            fileType: 'docx',
            key: docKey,
            title: template.name || '文檔',
            url: documentUrl,
            permissions: {
              edit: true,
              download: true,
              print: true,
              review: true,
              comment: true,
              fillForms: true,
              modifyFilter: true,
              modifyContentControl: true,
            },
          },
          editorConfig: {
            mode: 'edit',
            lang: 'zh-TW',
            callbackUrl: callbackUrl,
            user: user ? {
              id: user.id,
              name: user.email?.split('@')[0] || user.email || 'Anonymous',
              group: template.id,
            } : undefined,
            coEditing: {
              mode: 'fast',
              change: true,
            },
            customization: {
              forcesave: !callbackUrl.includes('localhost') && !callbackUrl.includes('127.0.0.1'),
              autosave: !callbackUrl.includes('localhost') && !callbackUrl.includes('127.0.0.1'),
              compactToolbar: false,
              toolbarNoTabs: false,
              chat: true,
              comments: true,
              plugins: true,
            },
          },
          height: '100%',
          width: '100%',
          events: {
            onDocumentReady: () => {
              logAIConfig();
              scheduleAIConfiguration(2000);
              setEditorReady(true);
              setIsAutoLoading(false);
              setIsProcessing(false);
              onDocumentReady?.();
            },
            onError: (event: { data?: { error?: string; message?: string } }) => {
              const errorMsg = `編輯器錯誤: ${JSON.stringify(event?.data || event)}`;
              setError(errorMsg);
              setShowUpload(true);
              setIsAutoLoading(false);
              setIsProcessing(false);
              onError?.(errorMsg);
            },
          },
        };

        // 銷毀舊的編輯器實例
        if (editorInstanceRef.current) {
          try {
            editorInstanceRef.current.destroyEditor();
          } catch {
            // 靜默處理
          }
        }

        // @ts-ignore
        editorInstanceRef.current = new window.DocsAPI.DocEditor('onlyoffice-editor-container', config);

      } catch (err) {
        const errorInfo = handleError(err, {
          context: 'InitOnlyOfficeEditor',
          userMessage: '編輯器初始化失敗',
          metadata: { templateId: template.id }
        });
        setError(errorInfo.message);
        setShowUpload(true);
        setIsAutoLoading(false);
        setIsProcessing(false);
        onError?.(errorInfo.message);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [documentUrl, isScriptLoaded, template.id, template.name]);

  // 定期檢查 window.DocsAPI 是否已載入（備用機制）
  useEffect(() => {
    if (isScriptLoaded) return;

    // 立即檢查一次
    if (typeof window !== 'undefined' && (window as any).DocsAPI) {
      setIsScriptLoaded(true);
      return;
    }

    // 每 500ms 檢查一次
    scriptCheckIntervalRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).DocsAPI) {
        setIsScriptLoaded(true);
        if (scriptCheckIntervalRef.current) {
          clearInterval(scriptCheckIntervalRef.current);
        }
      }
    }, 500);

    return () => {
      if (scriptCheckIntervalRef.current) {
        clearInterval(scriptCheckIntervalRef.current);
      }
    };
  }, [isScriptLoaded]);

  // 設置 Script 載入超時
  useEffect(() => {
    if (template.file_path && !isScriptLoaded && !scriptLoadTimeout) {
      const timer = setTimeout(() => {
        if (!isScriptLoaded) {
          setScriptLoadTimeout(true);
          setError('ONLYOFFICE API 載入超時。請檢查網絡連接或手動上傳文件。');
          setShowUpload(true);
          setIsAutoLoading(false);
          setIsProcessing(false);
        }
      }, 60000);

      return () => clearTimeout(timer);
    }
  }, [template.file_path, isScriptLoaded, scriptLoadTimeout]);

  // 組件掛載時自動加載文檔（如果有 file_path）
  useEffect(() => {
    async function autoLoadDocument() {
      if (!template.file_path) {
        setShowUpload(true);
        return;
      }

      if (!isScriptLoaded) {
        setIsAutoLoading(true);
        setIsProcessing(true);
        return;
      }

      try {
        logger.info('Auto-loading document', 'OnlyOfficeEditorWithUpload', {
          templateId: template.id,
          filePath: template.file_path
        });
        setIsAutoLoading(true);
        setIsProcessing(true);

        let documentUrl: string;

        if (template.file_path.startsWith('http://') || template.file_path.startsWith('https://')) {
          documentUrl = template.file_path;
        } else {
          const { data: urlData } = createClient().storage
            .from('documents')
            .getPublicUrl(template.file_path);

          if (!urlData?.publicUrl) {
            throw new Error('無法獲取文檔 URL');
          }

          documentUrl = urlData.publicUrl;
        }

        const response = await fetch(documentUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`文檔無法訪問 (${response.status})`);
        }

        setDocumentUrl(documentUrl);

        logger.info('Document auto-loaded successfully', 'OnlyOfficeEditorWithUpload', {
          templateId: template.id,
          documentUrl
        });
      } catch (err) {
        const errorInfo = handleFileError(err, 'AutoLoad', template.file_path, {
          userMessage: '自動載入失敗，請手動上傳文件'
        });
        setError(errorInfo.message);
        setShowUpload(true);
        setIsAutoLoading(false);
        setIsProcessing(false);
      }
    }

    autoLoadDocument();
  }, [template.file_path, isScriptLoaded]);

  return (
    <>
      {/* AI 專案選擇器 */}
      <AIProjectSelector />

      <Script
        src={getOnlyOfficeApiScriptUrl()}
        strategy="afterInteractive"
        onLoad={() => {
          setIsScriptLoaded(true);
          setScriptLoadTimeout(false);
        }}
        onError={() => {
          const errorMsg = '無法載入 ONLYOFFICE API。請檢查網絡連接。';
          setError(errorMsg);
          setShowUpload(true);
          setIsAutoLoading(false);
          setIsProcessing(false);
          onError?.(errorMsg);
        }}
        onReady={() => {
          // 靜默處理
        }}
      />

      <div className="w-full h-full relative bg-white">
        {/* 上傳界面 */}
        {showUpload && !documentUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-20">
            <div className="max-w-md w-full p-8">
              <div className="bg-white rounded-lg border-2 border-black p-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-bold text-center font-mono">上傳 Word 文檔</h3>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  {template.name || '請選擇要編輯的文件'}
                </p>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-red-900">載入失敗</p>
                        <p className="text-xs text-red-700 mt-1">{error}</p>
                        <p className="text-xs text-red-600 mt-2">
                          解決方案：請手動上傳要編輯的文件
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".docx"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                  />
                  <Button
                    className="w-full rounded-none border-2 border-black font-mono bg-black text-white hover:bg-gray-800"
                    disabled={isProcessing}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    {isProcessing ? (
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
                  {scriptLoadTimeout && (
                    <p className="text-xs text-gray-500 text-center mt-3">
                      編輯器載入較慢，但上傳功能仍可使用
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 處理中或自動載入中 */}
        {(isProcessing || isAutoLoading) && !showUpload && (
          <div className="absolute inset-0 bg-white z-10">
            <OnlyOfficeEditorSkeleton />
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && !isProcessing && !isAutoLoading && !showUpload && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="flex flex-col items-center gap-4 max-w-md p-8">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <div className="text-center">
                <p className="text-lg font-mono font-bold text-gray-900 mb-2">載入失敗</p>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
              <Button
                onClick={() => {
                  setError(null);
                  setShowUpload(true);
                }}
                className="rounded-none border-2 border-black font-mono mt-4"
              >
                重新上傳文件
              </Button>
            </div>
          </div>
        )}

        {/* ONLYOFFICE 編輯器容器 */}
        <div
          id="onlyoffice-editor-container"
          className="w-full h-full"
          style={{
            display: (showUpload || isProcessing || isAutoLoading || !documentUrl) ? 'none' : 'block'
          }}
        />
      </div>
    </>
  );
}
