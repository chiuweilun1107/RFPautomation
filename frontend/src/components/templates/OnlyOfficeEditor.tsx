'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Template } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getOnlyOfficeApiScriptUrl } from '@/lib/onlyoffice-config';
import { Skeleton } from '@/components/ui/skeleton';
import { OnlyOfficeEditorSkeleton } from '@/components/ui/skeletons/OnlyOfficeEditorSkeleton';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { logger } from '@/lib/errors/logger';

interface OnlyOfficeEditorProps {
  template: Template;
  onDocumentReady?: () => void;
  onError?: (error: string) => void;
}

/**
 * ONLYOFFICE 文檔編輯器組件
 *
 * 功能：
 * 1. 從 Supabase Storage 獲取模板文檔
 * 2. 使用字體處理 API 預處理文檔（標楷體 → AR PL KaitiM Big5）
 * 3. 在 ONLYOFFICE 中打開編輯器
 */
export function OnlyOfficeEditor({
  template,
  onDocumentReady,
  onError,
}: OnlyOfficeEditorProps) {
  const { handleError, handleFileError } = useErrorHandler();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  const supabase = createClient();

  // 初始化文檔 URL
  useEffect(() => {
    async function initializeDocument() {
      if (!template.file_path) {
        const errorMsg = '模板沒有文檔文件';
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
        return;
      }

      try {
        setIsLoading(true);
        logger.info('Initializing document', 'OnlyOfficeEditor', {
          templateId: template.id,
          filePath: template.file_path
        });

        // 從 Supabase Storage 下載文檔
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('documents')
          .download(template.file_path);

        if (downloadError || !fileData) {
          throw new Error('無法下載文檔: ' + (downloadError?.message || '未知錯誤'));
        }

        logger.info('Document downloaded', 'OnlyOfficeEditor', {
          templateId: template.id,
          fileSize: fileData.size
        });

        // 將 Blob 轉換為 File
        const file = new File([fileData], template.name + '.docx', {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        // 使用字體處理 API（會處理字體並重新上傳到可訪問的位置）
        const formData = new FormData();
        formData.append('file', file);

        const processResponse = await fetch('/api/process-and-upload', {
          method: 'POST',
          body: formData,
        });

        if (!processResponse.ok) {
          const errorData = await processResponse.json();
          throw new Error(errorData.error || '處理失敗');
        }

        const result = await processResponse.json();
        setDocumentUrl(result.url);
        setIsLoading(false);

        logger.info('Document processed successfully', 'OnlyOfficeEditor', {
          templateId: template.id,
          documentUrl: result.url
        });
      } catch (err) {
        const errorInfo = handleFileError(err, 'InitDocument', template.file_path, {
          userMessage: '文檔初始化失敗'
        });
        setError(errorInfo.message);
        setIsLoading(false);
        onError?.(errorInfo.message);
      }
    }

    initializeDocument();
  }, [template.file_path, template.name]);

  // 初始化 ONLYOFFICE 編輯器
  useEffect(() => {
    if (!documentUrl || !isScriptLoaded || editorReady) return;

    try {
      logger.info('Initializing ONLYOFFICE editor', 'OnlyOfficeEditor', {
        templateId: template.id,
        documentUrl
      });

      const config = {
        documentType: 'word',
        document: {
          fileType: 'docx',
          key: `template_${template.id}_${Date.now()}`,
          title: template.name,
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
          callbackUrl: `${window.location.origin}/api/onlyoffice-callback`,
          customization: {
            forcesave: !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1'), // 本地開發禁用
            autosave: !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1'), // 本地開發禁用
            compactToolbar: false,
            toolbarNoTabs: false,
          },
        },
        height: '100%',
        width: '100%',
        events: {
          onDocumentReady: () => {
            logger.info('ONLYOFFICE editor ready', 'OnlyOfficeEditor', {
              templateId: template.id
            });
            setEditorReady(true);
            onDocumentReady?.();
          },
          onError: (event: { data?: { error?: string; message?: string } }) => {
            const errorInfo = handleError(event, {
              context: 'OnlyOfficeEditorEvent',
              userMessage: '編輯器錯誤',
              metadata: { templateId: template.id, event }
            });
            setError(errorInfo.message);
            onError?.(errorInfo.message);
          },
        },
      };

      // @ts-ignore
      new window.DocsAPI.DocEditor('onlyoffice-editor-container', config);

    } catch (err) {
      const errorInfo = handleError(err, {
        context: 'InitOnlyOfficeEditor',
        userMessage: '編輯器初始化失敗',
        metadata: { templateId: template.id }
      });
      setError(errorInfo.message);
      onError?.(errorInfo.message);
    }
  }, [documentUrl, isScriptLoaded, template.id, template.name]);

  return (
    <>
      <Script
        src={getOnlyOfficeApiScriptUrl()}
        onLoad={() => {
          console.log('[編輯器] ONLYOFFICE API 已載入');
          setIsScriptLoaded(true);
        }}
        onError={() => {
          const errorMsg = '無法載入 ONLYOFFICE API';
          setError(errorMsg);
          onError?.(errorMsg);
        }}
      />

      <div className="w-full h-full relative bg-white">
        {/* 載入中 */}
        {isLoading && (
          <div className="absolute inset-0 bg-white z-10">
            <OnlyOfficeEditorSkeleton />
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="flex flex-col items-center gap-3 max-w-md p-6">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <p className="text-sm text-center text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {/* ONLYOFFICE 編輯器容器 */}
        <div
          id="onlyoffice-editor-container"
          className="w-full h-full"
          style={{ display: isLoading || error ? 'none' : 'block' }}
        />
      </div>
    </>
  );
}
