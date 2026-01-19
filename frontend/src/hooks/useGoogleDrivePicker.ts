/**
 * useGoogleDrivePicker Hook
 * Handles Google Drive OAuth and file picker integration
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface UseGoogleDrivePickerOptions {
  projectId?: string;
  folderId?: string;
  onSuccess?: (source: any) => void;
  onError?: (error: string) => void;
}

interface UseGoogleDrivePickerReturn {
  isConnecting: boolean;
  isImporting: boolean;
  openPicker: () => Promise<void>;
  connectGoogleDrive: () => Promise<void>;
}

export function useGoogleDrivePicker({
  projectId,
  folderId,
  onSuccess,
  onError,
}: UseGoogleDrivePickerOptions = {}): UseGoogleDrivePickerReturn {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Use ref to avoid circular dependency between connectGoogleDrive and openPicker
  const openPickerRef = useRef<(() => Promise<void>) | null>(null);

  /**
   * Connect to Google Drive (OAuth flow)
   */
  const connectGoogleDrive = useCallback(async () => {
    try {
      setIsConnecting(true);

      // Generate OAuth state and get auth URL
      const response = await apiClient.post<{
        state: string;
        authUrl: string;
      }>('/api/auth/google/generate-state', {});

      if (response.data?.authUrl) {
        // Open OAuth popup
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          response.data.authUrl,
          'Google Drive Authorization',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for postMessage from popup
        const handleMessage = (event: MessageEvent) => {
          // Verify origin for security
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data?.type === 'GOOGLE_DRIVE_CONNECTED' && event.data?.success) {
            console.log('Google Drive connected successfully, opening picker...');

            // Clean up listener
            window.removeEventListener('message', handleMessage);

            // Reset state
            setIsConnecting(false);

            // Auto-open picker after successful authorization
            setTimeout(() => {
              openPickerRef.current?.();
            }, 500);
          }
        };

        window.addEventListener('message', handleMessage);

        // Fallback: poll for popup close (in case postMessage fails)
        const pollTimer = setInterval(() => {
          if (popup?.closed) {
            clearInterval(pollTimer);
            window.removeEventListener('message', handleMessage);
            setIsConnecting(false);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Failed to connect Google Drive:', error);
      onError?.('Failed to connect Google Drive');
      setIsConnecting(false);
    }
  }, [onError]);

  /**
   * Open Google Drive Picker
   * Note: This requires the Google Picker API script to be loaded
   */
  const openPicker = useCallback(async () => {
    try {
      // Check if google.picker is available
      if (typeof window === 'undefined' || !(window as any).google?.picker) {
        console.warn('Google Picker API not loaded. Loading now...');

        // Load Google Picker API
        await loadGooglePickerAPI();
      }

      setIsImporting(true);

      // Get OAuth token
      let tokenResponse;
      try {
        tokenResponse = await apiClient.post<{ accessToken: string }>(
          '/api/auth/google/refresh',
          {}
        );
      } catch (error: any) {
        // Check status code in both error.context.statusCode and error.statusCode
        const statusCode = error?.context?.statusCode || error?.statusCode;

        // If 401/404 (unauthorized or no tokens found), trigger OAuth flow
        if (
          statusCode === 401 ||
          statusCode === 404 ||
          error?.message?.includes('No tokens found') ||
          error?.message?.includes('Unauthorized')
        ) {
          console.log('No Google Drive connection found, starting OAuth flow...');
          await connectGoogleDrive();
          setIsImporting(false);
          return;
        }
        // Re-throw other errors
        throw error;
      }

      if (!tokenResponse.data?.accessToken) {
        // Not connected, trigger OAuth flow
        await connectGoogleDrive();
        setIsImporting(false);
        return;
      }

      // Create and show picker
      const google = (window as any).google;
      const picker = new google.picker.PickerBuilder()
        .addView(google.picker.ViewId.DOCS)
        .setOAuthToken(tokenResponse.data.accessToken)
        .setCallback(async (data: any) => {
          if (data.action === google.picker.Action.PICKED) {
            const file = data.docs[0];

            // Import file
            try {
              const importResponse = await apiClient.post('/api/sources/from-drive', {
                fileId: file.id,
                projectId,
                folderId,
              });

              if (importResponse.data?.source) {
                onSuccess?.(importResponse.data.source);
              }
            } catch (error) {
              console.error('Failed to import file:', error);
              onError?.('Failed to import file from Google Drive');
            } finally {
              setIsImporting(false);
            }
          } else if (data.action === google.picker.Action.CANCEL) {
            setIsImporting(false);
          }
        })
        .build();

      picker.setVisible(true);
    } catch (error) {
      console.error('Failed to open picker:', error);
      onError?.('Failed to open Google Drive picker');
      setIsImporting(false);
    }
  }, [projectId, folderId, onSuccess, onError, connectGoogleDrive]);

  // Update ref whenever openPicker changes
  useEffect(() => {
    openPickerRef.current = openPicker;
  }, [openPicker]);

  return {
    isConnecting,
    isImporting,
    openPicker,
    connectGoogleDrive,
  };
}

/**
 * Load Google Picker API script dynamically
 */
function loadGooglePickerAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).google?.picker) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="picker.js"]')) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if ((window as any).google?.picker) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Google Picker API load timeout'));
      }, 10000);

      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      (window as any).gapi.load('picker', {
        callback: resolve,
        onerror: reject,
      });
    };
    script.onerror = () => reject(new Error('Failed to load Google Picker API'));
    document.head.appendChild(script);
  });
}
