/**
 * OnlyOffice Document Server API Type Definitions
 */

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (id: string, config: any) => any;
    };
  }
}

export {};
