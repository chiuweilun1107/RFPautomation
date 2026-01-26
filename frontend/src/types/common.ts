/**
 * 通用類型定義
 * 用於替換常見的 any 類型模式
 */

/**
 * 錯誤處理類型
 */
export interface ErrorWithMessage {
  message: string;
  code?: string;
  status?: number;
}

export type ErrorType = Error | ErrorWithMessage | unknown;

/**
 * 將未知錯誤轉換為錯誤消息
 */
export function getErrorMessage(error: ErrorType): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return String(error);
}

/**
 * DOM 事件類型
 */
export interface FileInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

export interface FormInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

export interface SelectChangeEvent extends Event {
  target: HTMLSelectElement & EventTarget;
}

/**
 * OnlyOffice 錯誤事件類型
 */
export interface OnlyOfficeErrorEvent {
  data?: {
    error?: string;
    message?: string;
  };
}

/**
 * API 響應類型
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  code?: string;
  status?: number;
}

/**
 * Supabase 查詢響應類型
 */
export interface SupabaseQueryResponse<T> {
  data: T | null;
  error: Error | null;
}

/**
 * 分頁響應類型
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 通用回調函數類型
 */
export type VoidCallback = () => void;
export type Callback<T> = (value: T) => void;
export type AsyncCallback<T> = (value: T) => Promise<void>;

/**
 * 通用 ID 類型
 */
export type ID = string | number;

/**
 * 未知對象類型（比 any 更安全）
 */
export type UnknownObject = Record<string, unknown>;

/**
 * JSON 值類型
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * 拖放相關類型
 */
export interface DragHandleProps {
  attributes?: Record<string, unknown>;
  listeners?: Record<string, unknown>;
}

export interface DragEvent<T = unknown> {
  active: {
    id: string;
    data?: {
      current?: T;
    };
  };
  over?: {
    id: string;
    data?: {
      current?: T;
    };
  } | null;
}

/**
 * 表單值類型
 */
export type FormValue = string | number | boolean | null | undefined;
export type FormValues = Record<string, FormValue>;
