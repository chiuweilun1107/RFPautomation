'use client';

import type { FloatingContentPanelsProps } from '../types';

/**
 * 浮动内容面板组件
 */
export function FloatingContentPanels({
  openContentPanels,
  taskContents,
  onClose,
}: FloatingContentPanelsProps) {
  return (
    <>
      {/* TODO: 渲染所有打开的浮动内容面板 */}
      {Array.from(openContentPanels.entries()).map(([taskId, panel]) => (
        <div
          key={taskId}
          className="fixed bottom-4 right-4 w-96 max-h-96 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 overflow-auto p-4"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-sm">{panel.sectionTitle}</h3>
              <p className="text-xs text-gray-500">{panel.taskText}</p>
            </div>
            <button
              onClick={() => onClose(taskId)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          {/* TODO: 渲染任务内容 */}
        </div>
      ))}
    </>
  );
}
