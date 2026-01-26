/**
 * OnlyOffice Document Server API Type Definitions
 */

export interface OnlyOfficeConfig {
  document?: {
    fileType?: string;
    key?: string;
    title?: string;
    url?: string;
    permissions?: Record<string, unknown>;
  };
  documentType?: string;
  editorConfig?: {
    callbackUrl?: string;
    customization?: Record<string, unknown>;
    user?: Record<string, unknown>;
    mode?: string;
  };
  events?: Record<string, unknown>;
  width?: string;
  height?: string;
}

export interface DocEditor {
  destroyEditor(): void;
  downloadAs(): void;
  requestClose(): void;
}

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (id: string, config: OnlyOfficeConfig) => DocEditor;
    };
  }
}

export {};
