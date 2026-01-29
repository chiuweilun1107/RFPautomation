'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { logger } from '@/lib/errors/logger';
import type { Template } from '@/types';

interface UseDocumentAutoLoadOptions {
  template: Template;
  isScriptLoaded: boolean;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

interface UseDocumentAutoLoadReturn {
  isAutoLoading: boolean;
  autoLoadError: string | null;
  showUpload: boolean;
  setShowUpload: (show: boolean) => void;
  retryAutoLoad: () => void;
}

/**
 * Hook for auto-loading document from template file_path
 */
export function useDocumentAutoLoad({
  template,
  isScriptLoaded,
  onSuccess,
  onError,
}: UseDocumentAutoLoadOptions): UseDocumentAutoLoadReturn {
  const { handleFileError } = useErrorHandler();
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [autoLoadError, setAutoLoadError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loadAttempted, setLoadAttempted] = useState(false);

  const loadDocument = useCallback(async () => {
    if (!template.file_path) {
      setShowUpload(true);
      return;
    }

    if (!isScriptLoaded) {
      setIsAutoLoading(true);
      return;
    }

    try {
      logger.info('Auto-loading document', 'useDocumentAutoLoad', {
        templateId: template.id,
        filePath: template.file_path
      });
      setIsAutoLoading(true);
      setAutoLoadError(null);

      let documentUrl: string;

      if (template.file_path.startsWith('http://') || template.file_path.startsWith('https://')) {
        documentUrl = template.file_path;
      } else {
        const { data: urlData } = createClient().storage
          .from('documents')
          .getPublicUrl(template.file_path);

        if (!urlData?.publicUrl) {
          throw new Error('Cannot get document URL');
        }

        documentUrl = urlData.publicUrl;
      }

      // Verify document is accessible
      const response = await fetch(documentUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Document not accessible (${response.status})`);
      }

      logger.info('Document auto-loaded successfully', 'useDocumentAutoLoad', {
        templateId: template.id,
        documentUrl
      });

      setIsAutoLoading(false);
      setLoadAttempted(true);
      onSuccess?.(documentUrl);

    } catch (err) {
      const errorInfo = handleFileError(err, 'AutoLoad', template.file_path || '', {
        userMessage: 'Auto-load failed, please upload a file manually'
      });
      setAutoLoadError(errorInfo.message);
      setShowUpload(true);
      setIsAutoLoading(false);
      setLoadAttempted(true);
      onError?.(errorInfo.message);
    }
  }, [template.file_path, template.id, isScriptLoaded, handleFileError, onSuccess, onError]);

  const retryAutoLoad = useCallback(() => {
    setLoadAttempted(false);
    setAutoLoadError(null);
    setShowUpload(false);
  }, []);

  // Auto-load document on mount or when script loads
  useEffect(() => {
    if (loadAttempted) return;

    loadDocument();
  }, [loadDocument, loadAttempted]);

  // Retry when script becomes loaded
  useEffect(() => {
    if (isScriptLoaded && isAutoLoading && !loadAttempted) {
      loadDocument();
    }
  }, [isScriptLoaded, isAutoLoading, loadAttempted, loadDocument]);

  return {
    isAutoLoading,
    autoLoadError,
    showUpload,
    setShowUpload,
    retryAutoLoad,
  };
}
