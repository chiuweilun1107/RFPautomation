'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// DocsAPI type is declared in types/onlyoffice.d.ts

interface UseOnlyOfficeScriptReturn {
  isScriptLoaded: boolean;
  scriptLoadTimeout: boolean;
  scriptError: string | null;
  handleScriptLoad: () => void;
  handleScriptError: () => void;
}

const SCRIPT_LOAD_TIMEOUT_MS = 60000;
const SCRIPT_CHECK_INTERVAL_MS = 500;

/**
 * Hook for managing OnlyOffice API script loading
 */
export function useOnlyOfficeScript(): UseOnlyOfficeScriptReturn {
  const [isScriptLoaded, setIsScriptLoaded] = useState(() => {
    // Initialize state based on whether DocsAPI is already loaded
    if (typeof window !== 'undefined' && window.DocsAPI) {
      return true;
    }
    return false;
  });
  const [scriptLoadTimeout, setScriptLoadTimeout] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const scriptCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleScriptLoad = useCallback(() => {
    setIsScriptLoaded(true);
    setScriptLoadTimeout(false);
    setScriptError(null);
  }, []);

  const handleScriptError = useCallback(() => {
    const errorMsg = 'Cannot load ONLYOFFICE API. Please check your network connection.';
    setScriptError(errorMsg);
  }, []);

  // Check if window.DocsAPI is already loaded (fallback mechanism)
  useEffect(() => {
    if (isScriptLoaded) return;

    // Periodic check every 500ms
    scriptCheckIntervalRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && window.DocsAPI) {
        setIsScriptLoaded(true);
        if (scriptCheckIntervalRef.current) {
          clearInterval(scriptCheckIntervalRef.current);
        }
      }
    }, SCRIPT_CHECK_INTERVAL_MS);

    return () => {
      if (scriptCheckIntervalRef.current) {
        clearInterval(scriptCheckIntervalRef.current);
      }
    };
  }, [isScriptLoaded]);

  // Script load timeout
  useEffect(() => {
    if (isScriptLoaded || scriptLoadTimeout) return;

    const timer = setTimeout(() => {
      if (!isScriptLoaded) {
        setScriptLoadTimeout(true);
        setScriptError('ONLYOFFICE API load timeout. Please check your network connection or upload a file manually.');
      }
    }, SCRIPT_LOAD_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [isScriptLoaded, scriptLoadTimeout]);

  return {
    isScriptLoaded,
    scriptLoadTimeout,
    scriptError,
    handleScriptLoad,
    handleScriptError,
  };
}
