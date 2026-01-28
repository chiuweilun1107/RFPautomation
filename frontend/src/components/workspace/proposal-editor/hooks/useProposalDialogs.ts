"use client";

import { useState, useCallback } from "react";

/**
 * 提案编辑器的所有 Dialog 状态管理 Hook
 * 统一管理 Dialog 打开/关闭状态和关联的输入数据
 */
export function useProposalDialogs() {
  // ============ 章节和任务相关 Dialog ============
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddSubsectionOpen, setIsAddSubsectionOpen] = useState(false);

  // ============ 生成相关 Dialog ============
  const [isGenerateSubsectionOpen, setIsGenerateSubsectionOpen] = useState(false);
  const [imageGenDialogOpen, setImageGenDialogOpen] = useState(false);
  const [isContentGenerationDialogOpen, setIsContentGenerationDialogOpen] = useState(false);
  const [isTaskGenerationDialogOpen, setIsTaskGenerationDialogOpen] = useState(false);

  // ============ 源文献相关 Dialog ============
  const [isAddSourceDialogOpen, setIsAddSourceDialogOpen] = useState(false);

  // ============ 冲突确认 Dialog ============
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [isSubsectionConflictDialogOpen, setIsSubsectionConflictDialogOpen] = useState(false);
  const [isContentConflictDialogOpen, setIsContentConflictDialogOpen] = useState(false);

  // ============ 模板相关 Dialog ============
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  // ============ Dialog 输入数据 ============
  const [dialogInputValue, setDialogInputValue] = useState("");
  const [subsectionInputValue, setSubsectionInputValue] = useState("");

  // ============ Dialog 上下文信息 ============
  const [taskConflictContext, setTaskConflictContext] = useState<any | null>(null);
  const [contentGenerationTarget, setContentGenerationTarget] = useState<any | null>(null);
  const [selectedTaskForImage, setSelectedTaskForImage] = useState<any | null>(null);
  const [taskGenerationContext, setTaskGenerationContext] = useState<any | null>(null);
  const [subsectionTargetSection, setSubsectionTargetSection] = useState<any | null>(null);
  const [structureWarningSection, setStructureWarningSection] = useState<any | null>(null);

  // ============ UI 状态 ============
  const [showSourceSelector, setShowSourceSelector] = useState(false);

  // ============ 待处理的异步操作数据 ============
  const [pendingSubsectionArgs, setPendingSubsectionArgs] = useState<any | null>(null);
  const [pendingContentGeneration, setPendingContentGeneration] = useState<any | null>(null);

  // ============ 便利函数：打开对应的 Dialog ============

  const openAddSection = useCallback(() => setIsAddSectionOpen(true), []);
  const closeAddSection = useCallback(() => setIsAddSectionOpen(false), []);

  const openAddTask = useCallback(() => setIsAddTaskOpen(true), []);
  const closeAddTask = useCallback(() => setIsAddTaskOpen(false), []);

  const openAddSubsection = useCallback(() => setIsAddSubsectionOpen(true), []);
  const closeAddSubsection = useCallback(() => setIsAddSubsectionOpen(false), []);

  const openGenerateSubsection = useCallback(() => setIsGenerateSubsectionOpen(true), []);
  const closeGenerateSubsection = useCallback(() => setIsGenerateSubsectionOpen(false), []);

  const openImageGeneration = useCallback(() => setImageGenDialogOpen(true), []);
  const closeImageGeneration = useCallback(() => setImageGenDialogOpen(false), []);

  const openContentGeneration = useCallback(() => setIsContentGenerationDialogOpen(true), []);
  const closeContentGeneration = useCallback(() => setIsContentGenerationDialogOpen(false), []);

  const openTaskGeneration = useCallback(() => setIsTaskGenerationDialogOpen(true), []);
  const closeTaskGeneration = useCallback(() => setIsTaskGenerationDialogOpen(false), []);

  const openAddSource = useCallback(() => setIsAddSourceDialogOpen(true), []);
  const closeAddSource = useCallback(() => setIsAddSourceDialogOpen(false), []);

  const openConflictDialog = useCallback(() => setIsConflictDialogOpen(true), []);
  const closeConflictDialog = useCallback(() => setIsConflictDialogOpen(false), []);

  const openSubsectionConflictDialog = useCallback(() => setIsSubsectionConflictDialogOpen(true), []);
  const closeSubsectionConflictDialog = useCallback(() => setIsSubsectionConflictDialogOpen(false), []);

  const openContentConflictDialog = useCallback(() => setIsContentConflictDialogOpen(true), []);
  const closeContentConflictDialog = useCallback(() => setIsContentConflictDialogOpen(false), []);

  const openTemplateDialog = useCallback(() => setIsTemplateDialogOpen(true), []);
  const closeTemplateDialog = useCallback(() => setIsTemplateDialogOpen(false), []);

  // ============ 批量关闭函数 ============

  /**
   * 关闭所有 Dialog
   */
  const closeAllDialogs = useCallback(() => {
    setIsAddSectionOpen(false);
    setIsAddTaskOpen(false);
    setIsAddSubsectionOpen(false);
    setIsGenerateSubsectionOpen(false);
    setImageGenDialogOpen(false);
    setIsContentGenerationDialogOpen(false);
    setIsTaskGenerationDialogOpen(false);
    setIsAddSourceDialogOpen(false);
    setIsConflictDialogOpen(false);
    setIsSubsectionConflictDialogOpen(false);
    setIsContentConflictDialogOpen(false);
    setIsTemplateDialogOpen(false);
  }, []);

  /**
   * 仅关闭冲突 Dialog（保持其他打开）
   */
  const closeConflictDialogs = useCallback(() => {
    setIsConflictDialogOpen(false);
    setIsSubsectionConflictDialogOpen(false);
    setIsContentConflictDialogOpen(false);
  }, []);

  /**
   * 仅关闭生成 Dialog（保持其他打开）
   */
  const closeGenerationDialogs = useCallback(() => {
    setIsGenerateSubsectionOpen(false);
    setImageGenDialogOpen(false);
    setIsContentGenerationDialogOpen(false);
    setIsTaskGenerationDialogOpen(false);
  }, []);

  return {
    // ============ Dialog 开关状态 ============
    isAddSectionOpen,
    isAddTaskOpen,
    isAddSubsectionOpen,
    isGenerateSubsectionOpen,
    imageGenDialogOpen,
    isContentGenerationDialogOpen,
    isTaskGenerationDialogOpen,
    isAddSourceDialogOpen,
    isConflictDialogOpen,
    isSubsectionConflictDialogOpen,
    isContentConflictDialogOpen,
    isTemplateDialogOpen,

    // ============ Dialog 开关设置函数 ============
    setIsAddSectionOpen,
    setIsAddTaskOpen,
    setIsAddSubsectionOpen,
    setIsGenerateSubsectionOpen,
    setImageGenDialogOpen,
    setIsContentGenerationDialogOpen,
    setIsTaskGenerationDialogOpen,
    setIsAddSourceDialogOpen,
    setIsConflictDialogOpen,
    setIsSubsectionConflictDialogOpen,
    setIsContentConflictDialogOpen,
    setIsTemplateDialogOpen,

    // ============ Dialog 输入数据 ============
    dialogInputValue,
    setDialogInputValue,
    subsectionInputValue,
    setSubsectionInputValue,

    // ============ Dialog 上下文信息 ============
    taskConflictContext,
    setTaskConflictContext,
    contentGenerationTarget,
    setContentGenerationTarget,
    selectedTaskForImage,
    setSelectedTaskForImage,
    taskGenerationContext,
    setTaskGenerationContext,
    subsectionTargetSection,
    setSubsectionTargetSection,
    structureWarningSection,
    setStructureWarningSection,

    // ============ UI 状态 ============
    showSourceSelector,
    setShowSourceSelector,

    // ============ 待处理的异步操作数据 ============
    pendingSubsectionArgs,
    setPendingSubsectionArgs,
    pendingContentGeneration,
    setPendingContentGeneration,

    // ============ 便利打开函数 ============
    openAddSection,
    openAddTask,
    openAddSubsection,
    openGenerateSubsection,
    openImageGeneration,
    openContentGeneration,
    openTaskGeneration,
    openAddSource,
    openConflictDialog,
    openSubsectionConflictDialog,
    openContentConflictDialog,
    openTemplateDialog,

    // ============ 便利关闭函数 ============
    closeAddSection,
    closeAddTask,
    closeAddSubsection,
    closeGenerateSubsection,
    closeImageGeneration,
    closeContentGeneration,
    closeTaskGeneration,
    closeAddSource,
    closeConflictDialog,
    closeSubsectionConflictDialog,
    closeContentConflictDialog,
    closeTemplateDialog,

    // ============ 批量操作函数 ============
    closeAllDialogs,
    closeConflictDialogs,
    closeGenerationDialogs,
  };
}
