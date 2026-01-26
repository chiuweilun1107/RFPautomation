/**
 * Google Drive Picker Types
 * Type definitions for Google Drive integration
 */

import { Source } from '@/features/sources/api/sourcesApi';

// ============================================
// Google Picker API Types
// ============================================

export interface GooglePickerFile {
  id: string;
  name: string;
  mimeType: string;
  description?: string;
  url?: string;
  iconUrl?: string;
  lastEditedUtc?: number;
  sizeBytes?: number;
}

export interface GooglePickerData {
  action: string; // 'picked', 'cancel', etc.
  docs?: GooglePickerFile[];
}

export interface GooglePickerCallback {
  (data: GooglePickerData): void;
}

// Global Google API types
declare global {
  interface Window {
    google?: {
      picker: {
        PickerBuilder: new () => GooglePickerBuilder;
        ViewId: {
          DOCS: string;
          DOCS_IMAGES: string;
          DOCS_VIDEOS: string;
          FOLDERS: string;
        };
        Action: {
          PICKED: string;
          CANCEL: string;
        };
      };
    };
  }
}

export interface GooglePickerBuilder {
  addView(viewId: string): GooglePickerBuilder;
  setOAuthToken(token: string): GooglePickerBuilder;
  setCallback(callback: GooglePickerCallback): GooglePickerBuilder;
  setDeveloperKey(key: string): GooglePickerBuilder;
  setAppId(appId: string): GooglePickerBuilder;
  setTitle(title: string): GooglePickerBuilder;
  build(): GooglePicker;
}

export interface GooglePicker {
  setVisible(visible: boolean): void;
}

// ============================================
// API Response Types
// ============================================

export interface GoogleDriveAuthResponse {
  state: string;
  authUrl: string;
}

export interface GoogleDriveTokenResponse {
  accessToken: string;
  expiresAt?: number;
  refreshToken?: string;
}

export interface GoogleDriveImportResponse {
  source: Source;
}

// ============================================
// Hook Types
// ============================================

export interface UseGoogleDrivePickerOptions {
  projectId?: string;
  folderId?: string;
  onSuccess?: (source: Source) => void;
  onError?: (error: string) => void;
}

export interface UseGoogleDrivePickerReturn {
  isConnecting: boolean;
  isImporting: boolean;
  openPicker: () => Promise<void>;
  connectGoogleDrive: () => Promise<void>;
}
