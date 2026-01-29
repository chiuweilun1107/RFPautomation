"use client";

import React, { createContext, useContext, useMemo, useCallback, ReactNode } from "react";
import { Section, Task, TaskContent, Source } from "../types";
import { Evidence } from "../../CitationBadge";

// ============ Context Types ============

/**
 * 展开状态相关
 */
interface ExpansionState {
  expandedSections: Set<string>;
  toggleExpand: (id: string) => void;
  sectionViewModes: Record<string, "tasks" | "content">;
  setSectionViewModes: React.Dispatch<React.SetStateAction<Record<string, "tasks" | "content">>>;
  expandedTaskIds: Set<string>;
  toggleTaskExpansion: (id: string) => void;
}

/**
 * 数据源相关
 */
interface DataSources {
  fullSources: Record<string, Source>;
  sources: Source[];
  taskContents: Map<string, TaskContent>;
}

/**
 * Section 操作回调
 */
interface SectionActions {
  handleIntegrateSection: (section: Section) => void;
  continueAddTask: (section: Section) => void;
  openAddSection: (parentId: string | null) => void;
  openAddSubsection: (section: Section) => void;
  openEditSection: (section: Section) => void;
  handleDeleteSection: (id: string) => void;
  integratingSectionId: string | null;
}

/**
 * Section 内联编辑状态
 */
interface SectionInlineEditState {
  inlineEditingSectionId: string | null;
  inlineSectionValue: string;
  setInlineSectionValue: (val: string) => void;
  startEditingSectionContent: (section: Section) => void;
  saveEditingSectionContent: (id: string) => void;
  cancelEditingSectionContent: () => void;
}

/**
 * Task 内联编辑状态
 */
interface TaskInlineEditState {
  inlineEditingTaskId: string | null;
  inlineTaskValue: string;
  setInlineTaskValue: (val: string) => void;
  saveInlineEdit: () => void;
  cancelInlineEdit: () => void;
  openEditTask: (task: Task) => void;
}

/**
 * Task 操作回调
 */
interface TaskActions {
  handleGenerateTaskContent: (task: Task, section: Section) => void;
  handleGenerateTaskImage: (task: Task, section: Section) => void;
  openContentPanel: (task: Task, title: string) => void;
  handleDeleteTask: (taskId: string) => void;
  handleDeleteImage: (imageId: string, imageUrl: string) => void;
  setSelectedEvidence: (evidence: Evidence) => void;
}

/**
 * 过滤配置
 */
interface FilterConfig {
  taskFilter: "all" | "wf11_functional" | "wf13_article";
}

/**
 * ProposalEditor 完整 Context 类型
 */
export interface ProposalEditorContextType
  extends ExpansionState,
    DataSources,
    SectionActions,
    SectionInlineEditState,
    TaskInlineEditState,
    TaskActions,
    FilterConfig {}

// ============ Context Creation ============

const ProposalEditorContext = createContext<ProposalEditorContextType | null>(null);

// ============ Provider Props ============

export interface ProposalEditorProviderProps {
  children: ReactNode;
  // Expansion State
  expandedSections: Set<string>;
  toggleExpand: (id: string) => void;
  sectionViewModes: Record<string, "tasks" | "content">;
  setSectionViewModes: React.Dispatch<React.SetStateAction<Record<string, "tasks" | "content">>>;
  expandedTaskIds: Set<string>;
  toggleTaskExpansion: (id: string) => void;
  // Data Sources
  fullSources: Record<string, Source>;
  sources: Source[];
  taskContents: Map<string, TaskContent>;
  // Section Actions
  handleIntegrateSection: (section: Section) => void;
  continueAddTask: (section: Section) => void;
  openAddSection: (parentId: string | null) => void;
  openAddSubsection: (section: Section) => void;
  openEditSection: (section: Section) => void;
  handleDeleteSection: (id: string) => void;
  integratingSectionId: string | null;
  // Section Inline Edit
  inlineEditingSectionId: string | null;
  inlineSectionValue: string;
  setInlineSectionValue: (val: string) => void;
  startEditingSectionContent: (section: Section) => void;
  saveEditingSectionContent: (id: string) => void;
  cancelEditingSectionContent: () => void;
  // Task Inline Edit
  inlineEditingTaskId: string | null;
  inlineTaskValue: string;
  setInlineTaskValue: (val: string) => void;
  saveInlineEdit: () => void;
  cancelInlineEdit: () => void;
  openEditTask: (task: Task) => void;
  // Task Actions
  handleGenerateTaskContent: (task: Task, section: Section) => void;
  handleGenerateTaskImage: (task: Task, section: Section) => void;
  openContentPanel: (task: Task, title: string) => void;
  handleDeleteTask: (taskId: string) => void;
  handleDeleteImage: (imageId: string, imageUrl: string) => void;
  setSelectedEvidence: (evidence: Evidence) => void;
  // Filter Config
  taskFilter: "all" | "wf11_functional" | "wf13_article";
}

// ============ Provider Component ============

export function ProposalEditorProvider({
  children,
  // Expansion State
  expandedSections,
  toggleExpand,
  sectionViewModes,
  setSectionViewModes,
  expandedTaskIds,
  toggleTaskExpansion,
  // Data Sources
  fullSources,
  sources,
  taskContents,
  // Section Actions
  handleIntegrateSection,
  continueAddTask,
  openAddSection,
  openAddSubsection,
  openEditSection,
  handleDeleteSection,
  integratingSectionId,
  // Section Inline Edit
  inlineEditingSectionId,
  inlineSectionValue,
  setInlineSectionValue,
  startEditingSectionContent,
  saveEditingSectionContent,
  cancelEditingSectionContent,
  // Task Inline Edit
  inlineEditingTaskId,
  inlineTaskValue,
  setInlineTaskValue,
  saveInlineEdit,
  cancelInlineEdit,
  openEditTask,
  // Task Actions
  handleGenerateTaskContent,
  handleGenerateTaskImage,
  openContentPanel,
  handleDeleteTask,
  handleDeleteImage,
  setSelectedEvidence,
  // Filter Config
  taskFilter,
}: ProposalEditorProviderProps) {
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ProposalEditorContextType>(
    () => ({
      // Expansion State
      expandedSections,
      toggleExpand,
      sectionViewModes,
      setSectionViewModes,
      expandedTaskIds,
      toggleTaskExpansion,
      // Data Sources
      fullSources,
      sources,
      taskContents,
      // Section Actions
      handleIntegrateSection,
      continueAddTask,
      openAddSection,
      openAddSubsection,
      openEditSection,
      handleDeleteSection,
      integratingSectionId,
      // Section Inline Edit
      inlineEditingSectionId,
      inlineSectionValue,
      setInlineSectionValue,
      startEditingSectionContent,
      saveEditingSectionContent,
      cancelEditingSectionContent,
      // Task Inline Edit
      inlineEditingTaskId,
      inlineTaskValue,
      setInlineTaskValue,
      saveInlineEdit,
      cancelInlineEdit,
      openEditTask,
      // Task Actions
      handleGenerateTaskContent,
      handleGenerateTaskImage,
      openContentPanel,
      handleDeleteTask,
      handleDeleteImage,
      setSelectedEvidence,
      // Filter Config
      taskFilter,
    }),
    [
      // Expansion State
      expandedSections,
      toggleExpand,
      sectionViewModes,
      setSectionViewModes,
      expandedTaskIds,
      toggleTaskExpansion,
      // Data Sources
      fullSources,
      sources,
      taskContents,
      // Section Actions
      handleIntegrateSection,
      continueAddTask,
      openAddSection,
      openAddSubsection,
      openEditSection,
      handleDeleteSection,
      integratingSectionId,
      // Section Inline Edit
      inlineEditingSectionId,
      inlineSectionValue,
      setInlineSectionValue,
      startEditingSectionContent,
      saveEditingSectionContent,
      cancelEditingSectionContent,
      // Task Inline Edit
      inlineEditingTaskId,
      inlineTaskValue,
      setInlineTaskValue,
      saveInlineEdit,
      cancelInlineEdit,
      openEditTask,
      // Task Actions
      handleGenerateTaskContent,
      handleGenerateTaskImage,
      openContentPanel,
      handleDeleteTask,
      handleDeleteImage,
      setSelectedEvidence,
      // Filter Config
      taskFilter,
    ]
  );

  return (
    <ProposalEditorContext.Provider value={contextValue}>
      {children}
    </ProposalEditorContext.Provider>
  );
}

// ============ Hook ============

/**
 * Hook to access ProposalEditor context
 * @throws Error if used outside of ProposalEditorProvider
 */
export function useProposalEditor(): ProposalEditorContextType {
  const context = useContext(ProposalEditorContext);
  if (!context) {
    throw new Error("useProposalEditor must be used within a ProposalEditorProvider");
  }
  return context;
}

/**
 * Hook to optionally access ProposalEditor context (returns null if not in provider)
 * Useful for components that can work both with and without context
 */
export function useProposalEditorOptional(): ProposalEditorContextType | null {
  return useContext(ProposalEditorContext);
}

// ============ Selector Hooks (for performance optimization) ============

/**
 * Hook to access only expansion-related state
 */
export function useProposalExpansion(): ExpansionState {
  const context = useProposalEditor();
  return useMemo(
    () => ({
      expandedSections: context.expandedSections,
      toggleExpand: context.toggleExpand,
      sectionViewModes: context.sectionViewModes,
      setSectionViewModes: context.setSectionViewModes,
      expandedTaskIds: context.expandedTaskIds,
      toggleTaskExpansion: context.toggleTaskExpansion,
    }),
    [
      context.expandedSections,
      context.toggleExpand,
      context.sectionViewModes,
      context.setSectionViewModes,
      context.expandedTaskIds,
      context.toggleTaskExpansion,
    ]
  );
}

/**
 * Hook to access only data sources
 */
export function useProposalDataSources(): DataSources {
  const context = useProposalEditor();
  return useMemo(
    () => ({
      fullSources: context.fullSources,
      sources: context.sources,
      taskContents: context.taskContents,
    }),
    [context.fullSources, context.sources, context.taskContents]
  );
}

/**
 * Hook to access only section actions
 */
export function useProposalSectionActions(): SectionActions {
  const context = useProposalEditor();
  return useMemo(
    () => ({
      handleIntegrateSection: context.handleIntegrateSection,
      continueAddTask: context.continueAddTask,
      openAddSection: context.openAddSection,
      openAddSubsection: context.openAddSubsection,
      openEditSection: context.openEditSection,
      handleDeleteSection: context.handleDeleteSection,
      integratingSectionId: context.integratingSectionId,
    }),
    [
      context.handleIntegrateSection,
      context.continueAddTask,
      context.openAddSection,
      context.openAddSubsection,
      context.openEditSection,
      context.handleDeleteSection,
      context.integratingSectionId,
    ]
  );
}

/**
 * Hook to access only task actions
 */
export function useProposalTaskActions(): TaskActions {
  const context = useProposalEditor();
  return useMemo(
    () => ({
      handleGenerateTaskContent: context.handleGenerateTaskContent,
      handleGenerateTaskImage: context.handleGenerateTaskImage,
      openContentPanel: context.openContentPanel,
      handleDeleteTask: context.handleDeleteTask,
      handleDeleteImage: context.handleDeleteImage,
      setSelectedEvidence: context.setSelectedEvidence,
    }),
    [
      context.handleGenerateTaskContent,
      context.handleGenerateTaskImage,
      context.openContentPanel,
      context.handleDeleteTask,
      context.handleDeleteImage,
      context.setSelectedEvidence,
    ]
  );
}

/**
 * Hook to access section inline edit state
 */
export function useProposalSectionInlineEdit(): SectionInlineEditState {
  const context = useProposalEditor();
  return useMemo(
    () => ({
      inlineEditingSectionId: context.inlineEditingSectionId,
      inlineSectionValue: context.inlineSectionValue,
      setInlineSectionValue: context.setInlineSectionValue,
      startEditingSectionContent: context.startEditingSectionContent,
      saveEditingSectionContent: context.saveEditingSectionContent,
      cancelEditingSectionContent: context.cancelEditingSectionContent,
    }),
    [
      context.inlineEditingSectionId,
      context.inlineSectionValue,
      context.setInlineSectionValue,
      context.startEditingSectionContent,
      context.saveEditingSectionContent,
      context.cancelEditingSectionContent,
    ]
  );
}

/**
 * Hook to access task inline edit state
 */
export function useProposalTaskInlineEdit(): TaskInlineEditState {
  const context = useProposalEditor();
  return useMemo(
    () => ({
      inlineEditingTaskId: context.inlineEditingTaskId,
      inlineTaskValue: context.inlineTaskValue,
      setInlineTaskValue: context.setInlineTaskValue,
      saveInlineEdit: context.saveInlineEdit,
      cancelInlineEdit: context.cancelInlineEdit,
      openEditTask: context.openEditTask,
    }),
    [
      context.inlineEditingTaskId,
      context.inlineTaskValue,
      context.setInlineTaskValue,
      context.saveInlineEdit,
      context.cancelInlineEdit,
      context.openEditTask,
    ]
  );
}

/**
 * Hook to access filter config
 */
export function useProposalFilter(): FilterConfig {
  const context = useProposalEditor();
  return useMemo(
    () => ({
      taskFilter: context.taskFilter,
    }),
    [context.taskFilter]
  );
}

// ============ Export ============

export { ProposalEditorContext };
