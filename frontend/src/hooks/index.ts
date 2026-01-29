// 事件和生命周期
export { useEventListener, useDocumentEventListener, useOnEvent } from './useEventListener';

// 拖拽功能
export {
  useDraggableDialog,
  type Position,
  type DraggableBounds,
  type UseDraggableDialogOptions,
  type UseDraggableDialogReturn,
} from './useDraggableDialog';

// 状态管理
export { useDialog, useDialogs } from './useDialog';
export { useSourceSelection } from './useSourceSelection';
export { usePagination } from './usePagination';
export { useAsyncAction, useAsyncActions } from './useAsyncAction';

// 现有的 hooks
export { useKeyboardShortcut } from './useKeyboardShortcut';
export { useFocusTrap } from './useFocusTrap';
export { useRestoreFocus } from './useRestoreFocus';
export { useGoogleDrivePicker } from './useGoogleDrivePicker';

// TanStack Query Hooks（数据查询和缓存）
export {
  useSourcesQuery,
  useAddSourceMutation,
  useDeleteSourceMutation,
  useUpdateSourceMutation,
  useRefreshSources,
} from './queries';

export {
  useTemplatesQuery,
  useTemplateQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useRefreshTemplates,
} from './queries';

export {
  useProjectsQuery,
  useProjectsInfiniteQuery,
  useProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useRefreshProjects,
} from './queries';
