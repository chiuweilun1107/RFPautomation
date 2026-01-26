'use client';

import { useState, useCallback } from 'react';
import { X, GripVertical, Copy, Download, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { FloatingContentPanelsProps } from '../types';

interface PanelPosition {
  x: number;
  y: number;
}

interface PanelSize {
  width: number;
  height: number;
}

/**
 * 浮動內容面板組件
 * 支援拖動、調整大小、複製、下載等功能
 */
export function FloatingContentPanels({
  openContentPanels,
  taskContents,
  onClose,
}: FloatingContentPanelsProps) {
  const [positions, setPositions] = useState<Map<string, PanelPosition>>(new Map());
  const [sizes, setSizes] = useState<Map<string, PanelSize>>(new Map());
  const [expanded, setExpanded] = useState<Map<string, boolean>>(new Map());
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, taskId: string) => {
    const panel = document.getElementById(`panel-${taskId}`);
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDragging(taskId);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;

    setPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(dragging, {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
      return newPositions;
    });
  }, [dragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  // 複製內容
  const handleCopy = useCallback((taskId: string) => {
    const content = taskContents.get(taskId);
    if (content?.content) {
      navigator.clipboard.writeText(content.content);
      toast.success('內容已複製到剪貼簿');
    }
  }, [taskContents]);

  // 下載為 Markdown
  const handleDownload = useCallback((taskId: string, taskText: string) => {
    const content = taskContents.get(taskId);
    if (!content?.content) return;

    const blob = new Blob([content.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${taskText.slice(0, 30)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('內容已下載');
  }, [taskContents]);

  // 切換展開/收縮
  const toggleExpand = useCallback((taskId: string) => {
    setExpanded(prev => {
      const newExpanded = new Map(prev);
      newExpanded.set(taskId, !newExpanded.get(taskId));
      return newExpanded;
    });
  }, []);

  // 全局滑鼠事件監聽
  if (typeof window !== 'undefined') {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
  }

  const panelsArray = Array.from(openContentPanels.entries());

  return (
    <>
      {panelsArray.map(([taskId, panel], index) => {
        const position = positions.get(taskId) || {
          x: window.innerWidth - 420,
          y: 80 + index * 60,
        };
        const size = sizes.get(taskId) || { width: 400, height: 500 };
        const isExpanded = expanded.get(taskId) || false;
        const content = taskContents.get(taskId);

        return (
          <div
            key={taskId}
            id={`panel-${taskId}`}
            className="fixed bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col z-50 transition-all"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: isExpanded ? '90vw' : `${size.width}px`,
              height: isExpanded ? '90vh' : `${size.height}px`,
              maxWidth: isExpanded ? '1200px' : 'none',
              cursor: dragging === taskId ? 'grabbing' : 'auto',
            }}
          >
            {/* 標題欄 */}
            <div
              className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => handleMouseDown(e, taskId)}
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
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleCopy(taskId)}
                  title="複製內容"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleDownload(taskId, panel.taskText)}
                  title="下載 Markdown"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => toggleExpand(taskId)}
                  title={isExpanded ? '縮小' : '最大化'}
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
                  onClick={() => onClose(taskId)}
                  title="關閉"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 內容區域 */}
            <div className="flex-1 overflow-auto p-4">
              {content?.content ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div
                    className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: content.content_html || content.content }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p className="text-sm">暫無內容</p>
                </div>
              )}
            </div>

            {/* 狀態列 */}
            {content && (
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg text-xs text-gray-500">
                <div>
                  字數: {content.content?.length || 0}
                </div>
                {content.updated_at && (
                  <div>
                    更新: {new Date(content.updated_at).toLocaleString('zh-TW')}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
