/**
 * useTaskContents Hook
 * 管理任务内容和浮动面板
 */

import { useState, useCallback } from 'react';
import type { TaskContent } from '../types';

interface OpenContentPanel {
  taskText: string;
  sectionTitle: string;
}

/**
 * 返回類型定義
 */
export interface UseTaskContentsReturn {
  taskContents: Map<string, TaskContent>;
  setTaskContents: React.Dispatch<React.SetStateAction<Map<string, TaskContent>>>;
  openContentPanels: Map<string, OpenContentPanel>;
  setOpenContentPanels: React.Dispatch<React.SetStateAction<Map<string, OpenContentPanel>>>;
  generatingTaskId: string | null;
  setGeneratingTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  fetchTaskContents: (taskIds: string[]) => Promise<void>;
  openContentPanel: (taskId: string, taskText: string, sectionTitle: string) => void;
  closeContentPanel: (taskId: string) => void;
}

/**
 * 任务内容管理 Hook
 */
export function useTaskContents(sections: any[] = []) {
  const [taskContents, setTaskContents] = useState<Map<string, TaskContent>>(new Map());
  const [openContentPanels, setOpenContentPanels] = useState<Map<string, OpenContentPanel>>(new Map());
  const [generatingTaskId, setGeneratingTaskId] = useState<string | null>(null);

  // TODO: 实现 fetchTaskContents
  const fetchTaskContents = useCallback(
    async (taskIds: string[]) => {
      // 待实现
      // TODO: Implement task contents fetching
    },
    []
  );

  // TODO: 实现 openContentPanel
  const openContentPanel = useCallback(
    (taskId: string, taskText: string, sectionTitle: string) => {
      setOpenContentPanels(prev => {
        const next = new Map(prev);
        next.set(taskId, { taskText, sectionTitle });
        return next;
      });
    },
    []
  );

  // TODO: 实现 closeContentPanel
  const closeContentPanel = useCallback((taskId: string) => {
    setOpenContentPanels(prev => {
      const next = new Map(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  return {
    taskContents,
    setTaskContents,
    openContentPanels,
    setOpenContentPanels,
    generatingTaskId,
    setGeneratingTaskId,
    fetchTaskContents,
    openContentPanel,
    closeContentPanel,
  };
}
