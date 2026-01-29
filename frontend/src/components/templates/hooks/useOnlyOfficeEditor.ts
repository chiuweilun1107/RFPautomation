'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { logAIConfig } from '@/lib/onlyoffice-ai-config';
import { scheduleAIConfiguration } from '@/lib/onlyoffice-ai-helper';
import type { Template } from '@/types';

// Extend Window interface for DocsAPI
declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (containerId: string, config: unknown) => {
        destroyEditor: () => void;
      };
    };
  }
}

interface EditorInstance {
  destroyEditor: () => void;
}

interface UseOnlyOfficeEditorOptions {
  template: Template;
  documentUrl: string | null;
  documentKey?: string;
  isScriptLoaded: boolean;
  onDocumentReady?: () => void;
  onError?: (error: string) => void;
}

interface UseOnlyOfficeEditorReturn {
  editorReady: boolean;
  isInitializing: boolean;
  initError: string | null;
  resetEditor: () => void;
}

/**
 * Hook for managing OnlyOffice editor initialization and lifecycle
 */
export function useOnlyOfficeEditor({
  template,
  documentUrl,
  documentKey,
  isScriptLoaded,
  onDocumentReady,
  onError,
}: UseOnlyOfficeEditorOptions): UseOnlyOfficeEditorReturn {
  const { handleError } = useErrorHandler();
  const [editorReady, setEditorReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const editorInstanceRef = useRef<EditorInstance | null>(null);

  const resetEditor = useCallback(() => {
    setEditorReady(false);
    setIsInitializing(false);
    setInitError(null);
    if (editorInstanceRef.current) {
      try {
        editorInstanceRef.current.destroyEditor();
      } catch {
        // Silent handling
      }
      editorInstanceRef.current = null;
    }
  }, []);

  // Initialize ONLYOFFICE editor
  useEffect(() => {
    if (!documentUrl || !isScriptLoaded || editorReady) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsInitializing(true);
        setInitError(null);

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const callbackUrl = `${origin}/api/onlyoffice-callback`;
        const isLocalhost = callbackUrl.includes('localhost') || callbackUrl.includes('127.0.0.1');

        const docKey = documentKey || `template_${template.id}_${Date.now()}`;

        const config = {
          documentType: 'word',
          document: {
            fileType: 'docx',
            key: docKey,
            title: template.name || 'Document',
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
              forcesave: !isLocalhost,
              autosave: !isLocalhost,
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
              setIsInitializing(false);
              onDocumentReady?.();
            },
            onError: (event: { data?: { error?: string; message?: string } }) => {
              const errorMsg = `Editor error: ${JSON.stringify(event?.data || event)}`;
              setInitError(errorMsg);
              setIsInitializing(false);
              onError?.(errorMsg);
            },
          },
        };

        // Destroy old editor instance
        if (editorInstanceRef.current) {
          try {
            editorInstanceRef.current.destroyEditor();
          } catch {
            // Silent handling
          }
        }

        // DocsAPI is loaded from external script
        if (window.DocsAPI) {
          editorInstanceRef.current = new window.DocsAPI.DocEditor('onlyoffice-editor-container', config);
        }

      } catch (err) {
        const errorInfo = handleError(err, {
          context: 'InitOnlyOfficeEditor',
          userMessage: 'Editor initialization failed',
          metadata: { templateId: template.id }
        });
        setInitError(errorInfo.message);
        setIsInitializing(false);
        onError?.(errorInfo.message);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [documentUrl, isScriptLoaded, editorReady, template.id, template.name, documentKey, handleError, onDocumentReady, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editorInstanceRef.current) {
        try {
          editorInstanceRef.current.destroyEditor();
        } catch {
          // Silent handling
        }
      }
    };
  }, []);

  return {
    editorReady,
    isInitializing,
    initError,
    resetEditor,
  };
}
