/**
 * Text Removal Feature - Public API
 */

export { TextRemovalTool } from './components/TextRemovalTool';
export { CanvasBboxMarkup } from './components/CanvasBboxMarkup';
export { textRemovalApi } from './api/textRemovalApi';

export type {
  TextRemovalMode,
  InpaintModel,
  BBox,
  TextRemovalRequest,
  TextRemovalResponse,
  ProcessingState,
} from './types';
