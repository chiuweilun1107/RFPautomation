"use client";

import { useState, useCallback, useMemo } from "react";
import { Section, Task } from "../types";

/**
 * 提案编辑器的核心状态管理 Hook
 * 统一管理：章节、任务、生成进度、实时同步等
 *
 * 将原 ProposalStructureEditor 中的 51 个 useState 聚合为 3 个主要部分
 */
export function useProposalState(initialSections: Section[] = []) {
  // ============ 1. 核心结构数据 ============
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  // ============ 2. UI 状态 ============
  const [loading, setLoading] = useState(false);
  const [sectionViewModes, setSectionViewModes] = useState<Record<string, "tasks" | "content">>({});

  // 内联编辑状态
  const [inlineEditingSectionId, setInlineEditingSectionId] = useState<string | null>(null);
  const [inlineSectionValue, setInlineSectionValue] = useState("");
  const [inlineEditingTaskId, setInlineEditingTaskId] = useState<string | null>(null);
  const [inlineTaskValue, setInlineTaskValue] = useState("");

  // ============ 3. 编辑和选择状态 ============
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetSection, setTargetSection] = useState<Section | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);

  // ============ 4. 源文献管理 ============
  const [sources, setSources] = useState<any[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [linkedSourceIds, setLinkedSourceIds] = useState<string[]>([]);
  const [contentGenerationSourceIds, setContentGenerationSourceIds] = useState<string[]>([]);
  const [subsectionSourceIds, setSubsectionSourceIds] = useState<string[]>([]);

  // ============ 5. 生成和进度 ============
  const [generating, setGenerating] = useState(false);
  const [streamingSections, setStreamingSections] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [generatingTaskId, setGeneratingTaskId] = useState<string | null>(null);
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null);
  const [isGeneratingSubsection, setIsGeneratingSubsection] = useState(false);
  const [integratingSectionId, setIntegratingSectionId] = useState<string | null>(null);

  // ============ 6. 内容管理 ============
  const [taskContents, setTaskContents] = useState<Map<string, any>>(new Map());
  const [openContentPanels, setOpenContentPanels] = useState<
    Map<string, { taskText: string; sectionTitle: string }>
  >(new Map());

  // ============ 7. 分类展开状态 ============
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["tender", "internal", "external"])
  );

  // ============ 8. 引用管理 ============
  const [selectedEvidence, setSelectedEvidence] = useState<any | null>(null);

  // ============ 便利函数 ============

  // 切换章节展开状态
  const toggleSectionExpansion = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // 切换任务展开状态
  const toggleTaskExpansion = useCallback((taskId: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  // 切换分类展开状态
  const toggleCategoryExpansion = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // 开始内联编辑章节
  const startInlineEditSection = useCallback((sectionId: string, currentValue: string) => {
    setInlineEditingSectionId(sectionId);
    setInlineSectionValue(currentValue);
  }, []);

  // 取消内联编辑章节
  const cancelInlineEditSection = useCallback(() => {
    setInlineEditingSectionId(null);
    setInlineSectionValue("");
  }, []);

  // 开始内联编辑任务
  const startInlineEditTask = useCallback((taskId: string, currentValue: string) => {
    setInlineEditingTaskId(taskId);
    setInlineTaskValue(currentValue);
  }, []);

  // 取消内联编辑任务
  const cancelInlineEditTask = useCallback(() => {
    setInlineEditingTaskId(null);
    setInlineTaskValue("");
  }, []);

  // 获取扁平化的章节（用于拖拽）
  const flatSections = useMemo(() => {
    const result: { section: Section; depth: number }[] = [];
    const traverse = (nodes: Section[], depth: number) => {
      for (const node of nodes) {
        result.push({ section: node, depth });
        if (expandedSections.has(node.id)) {
          if (node.children && node.children.length > 0) {
            traverse(node.children, depth + 1);
          }
        }
      }
    };
    traverse(sections, 0);
    return result;
  }, [sections, expandedSections]);

  // 获取所有项目图片
  const allProjectImages = useMemo(() => {
    const images: { id: string; url: string }[] = [];
    const traverse = (nodes: Section[]) => {
      nodes.forEach((node) => {
        node.tasks?.forEach((task) => {
          if (task.task_images && task.task_images.length > 0) {
            task.task_images.forEach((img: any) => {
              if (img.image_url) {
                images.push({
                  id: img.id,
                  url: img.image_url,
                });
              }
            });
          }
        });
        if (node.children) traverse(node.children);
      });
    };
    traverse(sections);
    return images;
  }, [sections]);

  // 重置生成状态
  const resetGenerationState = useCallback(() => {
    setGenerating(false);
    setStreamingSections(new Set());
    setProgress(null);
    setGeneratingTaskId(null);
    setGeneratingSectionId(null);
    setIsGeneratingSubsection(false);
  }, []);

  // 重置所有编辑状态
  const resetEditingState = useCallback(() => {
    setEditingSection(null);
    setEditingTask(null);
    setTargetSection(null);
    setTargetSectionId(null);
    setInlineEditingSectionId(null);
    setInlineEditingTaskId(null);
  }, []);

  // Task Filter State
  const [taskFilter, setTaskFilter] = useState<'all' | 'wf11_functional' | 'wf13_article'>('all');

  return {
    // 状态
    sections,
    expandedSections,
    expandedTaskIds,
    expandedCategories,
    loading,
    sectionViewModes,
    taskFilter,
    setTaskFilter,

    // 编辑状态
    editingSection,
    editingTask,
    targetSection,
    targetSectionId,
    inlineEditingSectionId,
    inlineSectionValue,
    inlineEditingTaskId,
    inlineTaskValue,

    // 源文献
    sources,
    selectedSourceIds,
    linkedSourceIds,
    contentGenerationSourceIds,
    subsectionSourceIds,
    selectedEvidence,

    // 生成进度
    generating,
    streamingSections,
    progress,
    generatingTaskId,
    generatingSectionId,
    isGeneratingSubsection,
    integratingSectionId,

    // 内容
    taskContents,
    openContentPanels,

    // 计算值
    flatSections,
    allProjectImages,

    // 设置函数
    setSections,
    setExpandedSections,
    setExpandedTaskIds,
    setExpandedCategories,
    setLoading,
    setSectionViewModes,
    setEditingSection,
    setEditingTask,
    setTargetSection,
    setTargetSectionId,
    setInlineEditingSectionId,
    setInlineSectionValue,
    setInlineEditingTaskId,
    setInlineTaskValue,
    setSources,
    setSelectedSourceIds,
    setLinkedSourceIds,
    setContentGenerationSourceIds,
    setSubsectionSourceIds,
    setSelectedEvidence,
    setGenerating,
    setStreamingSections,
    setProgress,
    setGeneratingTaskId,
    setGeneratingSectionId,
    setIsGeneratingSubsection,
    setIntegratingSectionId,
    setTaskContents,
    setOpenContentPanels,

    // 便利函数
    toggleSectionExpansion,
    toggleTaskExpansion,
    toggleCategoryExpansion,
    startInlineEditSection,
    cancelInlineEditSection,
    startInlineEditTask,
    cancelInlineEditTask,
    resetGenerationState,
    resetEditingState,
  };
}
