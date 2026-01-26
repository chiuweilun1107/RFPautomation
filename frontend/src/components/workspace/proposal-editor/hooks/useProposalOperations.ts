"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Section, Task } from "../types";
import { toast } from "sonner";

/**
 * 提案編輯器的所有操作函數 Hook
 * 包括：章節 CRUD、任務 CRUD、拖拽、生成等
 */
export function useProposalOperations(
  projectId: string,
  sections: Section[],
  setSections: (sections: Section[] | ((prev: Section[]) => Section[])) => void,
  fetchData: () => Promise<void>
) {
  const supabase = createClient();

  // ============ 章節操作 ============

  /**
   * 添加新章節
   */
  const addSection = useCallback(
    async (title: string, parentId?: string) => {
      try {
        const { error } = await supabase.from("sections").insert({
          project_id: projectId,
          title,
          parent_id: parentId || null,
          order_index: 0, // Will be updated by database trigger
        });

        if (error) throw error;
        toast.success("章節已添加");
        await fetchData();
      } catch (error: any) {
        toast.error(`添加失敗: ${error.message}`);
        throw error;
      }
    },
    [projectId, supabase, fetchData]
  );

  /**
   * 編輯章節
   */
  const editSection = useCallback(
    async (sectionId: string, title: string) => {
      try {
        const { error } = await supabase
          .from("sections")
          .update({ title })
          .eq("id", sectionId);

        if (error) throw error;
        toast.success("章節已更新");
        await fetchData();
      } catch (error: any) {
        toast.error(`更新失敗: ${error.message}`);
        throw error;
      }
    },
    [supabase, fetchData]
  );

  /**
   * 刪除章節
   */
  const deleteSection = useCallback(
    async (sectionId: string) => {
      if (!confirm("確定要刪除此章節嗎？這將刪除所有子章節和任務。")) {
        return;
      }

      try {
        const { error } = await supabase
          .from("sections")
          .delete()
          .eq("id", sectionId);

        if (error) throw error;
        toast.success("章節已刪除");
        await fetchData();
      } catch (error: any) {
        toast.error(`刪除失敗: ${error.message}`);
        throw error;
      }
    },
    [supabase, fetchData]
  );

  // ============ 任務操作 ============

  /**
   * 添加任務到章節
   */
  const addTask = useCallback(
    async (sectionId: string, requirementText: string) => {
      try {
        const { error } = await supabase.from("tasks").insert({
          project_id: projectId,
          section_id: sectionId,
          requirement_text: requirementText,
          status: "pending",
        });

        if (error) throw error;
        toast.success("任務已添加");
        await fetchData();
      } catch (error: any) {
        toast.error(`添加失敗: ${error.message}`);
        throw error;
      }
    },
    [projectId, supabase, fetchData]
  );

  /**
   * 編輯任務
   */
  const editTask = useCallback(
    async (taskId: string, requirementText: string) => {
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ requirement_text: requirementText })
          .eq("id", taskId);

        if (error) throw error;
        toast.success("任務已更新");
        await fetchData();
      } catch (error: any) {
        toast.error(`更新失敗: ${error.message}`);
        throw error;
      }
    },
    [supabase, fetchData]
  );

  /**
   * 刪除任務
   */
  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!confirm("確定要刪除此任務嗎？")) {
        return;
      }

      try {
        const { error } = await supabase.from("tasks").delete().eq("id", taskId);

        if (error) throw error;
        toast.success("任務已刪除");

        // 直接更新本地狀態避免完整刷新
        setSections((prev) => {
          const removeTaskRecursive = (sections: Section[]): Section[] => {
            return sections.map((section) => ({
              ...section,
              tasks: section.tasks ? section.tasks.filter((t) => t.id !== taskId) : [],
              children: section.children ? removeTaskRecursive(section.children) : [],
            }));
          };
          return removeTaskRecursive(prev);
        });
      } catch (error: any) {
        toast.error(`刪除失敗: ${error.message}`);
        throw error;
      }
    },
    [supabase, setSections]
  );

  // ============ 拖拽操作 ============

  /**
   * 處理拖拽結束事件
   */
  const handleDragEnd = useCallback(
    async (event: any) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      // 任務拖拽
      if (activeData?.type === "task") {
        const activeTaskId = active.id as string;
        const sourceSectionId = activeData.sectionId as string;

        // 確定目標章節
        let targetSectionId: string;
        let targetTaskId: string | null = null;

        if (overData?.type === "task") {
          targetSectionId = overData.sectionId as string;
          targetTaskId = over.id as string;
        } else if (overData?.type === "section") {
          targetSectionId = over.id as string;
        } else if (overData?.type === "empty-section") {
          targetSectionId = overData.sectionId as string;
        } else {
          targetSectionId = sourceSectionId;
        }

        // 查找章節
        const findSection = (nodes: Section[], id: string): Section | null => {
          for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
              const found = findSection(node.children, id);
              if (found) return found;
            }
          }
          return null;
        };

        const sourceSection = findSection(sections, sourceSectionId);
        const targetSection = findSection(sections, targetSectionId);

        if (!sourceSection || !targetSection) return;

        const sourceTasks = [...(sourceSection.tasks || [])];
        const activeTaskIndex = sourceTasks.findIndex((t) => t.id === activeTaskId);
        if (activeTaskIndex === -1) return;

        const [movedTask] = sourceTasks.splice(activeTaskIndex, 1);

        let targetTasks: Task[];
        let insertIndex: number;

        if (sourceSectionId === targetSectionId) {
          // 同章節重新排序
          targetTasks = sourceTasks;
          if (targetTaskId) {
            insertIndex = targetTasks.findIndex((t) => t.id === targetTaskId);
            if (insertIndex === -1) insertIndex = targetTasks.length;
          } else {
            insertIndex = targetTasks.length;
          }
        } else {
          // 跨章節移動
          targetTasks = [...(targetSection.tasks || [])];
          if (targetTaskId) {
            insertIndex = targetTasks.findIndex((t) => t.id === targetTaskId);
            if (insertIndex === -1) insertIndex = targetTasks.length;
          } else {
            insertIndex = targetTasks.length;
          }
        }

        // 插入任務到新位置
        const taskToInsert = { ...movedTask, section_id: targetSectionId };
        targetTasks.splice(insertIndex, 0, taskToInsert);

        // 計算新的 order_index
        const prevTask = targetTasks[insertIndex - 1];
        const nextTask = targetTasks[insertIndex + 1];

        const prevOrder = prevTask?.order_index ?? (nextTask?.order_index ? nextTask.order_index - 1000 : 0);
        const nextOrder = nextTask?.order_index ?? prevOrder + 1000;

        const newOrderIndex = (prevOrder + nextOrder) / 2;
        taskToInsert.order_index = newOrderIndex;

        // 樂觀更新 UI
        setSections((prev) => {
          const updateSections = (nodes: Section[]): Section[] => {
            return nodes.map((node) => {
              const updatedNode = { ...node };
              if (node.id === sourceSectionId && sourceSectionId !== targetSectionId) {
                updatedNode.tasks = sourceTasks;
              }
              if (node.id === targetSectionId) {
                updatedNode.tasks = targetTasks;
              }
              if (node.children) {
                updatedNode.children = updateSections(node.children);
              }
              return updatedNode;
            });
          };
          return updateSections(prev);
        });

        // 更新數據庫
        try {
          const { error } = await supabase
            .from("tasks")
            .update({
              section_id: targetSectionId,
              order_index: newOrderIndex,
            })
            .eq("id", activeTaskId);

          if (error) throw error;
        } catch (error: any) {
          toast.error("拖拽更新失敗");
          await fetchData(); // 回滾
        }
      }

      // 章節拖拽
      if (activeData?.type === "section") {
        // TODO: 實現章節拖拽邏輯
      }
    },
    [sections, setSections, supabase, fetchData]
  );

  // ============ 生成操作 ============

  /**
   * 生成任務（使用 AI）
   */
  const generateTasks = useCallback(
    async (sectionId: string, sourceIds: string[], userDescription?: string, workflowType: "technical" | "management" = "technical") => {
      try {
        const response = await fetch("/api/webhook/generate-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            sectionId,
            sourceIds,
            userDescription,
            workflowType,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "生成失敗");
        }

        const result = await response.json();
        toast.success(`已生成 ${result.taskCount || 0} 個任務`);
        await fetchData();
      } catch (error: any) {
        toast.error(`生成失敗: ${error.message}`);
        throw error;
      }
    },
    [projectId, fetchData]
  );

  /**
   * 生成任務內容
   */
  const generateTaskContent = useCallback(
    async (taskId: string, sectionId: string, sectionTitle: string, taskText: string, sourceIds: string[], allSections: string[]) => {
      try {
        const response = await fetch("/api/webhook/generate-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "task",
            projectId,
            sectionId,
            sectionTitle,
            taskId,
            taskText,
            selectedSourceIds: sourceIds,
            allSections,
          }),
        });

        if (!response.ok) {
          throw new Error(`生成失敗: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          toast.success(`內容生成成功！(${result.wordCount || 0}字)`);
          return result;
        } else {
          throw new Error("生成失敗");
        }
      } catch (error: any) {
        toast.error(`內容生成失敗: ${error.message}`);
        throw error;
      }
    },
    [projectId]
  );

  /**
   * 整合章節內容
   */
  const integrateSection = useCallback(
    async (section: Section, taskContentsMap: Map<string, any>) => {
      const tasks = section.tasks || [];
      if (tasks.length === 0) {
        toast.error("此章節無任務可供整合");
        return;
      }

      const taskContentPayload: { title: string; content: string }[] = [];
      tasks.forEach((task) => {
        const content = taskContentsMap.get(task.id);
        if (content && content.content) {
          taskContentPayload.push({
            title: task.requirement_text,
            content: content.content,
          });
        }
      });

      if (taskContentPayload.length === 0) {
        toast.error("找不到已生成的任務內容，請先為任務生成內容");
        return;
      }

      try {
        toast.info(`正在整合 ${taskContentPayload.length} 篇任務內容...`);

        const response = await fetch("/api/webhook/integrate-chapter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            sectionId: section.id,
            sectionTitle: section.title,
            contents: taskContentPayload,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "整合請求失敗");
        }

        const data = await response.json();
        const resultText = data.integratedContent || data.content;

        if (!resultText) {
          throw new Error("API 未返回整合內容");
        }

        // 保存到數據庫
        const { error: dbError } = await supabase
          .from("sections")
          .update({
            content: resultText,
            last_integrated_at: new Date().toISOString(),
          })
          .eq("id", section.id);

        if (dbError) throw dbError;

        toast.success("整合成功且已儲存！");
        await fetchData();
      } catch (error: any) {
        toast.error(`整合失敗: ${error.message}`);
        throw error;
      }
    },
    [projectId, supabase, fetchData]
  );

  /**
   * 生成圖片
   */
  const generateImage = useCallback(
    async (taskId: string, options: any) => {
      try {
        const response = await fetch("/api/webhook/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task_id: taskId,
            ...options,
          }),
        });

        if (!response.ok) {
          throw new Error("圖片生成失敗");
        }

        const result = await response.json();
        toast.success("圖片已生成");
        await fetchData();
        return result;
      } catch (error: any) {
        toast.error(`圖片生成失敗: ${error.message}`);
        throw error;
      }
    },
    [fetchData]
  );

  // ============ 返回所有操作函數 ============

  return {
    // 章節操作
    addSection,
    editSection,
    deleteSection,

    // 任務操作
    addTask,
    editTask,
    deleteTask,

    // 拖拽操作
    handleDragEnd,

    // 生成操作
    generateTasks,
    generateTaskContent,
    integrateSection,
    generateImage,
  };
}
