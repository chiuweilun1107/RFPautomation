"use client";

import { useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { useProposalState } from "./hooks/useProposalState";
import { useProposalDialogs } from "./hooks/useProposalDialogs";
import { useProposalOperations } from "./hooks/useProposalOperations";
import { ProposalTree } from "./components/ProposalTree";
import { ProposalHeader } from "./components/ProposalHeader";
import { ProposalDialogs } from "./components/ProposalDialogs";
import { FloatingContentPanels } from "./components/FloatingContentPanels";
import { ProposalTreeItem } from "../structure/ProposalTreeItem";
import { ProposalEditorProvider } from "./context/ProposalEditorContext";

import type { ProposalStructureEditorProps, Section, Task, TaskContent, Source } from "./types";

/**
 * 提案結構編輯器 - 重構版本
 * 使用模塊化的 hooks 和組件
 *
 * 架構：
 * - useProposalState: 統一狀態管理
 * - useProposalDialogs: Dialog 狀態管理
 * - useProposalOperations: CRUD 和生成操作
 * - ProposalTree: 樹形結構渲染
 */
export function ProposalStructureEditor({ projectId }: ProposalStructureEditorProps) {
  const supabase = createClient();

  // ============ 狀態管理 ============
  const state = useProposalState([]);
  const dialogs = useProposalDialogs();

  const {
    sections,
    setSections,
    loading,
    setLoading,
    expandedSections,
    sources,
    setSources,
    taskContents,
    setTaskContents,
    openContentPanels,
    setOpenContentPanels,
    sectionViewModes,
    setSectionViewModes,
    expandedTaskIds,
    inlineEditingSectionId,
    inlineSectionValue,
    setInlineSectionValue,
    inlineEditingTaskId,
    inlineTaskValue,
    setInlineTaskValue,
    integratingSectionId,
    setIntegratingSectionId,
    setSelectedEvidence,
    toggleSectionExpansion,
    toggleTaskExpansion,
    startInlineEditSection,
    cancelInlineEditSection,
    startInlineEditTask,
    cancelInlineEditTask,
  } = state;

  // ============ 數據加載 ============

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. 獲取章節
      const { data: sectionsData, error: sectionsError } = await supabase
        .from("sections")
        .select("*")
        .eq("project_id", projectId)
        .order("order_index", { ascending: true });

      if (sectionsError) throw sectionsError;

      // 2. 獲取任務
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*, task_images(*)")
        .eq("project_id", projectId)
        .order("order_index", { ascending: true });

      if (tasksError) throw tasksError;

      // 3. 獲取源文獻
      const { data: sourcesData, error: sourcesError } = await supabase
        .from("sources")
        .select("*")
        .or(`project_id.is.null,project_id.eq.${projectId}`)
        .order("created_at", { ascending: false });

      if (sourcesError) console.error("Error fetching sources:", sourcesError);
      if (sourcesData) setSources(sourcesData);

      // 4. 構建樹形結構
      const sectionMap = new Map<string, Section>();
      const roots: Section[] = [];

      sectionsData?.forEach((s) => {
        const sectionTasks = tasksData?.filter((t: any) => t.section_id === s.id) || [];
        sectionMap.set(s.id, {
          ...s,
          children: [],
          tasks: sectionTasks,
        });
      });

      sectionsData?.forEach((s) => {
        const node = sectionMap.get(s.id)!;
        if (s.parent_id && sectionMap.has(s.parent_id)) {
          sectionMap.get(s.parent_id)!.children?.push(node);
        } else {
          roots.push(node);
        }
      });

      setSections(roots);
    } catch (error) {
      console.error("Error fetching structure:", error);
      toast.error("載入提案結構失敗");
    } finally {
      setLoading(false);
    }
  }, [projectId, supabase, setLoading, setSections, setSources]);

  // 初始載入
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============ 操作函數 ============
  const operations = useProposalOperations(projectId, sections, setSections, fetchData);

  // ============ DnD 感應器 ============
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ============ 源文獻映射 ============
  const fullSources = useMemo(() => {
    const map: Record<string, Source> = {};
    sources.forEach((s: Source) => {
      map[s.id] = s;
    });
    return map;
  }, [sources]);

  // ============ 任務內容加載 ============
  const fetchTaskContents = useCallback(async () => {
    try {
      const taskIds: string[] = [];
      const collectTaskIds = (nodes: Section[]) => {
        nodes.forEach((section) => {
          section.tasks?.forEach((task) => taskIds.push(task.id));
          if (section.children) collectTaskIds(section.children);
        });
      };
      collectTaskIds(sections);

      if (taskIds.length === 0) return;

      const { data, error } = await supabase
        .from("task_contents")
        .select("*")
        .in("task_id", taskIds)
        .order("version", { ascending: false });

      if (error) throw error;

      const contentsMap = new Map<string, TaskContent>();
      data?.forEach((tc: TaskContent) => {
        if (!contentsMap.has(tc.task_id)) {
          contentsMap.set(tc.task_id, tc);
        }
      });
      setTaskContents(contentsMap);
    } catch (error) {
      console.error("Error fetching task contents:", error);
    }
  }, [sections, supabase, setTaskContents]);

  useEffect(() => {
    if (sections.length > 0) {
      fetchTaskContents();
    }
  }, [sections, fetchTaskContents]);

  // ============ 章節內容編輯 ============
  const startEditingSectionContent = useCallback(
    (section: Section) => {
      startInlineEditSection(section.id, section.content || "");
    },
    [startInlineEditSection]
  );

  const saveEditingSectionContent = useCallback(
    async (sectionId: string) => {
      try {
        const { error } = await supabase
          .from("sections")
          .update({ content: inlineSectionValue })
          .eq("id", sectionId);

        if (error) throw error;
        toast.success("章節內容已更新");
        cancelInlineEditSection();
        fetchData();
      } catch (error) {
        toast.error(`更新失敗: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    },
    [supabase, inlineSectionValue, cancelInlineEditSection, fetchData]
  );

  const cancelEditingSectionContent = useCallback(() => {
    cancelInlineEditSection();
  }, [cancelInlineEditSection]);

  // ============ 任務內聯編輯 ============
  const saveInlineEdit = useCallback(async () => {
    if (!inlineEditingTaskId) return;
    await operations.editTask(inlineEditingTaskId, inlineTaskValue);
    cancelInlineEditTask();
  }, [inlineEditingTaskId, inlineTaskValue, operations, cancelInlineEditTask]);

  const cancelInlineEdit = useCallback(() => {
    cancelInlineEditTask();
  }, [cancelInlineEditTask]);

  const startInlineEdit = useCallback(
    (task: Task) => {
      startInlineEditTask(task.id, task.requirement_text);
    },
    [startInlineEditTask]
  );

  // ============ 章節操作 ============
  const handleIntegrateSection = useCallback(
    async (section: Section) => {
      setIntegratingSectionId(section.id);
      try {
        await operations.integrateSection(section, taskContents);
        setSectionViewModes((prev) => ({ ...prev, [section.id]: "content" }));
      } catch (error) {
        // Error handled in operations
      } finally {
        setIntegratingSectionId(null);
      }
    },
    [operations, taskContents, setIntegratingSectionId, setSectionViewModes]
  );

  const handleDeleteImage = useCallback(
    async (imageId: string, imageUrl: string) => {
      if (!confirm("確定要刪除此圖片嗎？")) return;

      try {
        const { error } = await supabase.from("task_images").delete().eq("id", imageId);
        if (error) throw error;

        toast.success("圖片已刪除");
        fetchData();
      } catch (error) {
        toast.error(`刪除失敗: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    },
    [supabase, fetchData]
  );

  // ============ 內容面板 ============
  const openContentPanel = useCallback(
    (task: Task, sectionTitle: string) => {
      setOpenContentPanels((prev) => {
        const newMap = new Map(prev);
        newMap.set(task.id, { taskText: task.requirement_text, sectionTitle });
        return newMap;
      });
    },
    [setOpenContentPanels]
  );

  const closeContentPanel = useCallback(
    (taskId: string) => {
      setOpenContentPanels((prev) => {
        const newMap = new Map(prev);
        newMap.delete(taskId);
        return newMap;
      });
    },
    [setOpenContentPanels]
  );

  // ============ Dialog 處理函數 ============

  // 添加章節
  const handleAddSection = useCallback(async () => {
    if (!dialogs.dialogInputValue.trim()) return;
    await operations.addSection(dialogs.dialogInputValue, state.targetSectionId || undefined);
    dialogs.closeAddSection();
    dialogs.setDialogInputValue("");
  }, [dialogs, operations, state.targetSectionId]);

  // 添加任務
  const handleAddTask = useCallback(async () => {
    if (!dialogs.dialogInputValue.trim() || !state.targetSection) return;
    await operations.addTask(state.targetSection.id, dialogs.dialogInputValue);
    dialogs.closeAddTask();
    dialogs.setDialogInputValue("");
  }, [dialogs, operations, state.targetSection]);

  // 更新任務
  const handleUpdateTask = useCallback(async () => {
    if (!dialogs.dialogInputValue.trim() || !state.editingTask) return;
    await operations.editTask(state.editingTask.id, dialogs.dialogInputValue);
    dialogs.closeAddTask();
    dialogs.setDialogInputValue("");
    state.setEditingTask(null);
  }, [dialogs, operations, state]);

  // 添加次章節
  const handleAddSubsection = useCallback(async () => {
    if (!dialogs.subsectionInputValue.trim() || !state.targetSection) return;
    await operations.addSection(dialogs.subsectionInputValue, state.targetSection.id);
    dialogs.closeAddSubsection();
    dialogs.setSubsectionInputValue("");
  }, [dialogs, operations, state.targetSection]);

  // 切換到 AI 生成次章節
  const handleSwitchToAIGeneration = useCallback(() => {
    dialogs.closeAddSubsection();
    dialogs.openGenerateSubsection();
  }, [dialogs]);

  // 生成技術規約任務
  const handleGenerateTechnical = useCallback(async () => {
    if (!state.targetSection || state.selectedSourceIds.length === 0) return;

    const section = state.targetSection;
    const hasExistingTasks = section.tasks && section.tasks.length > 0;

    if (hasExistingTasks) {
      dialogs.setTaskConflictContext({
        type: "all",
        targetSection: section,
        sourceIds: state.selectedSourceIds,
        workflowType: "technical",
      });
      dialogs.openConflictDialog();
    } else {
      await operations.generateTasks(
        section.id,
        state.selectedSourceIds,
        undefined,
        "technical"
      );
      dialogs.closeAddTask();
    }
  }, [state, dialogs, operations]);

  // 生成管理規劃任務
  const handleGenerateManagement = useCallback(async () => {
    if (!state.targetSection || state.selectedSourceIds.length === 0) return;

    const section = state.targetSection;
    const hasExistingTasks = section.tasks && section.tasks.length > 0;

    if (hasExistingTasks) {
      dialogs.setTaskConflictContext({
        type: "all",
        targetSection: section,
        sourceIds: state.selectedSourceIds,
        workflowType: "management",
      });
      dialogs.openConflictDialog();
    } else {
      await operations.generateTasks(
        section.id,
        state.selectedSourceIds,
        undefined,
        "management"
      );
      dialogs.closeAddTask();
    }
  }, [state, dialogs, operations]);

  // 生成次章節
  const handleGenerateSubsections = useCallback(async () => {
    if (!state.targetSection || state.subsectionSourceIds.length === 0) return;

    const section = state.targetSection;
    const hasChildren = section.children && section.children.length > 0;

    if (hasChildren) {
      dialogs.setPendingSubsectionArgs({
        sectionId: section.id,
        sourceIds: state.subsectionSourceIds,
      });
      dialogs.openSubsectionConflictDialog();
    } else {
      // TODO: 調用生成次章節 API
      toast.info("次章節生成功能待實現");
      dialogs.closeGenerateSubsection();
    }
  }, [state, dialogs]);

  // 生成任務內容
  const handleGenerateTaskContent = useCallback(async () => {
    const target = dialogs.contentGenerationTarget;
    if (!target || state.contentGenerationSourceIds.length === 0) return;

    const { task, section } = target;
    const existingContent = taskContents.get(task.id);

    if (existingContent?.content) {
      dialogs.setPendingContentGeneration({
        task,
        section,
        sourceIds: state.contentGenerationSourceIds,
      });
      dialogs.openContentConflictDialog();
    } else {
      const allSectionTitles = sections.map(s => s.title);
      await operations.generateTaskContent(
        task.id,
        section.id,
        section.title,
        task.requirement_text,
        state.contentGenerationSourceIds,
        allSectionTitles
      );
      dialogs.closeContentGeneration();
    }
  }, [dialogs, state, taskContents, sections, operations]);

  // 生成圖片
  const handleGenerateImage = useCallback(
    async (options: any) => {
      if (!dialogs.selectedTaskForImage) return;
      await operations.generateImage(dialogs.selectedTaskForImage.id, options);
    },
    [dialogs.selectedTaskForImage, operations]
  );

  // 打開內容生成對話框
  const openContentGenerationDialog = useCallback(
    (task: Task, section: Section) => {
      dialogs.setContentGenerationTarget({ task, section });
      dialogs.openContentGeneration();
    },
    [dialogs]
  );

  // 打開圖片生成對話框
  const openImageGenerationDialog = useCallback(
    (task: Task, section: Section) => {
      dialogs.setSelectedTaskForImage(task);
      dialogs.openImageGeneration();
    },
    [dialogs]
  );

  // 衝突處理：保留並新增
  const handleConflictAppend = useCallback(async () => {
    const ctx = dialogs.taskConflictContext;
    if (!ctx || !ctx.targetSection) return;

    await operations.generateTasks(
      ctx.targetSection.id,
      ctx.sourceIds,
      ctx.userDesc,
      ctx.workflowType
    );
    dialogs.closeConflictDialog();
    dialogs.setTaskConflictContext(null);
    dialogs.closeAddTask();
  }, [dialogs, operations]);

  // 衝突處理：全部取代
  const handleConflictReplace = useCallback(async () => {
    const ctx = dialogs.taskConflictContext;
    if (!ctx || !ctx.targetSection) return;

    // 刪除所有現有任務
    const tasks = ctx.targetSection.tasks || [];
    for (const task of tasks) {
      await operations.deleteTask(task.id);
    }

    await operations.generateTasks(
      ctx.targetSection.id,
      ctx.sourceIds,
      ctx.userDesc,
      ctx.workflowType
    );
    dialogs.closeConflictDialog();
    dialogs.setTaskConflictContext(null);
    dialogs.closeAddTask();
  }, [dialogs, operations]);

  // 次章節衝突：保留並新增
  const handleSubsectionConflictAppend = useCallback(async () => {
    const args = dialogs.pendingSubsectionArgs;
    if (!args) return;

    // TODO: 調用生成次章節 API (append mode)
    toast.info("次章節生成功能待實現");
    dialogs.closeSubsectionConflictDialog();
    dialogs.setPendingSubsectionArgs(null);
    dialogs.closeGenerateSubsection();
  }, [dialogs]);

  // 次章節衝突：全部取代
  const handleSubsectionConflictReplace = useCallback(async () => {
    const args = dialogs.pendingSubsectionArgs;
    if (!args) return;

    // TODO: 刪除現有次章節並生成新的
    toast.info("次章節生成功能待實現");
    dialogs.closeSubsectionConflictDialog();
    dialogs.setPendingSubsectionArgs(null);
    dialogs.closeGenerateSubsection();
  }, [dialogs]);

  // 內容衝突：保留並新增
  const handleContentConflictAppend = useCallback(async () => {
    const pending = dialogs.pendingContentGeneration;
    if (!pending) return;

    const { task, section, sourceIds } = pending;
    const allSectionTitles = sections.map(s => s.title);

    // TODO: 實現 append 模式
    await operations.generateTaskContent(
      task.id,
      section.id,
      section.title,
      task.requirement_text,
      sourceIds,
      allSectionTitles
    );
    dialogs.closeContentConflictDialog();
    dialogs.setPendingContentGeneration(null);
    dialogs.closeContentGeneration();
  }, [dialogs, sections, operations]);

  // 內容衝突：全部取代
  const handleContentConflictReplace = useCallback(async () => {
    const pending = dialogs.pendingContentGeneration;
    if (!pending) return;

    const { task, section, sourceIds } = pending;
    const allSectionTitles = sections.map(s => s.title);

    // 刪除現有內容
    const existingContent = taskContents.get(task.id);
    if (existingContent?.id) {
      await supabase.from("task_contents").delete().eq("id", existingContent.id);
    }

    await operations.generateTaskContent(
      task.id,
      section.id,
      section.title,
      task.requirement_text,
      sourceIds,
      allSectionTitles
    );
    dialogs.closeContentConflictDialog();
    dialogs.setPendingContentGeneration(null);
    dialogs.closeContentGeneration();
  }, [dialogs, sections, taskContents, operations, supabase]);

  // 取消衝突處理
  const handleConflictCancel = useCallback(() => {
    dialogs.closeConflictDialog();
    dialogs.closeSubsectionConflictDialog();
    dialogs.closeContentConflictDialog();
    dialogs.setTaskConflictContext(null);
    dialogs.setPendingSubsectionArgs(null);
    dialogs.setPendingContentGeneration(null);
  }, [dialogs]);

  // 打開添加源文獻對話框
  const handleAddSource = useCallback(() => {
    toast.info("添加源文獻功能待實現");
  }, []);

  // ============ Context 回調函數 ============
  // 這些回調函數被 Context 使用，需要穩定引用
  const continueAddTaskCallback = useCallback(
    (section: Section) => {
      state.setTargetSection(section);
      dialogs.setDialogInputValue("");
      state.setSelectedSourceIds([]);
      dialogs.setShowSourceSelector(false);
      dialogs.openAddTask();
    },
    [state, dialogs]
  );

  const openAddSectionCallback = useCallback(
    (parentId: string | null) => {
      state.setTargetSectionId(parentId || null);
      dialogs.setDialogInputValue("");
      dialogs.openAddSection();
    },
    [state, dialogs]
  );

  const openAddSubsectionCallback = useCallback(
    (section: Section) => {
      state.setTargetSection(section);
      dialogs.setSubsectionInputValue("");
      dialogs.openAddSubsection();
    },
    [state, dialogs]
  );

  const openEditSectionCallback = useCallback(
    (section: Section) => {
      state.setEditingSection(section);
      dialogs.setDialogInputValue(section.title);
      dialogs.openAddSection();
    },
    [state, dialogs]
  );

  // ============ 渲染章節項 ============
  // 使用 Context 後，renderSection 變得更簡潔
  // 只需傳遞 section-specific 的 props
  const renderSection = useCallback(
    (section: Section, depth: number = 0, dragHandleProps?: any) => {
      return (
        <ProposalTreeItem
          key={section.id}
          section={section}
          depth={depth}
          dragHandleProps={dragHandleProps}
        />
      );
    },
    []
  );

  // ============ 計算統計數據 ============
  const totalSections = useMemo(() => {
    let count = 0;
    const countSections = (nodes: Section[]) => {
      nodes.forEach((node) => {
        count++;
        if (node.children) countSections(node.children);
      });
    };
    countSections(sections);
    return count;
  }, [sections]);

  const completedSections = useMemo(() => {
    let count = 0;
    const countCompleted = (nodes: Section[]) => {
      nodes.forEach((node) => {
        if (node.content && node.content.trim().length > 0) count++;
        if (node.children) countCompleted(node.children);
      });
    };
    countCompleted(sections);
    return count;
  }, [sections]);

  // ============ 渲染 ============
  return (
    <ProposalEditorProvider
      // Expansion State
      expandedSections={expandedSections}
      toggleExpand={toggleSectionExpansion}
      sectionViewModes={sectionViewModes}
      setSectionViewModes={setSectionViewModes}
      expandedTaskIds={expandedTaskIds}
      toggleTaskExpansion={toggleTaskExpansion}
      // Data Sources
      fullSources={fullSources}
      sources={sources as Source[]}
      taskContents={taskContents}
      // Section Actions
      handleIntegrateSection={handleIntegrateSection}
      continueAddTask={continueAddTaskCallback}
      openAddSection={openAddSectionCallback}
      openAddSubsection={openAddSubsectionCallback}
      openEditSection={openEditSectionCallback}
      handleDeleteSection={operations.deleteSection}
      integratingSectionId={integratingSectionId}
      // Section Inline Edit
      inlineEditingSectionId={inlineEditingSectionId}
      inlineSectionValue={inlineSectionValue}
      setInlineSectionValue={setInlineSectionValue}
      startEditingSectionContent={startEditingSectionContent}
      saveEditingSectionContent={saveEditingSectionContent}
      cancelEditingSectionContent={cancelEditingSectionContent}
      // Task Inline Edit
      inlineEditingTaskId={inlineEditingTaskId}
      inlineTaskValue={inlineTaskValue}
      setInlineTaskValue={setInlineTaskValue}
      saveInlineEdit={saveInlineEdit}
      cancelInlineEdit={cancelInlineEdit}
      openEditTask={startInlineEdit}
      // Task Actions
      handleGenerateTaskContent={openContentGenerationDialog}
      handleGenerateTaskImage={openImageGenerationDialog}
      openContentPanel={openContentPanel}
      handleDeleteTask={operations.deleteTask}
      handleDeleteImage={handleDeleteImage}
      setSelectedEvidence={setSelectedEvidence}
      // Filter Config
      taskFilter="all"
    >
      <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
        {/* 主內容區域 */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* 頂部工具欄 */}
            <ProposalHeader
              generating={state.generating}
              onGenerate={() => {
                dialogs.openAddSection();
                // TODO: 實現自動生成章節功能
              }}
              onAddSection={() => {
                state.setTargetSectionId(null);
                dialogs.setDialogInputValue("");
                dialogs.openAddSection();
              }}
              generationProgress={state.progress || undefined}
              totalSections={totalSections}
              completedSections={completedSections}
            />

            {/* 章節樹 */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={operations.handleDragEnd}
            >
              <ProposalTree
                sections={sections}
                loading={loading}
                expandedSections={expandedSections}
                renderSection={renderSection}
                onToggleExpand={toggleSectionExpansion}
              />
            </DndContext>
          </div>
        </div>

        {/* 浮動內容面板 */}
        {openContentPanels.size > 0 && (
          <FloatingContentPanels
            openContentPanels={openContentPanels}
            taskContents={taskContents}
            onClose={closeContentPanel}
          />
        )}

        {/* 所有對話框 */}
        <ProposalDialogs
        // Dialog 狀態
        isAddSectionOpen={dialogs.isAddSectionOpen}
        isAddTaskOpen={dialogs.isAddTaskOpen}
        isAddSubsectionOpen={dialogs.isAddSubsectionOpen}
        isGenerateSubsectionOpen={dialogs.isGenerateSubsectionOpen}
        isContentGenerationDialogOpen={dialogs.isContentGenerationDialogOpen}
        imageGenDialogOpen={dialogs.imageGenDialogOpen}
        isConflictDialogOpen={dialogs.isConflictDialogOpen}
        isSubsectionConflictDialogOpen={dialogs.isSubsectionConflictDialogOpen}
        isContentConflictDialogOpen={dialogs.isContentConflictDialogOpen}
        // Dialog 控制
        setIsAddSectionOpen={dialogs.setIsAddSectionOpen}
        setIsAddTaskOpen={dialogs.setIsAddTaskOpen}
        setIsAddSubsectionOpen={dialogs.setIsAddSubsectionOpen}
        setIsGenerateSubsectionOpen={dialogs.setIsGenerateSubsectionOpen}
        setIsContentGenerationDialogOpen={dialogs.setIsContentGenerationDialogOpen}
        setImageGenDialogOpen={dialogs.setImageGenDialogOpen}
        setIsConflictDialogOpen={dialogs.setIsConflictDialogOpen}
        setIsSubsectionConflictDialogOpen={dialogs.setIsSubsectionConflictDialogOpen}
        setIsContentConflictDialogOpen={dialogs.setIsContentConflictDialogOpen}
        // 數據
        sources={sources as Source[]}
        dialogInputValue={dialogs.dialogInputValue}
        setDialogInputValue={dialogs.setDialogInputValue}
        subsectionInputValue={dialogs.subsectionInputValue}
        setSubsectionInputValue={dialogs.setSubsectionInputValue}
        // 上下文
        targetSection={state.targetSection}
        selectedTaskForImage={dialogs.selectedTaskForImage}
        contentGenerationTarget={dialogs.contentGenerationTarget}
        taskConflictContext={dialogs.taskConflictContext}
        pendingSubsectionArgs={dialogs.pendingSubsectionArgs}
        pendingContentGeneration={dialogs.pendingContentGeneration}
        // 選擇狀態
        selectedSourceIds={state.selectedSourceIds}
        setSelectedSourceIds={state.setSelectedSourceIds}
        contentGenerationSourceIds={state.contentGenerationSourceIds}
        setContentGenerationSourceIds={state.setContentGenerationSourceIds}
        subsectionSourceIds={state.subsectionSourceIds}
        setSubsectionSourceIds={state.setSubsectionSourceIds}
        showSourceSelector={dialogs.showSourceSelector}
        setShowSourceSelector={dialogs.setShowSourceSelector}
        // 操作
        onAddSection={handleAddSection}
        onAddTask={handleAddTask}
        onUpdateTask={handleUpdateTask}
        onAddSubsection={handleAddSubsection}
        onGenerateTechnical={handleGenerateTechnical}
        onGenerateManagement={handleGenerateManagement}
        onGenerateTaskContent={handleGenerateTaskContent}
        onGenerateSubsections={handleGenerateSubsections}
        onGenerateImage={handleGenerateImage}
        onAddSource={handleAddSource}
        onSwitchToAIGeneration={handleSwitchToAIGeneration}
        // 衝突處理
        onConflictAppend={handleConflictAppend}
        onConflictReplace={handleConflictReplace}
        onConflictCancel={handleConflictCancel}
        onSubsectionConflictAppend={handleSubsectionConflictAppend}
        onSubsectionConflictReplace={handleSubsectionConflictReplace}
        onContentConflictAppend={handleContentConflictAppend}
        onContentConflictReplace={handleContentConflictReplace}
        // 狀態
        generating={state.generating}
        editingTask={state.editingTask}
        editingSection={state.editingSection}
        projectImages={state.allProjectImages}
      />
      </div>
    </ProposalEditorProvider>
  );
}
