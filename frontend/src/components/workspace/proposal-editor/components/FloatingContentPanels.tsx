'use client';

import { useCallback } from 'react';
import { X, GripVertical, Copy, Download, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useMultiPanelDrag } from '../hooks';
import type { FloatingContentPanelsProps, TaskContent } from '../types';

/**
 * 单个浮动面板组件
 * 负责渲染单个内容面板
 */
interface FloatingPanelProps {
  taskId: string;
  index: number;
  panel: { taskText: string; sectionTitle: string };
  content: TaskContent | undefined;
  style: React.CSSProperties;
  isExpanded: boolean;
  onDragStart: (e: React.MouseEvent) => void;
  onToggleExpand: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onClose: () => void;
}

function FloatingPanel({
  taskId,
  panel,
  content,
  style,
  isExpanded,
  onDragStart,
  onToggleExpand,
  onCopy,
  onDownload,
  onClose,
}: FloatingPanelProps) {
  return (
    <div
      id={`panel-${taskId}`}
      className="fixed bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col z-50 transition-all"
      style={style}
    >
      {/* 标题栏 */}
      <div
        className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg cursor-grab active:cursor-grabbing"
        onMouseDown={onDragStart}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              {panel.sectionTitle}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {panel.taskText}
            </p>
          </div>
        </div>
        <PanelActions
          isExpanded={isExpanded}
          onCopy={onCopy}
          onDownload={onDownload}
          onToggleExpand={onToggleExpand}
          onClose={onClose}
        />
      </div>

      {/* 内容区域 */}
      <PanelContent content={content} />

      {/* 状态列 */}
      {content && <PanelStatusBar content={content} />}
    </div>
  );
}

/**
 * 面板操作按钮组
 */
interface PanelActionsProps {
  isExpanded: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onToggleExpand: () => void;
  onClose: () => void;
}

function PanelActions({
  isExpanded,
  onCopy,
  onDownload,
  onToggleExpand,
  onClose,
}: PanelActionsProps) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={onCopy}
        title="复制内容"
      >
        <Copy className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={onDownload}
        title="下载 Markdown"
      >
        <Download className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={onToggleExpand}
        title={isExpanded ? '缩小' : '最大化'}
      >
        {isExpanded ? (
          <Minimize2 className="w-3.5 h-3.5" />
        ) : (
          <Maximize2 className="w-3.5 h-3.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        onClick={onClose}
        title="关闭"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

/**
 * 面板内容区域
 */
interface PanelContentProps {
  content: TaskContent | undefined;
}

function PanelContent({ content }: PanelContentProps) {
  if (!content?.content) {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-center h-full text-gray-400">
          <p className="text-sm">暂无内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <div
          className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: content.content_html || content.content,
          }}
        />
      </div>
    </div>
  );
}

/**
 * 面板状态栏
 */
interface PanelStatusBarProps {
  content: TaskContent;
}

function PanelStatusBar({ content }: PanelStatusBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg text-xs text-gray-500">
      <div>字数: {content.content?.length || 0}</div>
      {content.updated_at && (
        <div>更新: {new Date(content.updated_at).toLocaleString('zh-TW')}</div>
      )}
    </div>
  );
}

/**
 * 浮动内容面板组件
 * 支持拖动、调整大小、复制、下载等功能
 */
export function FloatingContentPanels({
  openContentPanels,
  taskContents,
  onClose,
}: FloatingContentPanelsProps) {
  const {
    startDrag,
    toggleExpand,
    getPanelStyle,
    getPanelState,
  } = useMultiPanelDrag({
    defaultWidth: 400,
    defaultHeight: 500,
  });

  // 复制内容
  const handleCopy = useCallback(
    (taskId: string) => {
      const content = taskContents.get(taskId);
      if (content?.content) {
        navigator.clipboard.writeText(content.content);
        toast.success('内容已复制到剪贴簿');
      }
    },
    [taskContents]
  );

  // 下载为 Markdown
  const handleDownload = useCallback(
    (taskId: string, taskText: string) => {
      const content = taskContents.get(taskId);
      if (!content?.content) return;

      const blob = new Blob([content.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${taskText.slice(0, 30)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('内容已下载');
    },
    [taskContents]
  );

  const panelsArray = Array.from(openContentPanels.entries());

  return (
    <>
      {panelsArray.map(([taskId, panel], index) => {
        const content = taskContents.get(taskId);
        const panelState = getPanelState(taskId, index);

        return (
          <FloatingPanel
            key={taskId}
            taskId={taskId}
            index={index}
            panel={panel}
            content={content}
            style={getPanelStyle(taskId, index)}
            isExpanded={panelState.isExpanded}
            onDragStart={(e) => startDrag(e, taskId)}
            onToggleExpand={() => toggleExpand(taskId)}
            onCopy={() => handleCopy(taskId)}
            onDownload={() => handleDownload(taskId, panel.taskText)}
            onClose={() => onClose(taskId)}
          />
        );
      })}
    </>
  );
}
