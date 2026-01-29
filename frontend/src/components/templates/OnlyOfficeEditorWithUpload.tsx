'use client';

import { useState, useCallback } from 'react';
import Script from 'next/script';
import { Loader2, AlertCircle, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Template } from '@/types';
import { getOnlyOfficeApiScriptUrl } from '@/lib/onlyoffice-config';
import { OnlyOfficeEditorSkeleton } from '@/components/ui/skeletons/OnlyOfficeEditorSkeleton';
import { AIProjectSelector } from '@/components/ai/AIProjectSelector';
import {
  useOnlyOfficeEditor,
  useOnlyOfficeScript,
  useTemplateUpload,
  useDocumentAutoLoad,
} from './hooks';

interface OnlyOfficeEditorWithUploadProps {
  template: Template;
  onDocumentReady?: () => void;
  onError?: (error: string) => void;
  documentKey?: string;
}

/**
 * ONLYOFFICE Editor with File Upload Support
 *
 * If template has file_path but cannot be downloaded, allows user to manually upload file
 */
export function OnlyOfficeEditorWithUpload({
  template,
  onDocumentReady,
  onError,
  documentKey,
}: OnlyOfficeEditorWithUploadProps) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  // Script loading management
  const {
    isScriptLoaded,
    scriptLoadTimeout,
    scriptError,
    handleScriptLoad,
    handleScriptError,
  } = useOnlyOfficeScript();

  // Document auto-loading
  const {
    isAutoLoading,
    autoLoadError,
    showUpload,
    setShowUpload,
  } = useDocumentAutoLoad({
    template,
    isScriptLoaded,
    onSuccess: setDocumentUrl,
    onError,
  });

  // File upload handling
  const {
    isUploading,
    uploadError,
    handleFileUpload,
  } = useTemplateUpload({
    templateId: template.id,
    onSuccess: (url) => {
      setDocumentUrl(url);
      setShowUpload(false);
    },
    onError,
  });

  // Editor initialization
  const {
    isInitializing,
    initError,
  } = useOnlyOfficeEditor({
    template,
    documentUrl,
    documentKey,
    isScriptLoaded,
    onDocumentReady,
    onError,
  });

  // Combined error state
  const displayError = uploadError || autoLoadError || initError || scriptError;
  const isProcessing = isUploading || isAutoLoading || isInitializing;

  // Handle re-upload
  const handleReUpload = useCallback(() => {
    setShowUpload(true);
  }, [setShowUpload]);

  // Handle script error with callback
  const onScriptError = useCallback(() => {
    handleScriptError();
    setShowUpload(true);
    onError?.('Cannot load ONLYOFFICE API. Please check your network connection.');
  }, [handleScriptError, setShowUpload, onError]);

  return (
    <>
      {/* AI Project Selector */}
      <AIProjectSelector />

      <Script
        src={getOnlyOfficeApiScriptUrl()}
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={onScriptError}
        onReady={() => {
          // Silent handling
        }}
      />

      <div className="w-full h-full relative bg-white">
        {/* Upload Interface */}
        {showUpload && !documentUrl && (
          <UploadInterface
            templateName={template.name}
            error={displayError}
            isProcessing={isProcessing}
            scriptLoadTimeout={scriptLoadTimeout}
            onFileUpload={handleFileUpload}
          />
        )}

        {/* Processing or Auto-loading */}
        {isProcessing && !showUpload && (
          <div className="absolute inset-0 bg-white z-10">
            <OnlyOfficeEditorSkeleton />
          </div>
        )}

        {/* Error Message (when not in upload mode) */}
        {displayError && !isProcessing && !showUpload && (
          <ErrorDisplay
            error={displayError}
            onReUpload={handleReUpload}
          />
        )}

        {/* ONLYOFFICE Editor Container */}
        <div
          id="onlyoffice-editor-container"
          className="w-full h-full"
          style={{
            display: (showUpload || isProcessing || !documentUrl) ? 'none' : 'block'
          }}
        />
      </div>
    </>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface UploadInterfaceProps {
  templateName?: string;
  error: string | null;
  isProcessing: boolean;
  scriptLoadTimeout: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function UploadInterface({
  templateName,
  error,
  isProcessing,
  scriptLoadTimeout,
  onFileUpload,
}: UploadInterfaceProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white z-20">
      <div className="max-w-md w-full p-8">
        <div className="bg-white rounded-lg border-2 border-black p-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-bold text-center font-mono">
            Upload Word Document
          </h3>
          <p className="mt-2 text-sm text-gray-500 text-center">
            {templateName || 'Select a file to edit'}
          </p>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-900">Load Failed</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Solution: Please upload the file manually
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
              onChange={onFileUpload}
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
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Select File
                </>
              )}
            </Button>
            {scriptLoadTimeout && (
              <p className="text-xs text-gray-500 text-center mt-3">
                Editor loading is slow, but upload function is still available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ErrorDisplayProps {
  error: string;
  onReUpload: () => void;
}

function ErrorDisplay({ error, onReUpload }: ErrorDisplayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
      <div className="flex flex-col items-center gap-4 max-w-md p-8">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <p className="text-lg font-mono font-bold text-gray-900 mb-2">
            Load Failed
          </p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        <Button
          onClick={onReUpload}
          className="rounded-none border-2 border-black font-mono mt-4"
        >
          Re-upload File
        </Button>
      </div>
    </div>
  );
}
