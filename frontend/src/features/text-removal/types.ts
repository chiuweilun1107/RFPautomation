/**
 * Text Removal Feature Types
 */

export type TextRemovalMode = 'manual' | 'vision' | 'auto';
export type InpaintModel = 'sd15' | 'lama' | 'mat';

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextRemovalRequest {
  mode: TextRemovalMode;
  image_url?: string;
  image_base64?: string;
  bboxes?: Array<[number, number, number, number]>;
  model?: InpaintModel;
}

export interface TextRemovalResponse {
  status: 'success' | 'error';
  image_base64?: string;
  model?: string;
  processing_time_ms?: number;
  mode?: string;
  bboxes?: Array<[number, number, number, number]>;
  error?: string;
  timestamp?: string;
}

export interface ProcessingState {
  isLoading: boolean;
  progress: number;
  error: string | null;
}
