"use client";

import { useCallback } from "react";
import { Section, Task } from "../types";
import { useAsyncAction } from "@/hooks";
import { toast } from "sonner";

/**
 * 提案编辑器的所有操作函数 Hook
 * 包括：CRUD 操作、拖拽、生成等
 */
export function useProposalOperations(
  projectId: string,
  state: any // ProposalState
) {
  // ============ 章节操作 ============

  /**
   * 添加新章节
   */
  const addSection = useAsyncAction(
    async (title: string, parentId?: string) => {
      // TODO: 调用 API
      // const result = await sectionsApi.create({ ... });
      // state.setSections(prev => [...prev, result]);
      toast.success("章节已添加");
      return { id: "new", title, parentId };
    },
    {
      onSuccess: () => toast.success("章节已添加"),
      onError: (error) => toast.error(`添加失败: ${error.message}`),
    }
  );

  /**
   * 编辑章节
   */
  const editSection = useAsyncAction(
    async (sectionId: string, title: string) => {
      // TODO: 调用 API
      toast.success("章节已更新");
      return { id: sectionId, title };
    },
    {
      onSuccess: () => toast.success("章节已更新"),
    }
  );

  /**
   * 删除章节
   */
  const deleteSection = useAsyncAction(
    async (sectionId: string) => {
      // TODO: 调用 API
      toast.success("章节已删除");
      return { id: sectionId };
    },
    {
      onSuccess: () => toast.success("章节已删除"),
    }
  );

  // ============ 任务操作 ============

  /**
   * 添加任务到章节
   */
  const addTask = useAsyncAction(
    async (sectionId: string, title: string, sourceIds?: string[]) => {
      // TODO: 调用 API
      toast.success("任务已添加");
      return { id: "new", section_id: sectionId, title };
    },
    {
      onSuccess: () => toast.success("任务已添加"),
    }
  );

  /**
   * 编辑任务
   */
  const editTask = useAsyncAction(
    async (taskId: string, title: string, description?: string) => {
      // TODO: 调用 API
      toast.success("任务已更新");
      return { id: taskId, title, description };
    },
    {
      onSuccess: () => toast.success("任务已更新"),
    }
  );

  /**
   * 删除任务
   */
  const deleteTask = useAsyncAction(
    async (taskId: string) => {
      // TODO: 调用 API
      toast.success("任务已删除");
      return { id: taskId };
    },
    {
      onSuccess: () => toast.success("任务已删除"),
    }
  );

  // ============ 拖拽操作 ============

  /**
   * 处理章节拖拽重新排序
   */
  const handleSectionReorder = useCallback(
    async (sections: Section[]) => {
      try {
        // TODO: 调用 API 更新顺序
        state.setSections(sections);
      } catch (error) {
        toast.error("重新排序失败");
      }
    },
    [state]
  );

  /**
   * 处理任务拖拽重新排序
   */
  const handleTaskReorder = useCallback(
    async (sectionId: string, tasks: Task[]) => {
      try {
        // TODO: 调用 API 更新顺序
        state.setSections((prev: Section[]) => {
          // 更新对应章节的任务顺序
          return prev.map((s) => (s.id === sectionId ? { ...s, tasks } : s));
        });
      } catch (error) {
        toast.error("重新排序失败");
      }
    },
    [state]
  );

  // ============ 生成操作 ============

  /**
   * 生成任务（使用 AI）
   */
  const generateTasks = useAsyncAction(
    async (sectionId: string, sourceIds: string[], userDescription?: string) => {
      // TODO: 调用 n8n API
      state.setGenerating(true);
      state.setGeneratingSectionId(sectionId);

      try {
        // 模拟流式生成
        const tasks: Task[] = [];
        state.setProgress({ current: 0, total: 3 });

        for (let i = 0; i < 3; i++) {
          // 模拟 AI 生成
          await new Promise((resolve) => setTimeout(resolve, 1000));
          tasks.push({
            id: `task-${i}`,
            section_id: sectionId,
            title: `Generated Task ${i + 1}`,
            requirement_text: `Generated Task ${i + 1}`,
            status: 'pending',
            order_index: i,
          });
          state.setProgress({ current: i + 1, total: 3 });
        }

        toast.success("任务生成成功");
        return tasks;
      } finally {
        state.setGenerating(false);
        state.setGeneratingSectionId(null);
        state.setProgress(null);
      }
    }
  );

  /**
   * 生成小节内容
   */
  const generateSubsection = useAsyncAction(
    async (taskId: string, sourceIds: string[]) => {
      // TODO: 调用 API
      state.setIsGeneratingSubsection(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        toast.success("小节已生成");
        return { taskId, content: "Generated content" };
      } finally {
        state.setIsGeneratingSubsection(false);
      }
    }
  );

  /**
   * 生成任务内容
   */
  const generateTaskContent = useAsyncAction(
    async (taskId: string, sourceIds: string[]) => {
      // TODO: 调用 API
      state.setGeneratingTaskId(taskId);

      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        toast.success("内容已生成");
        return { taskId, content: "Generated content" };
      } finally {
        state.setGeneratingTaskId(null);
      }
    }
  );

  // ============ 图片操作 ============

  /**
   * 为任务生成图片
   */
  const generateImage = useAsyncAction(
    async (taskId: string, prompt: string) => {
      // TODO: 调用图片生成 API
      state.setGeneratingTaskId(taskId);

      try {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        toast.success("图片已生成");
        return { taskId, imageUrl: "https://via.placeholder.com/400" };
      } finally {
        state.setGeneratingTaskId(null);
      }
    }
  );

  /**
   * 上传任务图片
   */
  const uploadImage = useAsyncAction(
    async (taskId: string, file: File) => {
      // TODO: 调用 API 上传
      state.setGeneratingTaskId(taskId);

      try {
        // 模拟上传
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast.success("图片已上传");
        return { taskId, imageUrl: "uploaded-url" };
      } finally {
        state.setGeneratingTaskId(null);
      }
    }
  );

  // ============ 源文献操作 ============

  /**
   * 添加源文献到项目
   */
  const addSource = useAsyncAction(
    async (sourceData: any) => {
      // TODO: 调用 API
      toast.success("源文献已添加");
      return { id: "new", ...sourceData };
    },
    {
      onSuccess: () => toast.success("源文献已添加"),
    }
  );

  /**
   * 删除源文献
   */
  const deleteSource = useAsyncAction(
    async (sourceId: string) => {
      // TODO: 调用 API
      state.setSources((prev: any[]) => prev.filter((s) => s.id !== sourceId));
      toast.success("源文献已删除");
      return { id: sourceId };
    },
    {
      onSuccess: () => toast.success("源文献已删除"),
    }
  );

  /**
   * 链接源文献到任务
   */
  const linkSourceToTask = useCallback(
    async (taskId: string, sourceIds: string[]) => {
      try {
        // TODO: 调用 API
        toast.success("源文献已链接");
      } catch (error) {
        toast.error("链接失败");
      }
    },
    []
  );

  // ============ 返回所有操作函数 ============

  return {
    // 章节操作
    addSection: addSection.execute,
    editSection: editSection.execute,
    deleteSection: deleteSection.execute,

    // 任务操作
    addTask: addTask.execute,
    editTask: editTask.execute,
    deleteTask: deleteTask.execute,

    // 拖拽操作
    handleSectionReorder,
    handleTaskReorder,

    // 生成操作
    generateTasks: generateTasks.execute,
    generateSubsection: generateSubsection.execute,
    generateTaskContent: generateTaskContent.execute,

    // 图片操作
    generateImage: generateImage.execute,
    uploadImage: uploadImage.execute,

    // 源文献操作
    addSource: addSource.execute,
    deleteSource: deleteSource.execute,
    linkSourceToTask,

    // 状态信息
    isLoading:
      addSection.loading ||
      editSection.loading ||
      deleteSection.loading ||
      addTask.loading ||
      editTask.loading ||
      deleteTask.loading ||
      generateTasks.loading ||
      generateSubsection.loading ||
      generateTaskContent.loading ||
      generateImage.loading ||
      uploadImage.loading,

    errors: {
      addSection: addSection.error,
      editSection: editSection.error,
      deleteSection: deleteSection.error,
      addTask: addTask.error,
      editTask: editTask.error,
      deleteTask: deleteTask.error,
      generateTasks: generateTasks.error,
    },
  };
}
