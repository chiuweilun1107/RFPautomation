/**
 * Hooks Export Index
 *
 * Centralized exports for all proposal editor hooks
 */

// ============ 新架構核心 Hooks（已完整實現）============
export { useProposalState } from './useProposalState';
export { useProposalDialogs } from './useProposalDialogs';
export { useProposalOperations } from './useProposalOperations';

// ============ 舊架構 Hooks（框架/部分實現）============
export { useSectionState } from './useSectionState';
export type { UseSectionStateReturn } from './useSectionState';

export { useRealtimeUpdates } from './useRealtimeUpdates';

export { useDragDrop } from './useDragDrop';
export type { UseDragDropReturn } from './useDragDrop';

export { useDialogState } from './useDialogState';
export type { UseDialogStateReturn } from './useDialogState';

export { useSectionOperations } from './useSectionOperations';
export type { UseSectionOperationsReturn } from './useSectionOperations';

export { useTaskOperations } from './useTaskOperations';
export type { UseTaskOperationsReturn } from './useTaskOperations';

export { useContentGeneration } from './useContentGeneration';
export type { UseContentGenerationReturn } from './useContentGeneration';

export { useImageGeneration } from './useImageGeneration';
export type { UseImageGenerationReturn } from './useImageGeneration';

export { useTaskContents } from './useTaskContents';
export type { UseTaskContentsReturn } from './useTaskContents';

export { useMultiPanelDrag } from './useMultiPanelDrag';
export type {
  PanelSize,
  PanelState,
  UseMultiPanelDragOptions,
  UseMultiPanelDragReturn,
} from './useMultiPanelDrag';
