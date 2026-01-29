'use client';

import { useState, useCallback } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { logger } from '@/lib/errors/logger';

interface UseTemplateUploadOptions {
  templateId: string;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

interface UseTemplateUploadReturn {
  isUploading: boolean;
  uploadError: string | null;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  clearUploadError: () => void;
}

/**
 * Hook for handling template file upload
 */
export function useTemplateUpload({
  templateId,
  onSuccess,
  onError,
}: UseTemplateUploadOptions): UseTemplateUploadReturn {
  const { handleFileError } = useErrorHandler();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const clearUploadError = useCallback(() => {
    setUploadError(null);
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      const errorMsg = 'Please upload a .docx file';
      setUploadError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      logger.info('Starting file upload', 'useTemplateUpload', {
        fileName: file.name,
        fileSize: file.size,
        templateId
      });

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/process-and-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      logger.info('File uploaded successfully', 'useTemplateUpload', {
        fileName: file.name,
        documentUrl: result.url,
        templateId
      });

      setIsUploading(false);
      onSuccess?.(result.url);

    } catch (err) {
      const errorInfo = handleFileError(err, 'Upload', file.name, {
        userMessage: 'Upload failed, please try again'
      });
      setUploadError(errorInfo.message);
      setIsUploading(false);
      onError?.(errorInfo.message);
    }
  }, [templateId, handleFileError, onSuccess, onError]);

  return {
    isUploading,
    uploadError,
    handleFileUpload,
    clearUploadError,
  };
}
