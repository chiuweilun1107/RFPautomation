"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getErrorMessage } from '@/lib/errorUtils';
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Added Textarea
import { Trash2, Edit2, GripVertical, Check, X, ChevronRight, ChevronDown, FolderPlus, Sparkles, Loader2, FileText, Eye, Cpu, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // Import ToggleGroup

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { TemplateUploadDialog } from "@/components/templates/TemplateUploadDialog";
import { CitationBadge, Evidence } from "./CitationBadge";
import { SourceDetailPanel } from "./SourceDetailPanel";
import { SourceSelectionList } from "./SourceSelectionList";
import { AddSourceDialog } from "./AddSourceDialog";
import { DraggableContentPanel } from "./DraggableContentPanel";
import { ConflictConfirmationDialog } from "@/components/ui/ConflictConfirmationDialog";
import { sourcesApi } from "@/features/sources/api/sourcesApi";
import { AddTaskDialog } from "./dialogs/AddTaskDialog";
import { ContentGenerationDialog } from "./dialogs/ContentGenerationDialog";
import { ImageGenerationDialog, ImageGenerationOptions } from "./dialogs/ImageGenerationDialog";
import { TaskGenerationDialog, TaskGenerationOptions } from "./dialogs/TaskGenerationDialog";
import { GenerateSubsectionDialog } from "./dialogs/GenerateSubsectionDialog";
import { AddSectionDialog } from "./dialogs/AddSectionDialog";
import { AddSubsectionDialog } from "./dialogs/AddSubsectionDialog";
import { SortableNode } from "./structure/SortableNode";
import { SortableTaskItem } from "./structure/SortableTaskItem";
import { Section, Task, TaskImage, TaskContent, Source } from "./types";

import { Label } from "@/components/ui/label";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// ... imports
import { parseChineseNumber } from "./utils";
import { ProposalTreeItem } from "./structure/ProposalTreeItem";
import { useProposalState } from "./proposal-editor/hooks/useProposalState";
import { useProposalOperations as useProposalOpsHook } from "./proposal-editor/hooks/useProposalOperations";
import { useProposalDialogs } from "./proposal-editor/hooks/useProposalDialogs";
import { useSourcesQuery } from "@/hooks/queries/useSourcesQuery";
import { useTemplatesQuery } from "@/hooks/queries/useTemplatesQuery";
import { useProjectsQuery } from "@/hooks/queries/useProjectsQuery";

interface ProposalStructureEditorProps {
    projectId: string;
}




export function ProposalStructureEditor({ projectId }: ProposalStructureEditorProps) {
    const supabase = createClient();

    // 统一状态管理 Hook - 替代 51 个分散的 useState
    const state = useProposalState([]);

    // 快速访问常用状态 (从 useProposalState 提取)
    const {
        // 核心结构
        sections, setSections, loading, setLoading, generating, setGenerating,
        streamingSections, setStreamingSections, progress, setProgress,
        expandedSections, setExpandedSections, expandedCategories, setExpandedCategories,

        // 源文献
        sources, setSources, selectedSourceIds, setSelectedSourceIds,
        linkedSourceIds, setLinkedSourceIds, contentGenerationSourceIds, setContentGenerationSourceIds,
        subsectionSourceIds, setSubsectionSourceIds,

        // 编辑状态
        editingSection, setEditingSection, editingTask, setEditingTask,
        targetSection, setTargetSection, targetSectionId, setTargetSectionId,
        inlineEditingSectionId, setInlineEditingSectionId, inlineSectionValue, setInlineSectionValue,
        inlineEditingTaskId, setInlineEditingTaskId, inlineTaskValue, setInlineTaskValue,

        // 生成进度
        generatingTaskId, setGeneratingTaskId, generatingSectionId, setGeneratingSectionId,
        isGeneratingSubsection, setIsGeneratingSubsection,
        integratingSectionId, setIntegratingSectionId,

        // 内容
        taskContents, setTaskContents, openContentPanels, setOpenContentPanels,
        sectionViewModes, setSectionViewModes, expandedTaskIds, setExpandedTaskIds,

        // 引用
        selectedEvidence, setSelectedEvidence,

        // 篩選器
        taskFilter, setTaskFilter, // From useProposalState (need to add this to hook or just use local state if not shared)

        // 便利函数
        toggleSectionExpansion, toggleTaskExpansion, toggleCategoryExpansion,
        startInlineEditSection, cancelInlineEditSection,
        startInlineEditTask, cancelInlineEditTask,
        resetGenerationState, resetEditingState,
    } = state;

    // 初始化 Dialog 状态管理 Hook
    const dialogState = useProposalDialogs();
    const {
        // Dialog 开关状态
        isAddSectionOpen, setIsAddSectionOpen,
        isAddTaskOpen, setIsAddTaskOpen,
        isAddSubsectionOpen, setIsAddSubsectionOpen,
        isGenerateSubsectionOpen, setIsGenerateSubsectionOpen,
        imageGenDialogOpen, setImageGenDialogOpen,
        isContentGenerationDialogOpen, setIsContentGenerationDialogOpen,
        isTaskGenerationDialogOpen, setIsTaskGenerationDialogOpen,
        isAddSourceDialogOpen, setIsAddSourceDialogOpen,
        isConflictDialogOpen, setIsConflictDialogOpen,
        isSubsectionConflictDialogOpen, setIsSubsectionConflictDialogOpen,
        isContentConflictDialogOpen, setIsContentConflictDialogOpen,
        isTemplateDialogOpen, setIsTemplateDialogOpen,

        // Dialog 输入数据
        dialogInputValue, setDialogInputValue,
        subsectionInputValue, setSubsectionInputValue,

        // Dialog 上下文信息
        taskConflictContext, setTaskConflictContext,
        contentGenerationTarget, setContentGenerationTarget,
        selectedTaskForImage, setSelectedTaskForImage,
        taskGenerationContext, setTaskGenerationContext,
        subsectionTargetSection, setSubsectionTargetSection,
        structureWarningSection, setStructureWarningSection,

        // UI 状态
        showSourceSelector, setShowSourceSelector,

        // 待处理的异步操作数据
        pendingSubsectionArgs, setPendingSubsectionArgs,
        pendingContentGeneration, setPendingContentGeneration,
    } = dialogState;

    // 注意：operations hook 需要 fetchData，所以在 fetchData 定义后初始化

    // ============ Query Hooks - 数据获取和缓存 ============
    // 源文献数据查询（自动缓存 5 分钟）
    const sourcesQueryResult = useSourcesQuery(projectId);
    const { data: querySources, isLoading: sourcesLoading } = sourcesQueryResult;

    // 模板数据查询
    const templatesQueryResult = useTemplatesQuery(projectId);
    const { data: queryTemplates } = templatesQueryResult;

    // 项目数据查询
    const projectsQueryResult = useProjectsQuery();
    const { data: queryProjects } = projectsQueryResult;

    // 当 Query Hook 获取到源文献数据时，更新 state
    useEffect(() => {
        if (querySources && querySources.length > 0) {
            setSources(querySources);
        }
    }, [querySources, setSources]);

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase.channel('realtime-tasks-stream')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'tasks' },
                (payload) => {
                    const newTask = payload.new as Task;
                    setSections(prev => {
                        // Deep clone to safely mutate
                        const newSections = JSON.parse(JSON.stringify(prev));

                        const updateSection = (list: Section[]) => {
                            let found = false;
                            for (const s of list) {
                                if (s.id === newTask.section_id) {
                                    if (!s.tasks) s.tasks = [];
                                    if (!s.tasks.some((t: Task) => t.id === newTask.id)) {
                                        s.tasks.push(newTask);
                                        found = true;
                                        // Visual Feedback
                                        toast("✨ 任務已生成", {
                                            description: newTask.requirement_text.split('\n')[0].substring(0, 30) + "..."
                                        });

                                        // Update Progress
                                        setProgress(prog => {
                                            if (!prog) return null;
                                            return { ...prog, current: prog.current + 1 };
                                        });
                                    }
                                }
                                if (s.children) {
                                    if (updateSection(s.children)) found = true;
                                }
                            }
                            return found;
                        };

                        updateSection(newSections);
                        return newSections;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // 所有状态已迁移到 useProposalState 和 useProposalDialogs hooks
    const fullSources = useMemo(() => {
        const map: Record<string, any> = {};
        sources.forEach((s: any) => {
            // Keep the whole object so SourceDetailPanel has everything (pages, content, summary, etc.)
            map[s.id] = s;
        });
        return map;
    }, [sources]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );





    // Flatten sections for Drag & Drop
    const flatSections = useMemo(() => {
        const result: { section: Section; depth: number }[] = [];
        const traverse = (nodes: Section[], depth: number) => {
            for (const node of nodes) {
                result.push({ section: node, depth });
                if (expandedSections.has(node.id)) {
                    // Check children
                    if (node.children && node.children.length > 0) {
                        traverse(node.children, depth + 1);
                    }
                }
            }
        };
        traverse(sections, 0);
        return result;
    }, [sections, expandedSections]);

    // Aggregate all project images for the gallery
    const [allProjectImages, setAllProjectImages] = useState<TaskImage[]>([]);

    // Initial Fetch & Realtime Subscription
    useEffect(() => {
        fetchData();

        // Subscribe to changes in sections and tasks
        const channel = supabase.channel(`proposal-structure-${projectId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'sections',
                    filter: `project_id=eq.${projectId}`
                },
                () => {
                    fetchData(); // Simplest approach: re-fetch everything on any section change
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: `project_id=eq.${projectId}`
                },
                () => {
                    fetchData();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'project_sources',
                    filter: `project_id=eq.${projectId}`
                },
                () => {
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Fetch Sections
            const { data: sectionsData, error: sectionsError } = await supabase
                .from('sections')
                .select('*')
                .eq('project_id', projectId)
                .order('order_index');

            if (sectionsError) throw sectionsError;

            // 2. Fetch Tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .eq('project_id', projectId)
                .order('order_index', { ascending: true });

            if (tasksError) throw tasksError;

            // 2.5 Fetch Task Images (Project-wide / All Orphans)
            // SHOW ALL IMAGES: To support orphaned images (where task/project link is lost),
            // we temporarily fetch all images. Ideally we filter by project_id, but for recovery purposes we show all.
            const { data: imagesData, error: imagesError } = await supabase
                .from('task_images')
                .select('*')
                // .eq('project_id', projectId) // Removed to show orphans
                .order('created_at', { ascending: false });

            if (imagesError) {
                console.warn("Error fetching task images:", imagesError);
            } else {
                setAllProjectImages(imagesData || []);
            }

            // Map images to tasks
            const imagesByTask = new Map<string, any[]>();
            if (imagesData || allProjectImages.length > 0) {
                (imagesData || allProjectImages).forEach((img: any) => {
                    const tId = img.task_id;
                    if (!imagesByTask.has(tId)) imagesByTask.set(tId, []);
                    imagesByTask.get(tId)?.push(img);
                });
            }

            // Merge images into tasks
            const mergedTasks = tasksData?.map((t: any) => ({
                ...t,
                task_images: imagesByTask.get(t.id) || []
            }));

            // 3. Fetch All Relevant Sources (Linked or Project-specific)
            const { data: sourcesData, error: sourcesError } = await supabase
                .from('sources')
                .select('*')
                .or(`project_id.is.null,project_id.eq.${projectId}`)
                .order('created_at', { ascending: false });

            if (sourcesError) console.error("Error fetching sources:", sourcesError);

            if (sourcesData) {
                setSources(sourcesData);
            }

            // 4. Fetch Linked Source IDs (what's checked in Sidebar)
            const { data: linkedSources, error: linkedError } = await supabase
                .from('project_sources')
                .select('source_id')
                .eq('project_id', projectId);

            if (linkedError) console.error("Error fetching linked sources:", linkedError);
            if (linkedSources) {
                setLinkedSourceIds(linkedSources.map(ls => ls.source_id));
            }

            // 5. Build Tree
            const sectionMap = new Map<string, Section>();
            const roots: Section[] = [];

            // Initialize map with tasks

            sectionsData?.forEach(s => {
                const sectionTasks = mergedTasks?.filter((t: any) => t.section_id === s.id) || [];
                sectionMap.set(s.id, {
                    ...s,
                    children: [],
                    tasks: sectionTasks
                });
            });

            // Build hierarchy
            sectionsData?.forEach(s => {
                const node = sectionMap.get(s.id)!;
                if (s.parent_id && sectionMap.has(s.parent_id)) {
                    sectionMap.get(s.parent_id)!.children?.push(node);
                } else {
                    roots.push(node);
                }
            });

            setSections(roots);
            // Default expand roots
            setExpandedSections(new Set(roots.map(r => r.id)));

        } catch (error) {
            console.error('Error fetching structure:', error);
            toast.error("Failed to load proposal structure");
        } finally {
            setLoading(false);
        }
    }, [projectId, supabase]);

    // 初始化业务操作 Hook (需要在 fetchData 定义后)
    const operations = useProposalOpsHook(projectId, sections, setSections, fetchData);

    const handleGenerateClick = useCallback(() => {
        if (sections.length > 0) {
            setIsConflictDialogOpen(true);
        } else {
            executeGeneration('append');
        }
    }, [sections.length]);

    const executeGeneration = useCallback(async (action: 'replace' | 'append') => {
        setIsConflictDialogOpen(false);
        try {
            setGenerating(true);

            // 1. Handle "Replace" mode -> Delete existing data first
            if (action === 'replace') {
                const { error: deleteError } = await supabase
                    .from('sections')
                    .delete()
                    .eq('project_id', projectId);

                if (deleteError) throw deleteError;
                // Optional: Clear local state immediately for visual feedback
                setSections([]);
            }

            // 2. Call n8n Webhook: Just Generate (It will append/insert new items)
            const res = await fetch('/api/webhook/generate-structure-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, action: 'append' }) // Always send 'append' or ignore action in backend
            });

            if (!res.ok) {
                const err = await res.json();
                if (res.status === 422 && err.error === 'MISSING_DATA') {
                    // Trigger Template Dialog
                    setIsTemplateDialogOpen(true);
                    return;
                }
                throw new Error(err.error || 'Generation failed');
            }

            const data = await res.json();
            toast.success(data.message);
            fetchData(); // Refresh tree
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setGenerating(false);
        }
    }, [projectId, supabase, fetchData]);

    // --- Task Generation Logic ---
    const handleSingleAutoGenerate = async (workflowType: 'technical' | 'management' = 'technical') => {
        if (selectedSourceIds.length === 0) return;
        if (!targetSection) return;

        // Check for existing tasks in target section
        const hasExistingTasks = targetSection.tasks && targetSection.tasks.length > 0;

        if (hasExistingTasks) {
            setTaskConflictContext({
                type: 'single',
                targetSection,
                sourceIds: selectedSourceIds,
                userDesc: dialogInputValue,
                workflowType
            });
            return;
        }

        // Use appropriate WF for task generation
        if (workflowType === 'management') {
            await executeTaskGeneration(selectedSourceIds, targetSection, 'management');
        } else {
            await executeTaskGeneration(selectedSourceIds, targetSection, 'technical');
        }
    };

    const confirmTaskConflict = async (mode: 'append' | 'replace') => {
        if (!taskConflictContext) return;

        const { sourceIds, userDesc, targetSection, workflowType } = taskConflictContext;
        setTaskConflictContext(null); // Close dialog

        await executeSingleGeneration(mode, sourceIds, userDesc || "", targetSection || null, workflowType);
    };


    const executeSingleGeneration = async (mode: 'append' | 'replace', sourceIds: string[], userDesc: string, targetSection: Section | null, workflowType: 'technical' | 'management' = 'technical') => {
        setGenerating(true);
        // Start Streaming Visuals
        if (targetSection) {
            const sId = targetSection.id;
            setStreamingSections(prev => new Set(prev).add(sId));
            // Auto stop streaming after 5 minutes (safety timeout)
            setTimeout(() => {
                setStreamingSections(prev => {
                    const next = new Set(prev);
                    next.delete(sId);
                    return next;
                });
            }, 300000);
        }

        try {
            if (mode === 'replace' && targetSection) {
                await supabase.from('tasks').delete().eq('section_id', targetSection.id);
            }

            // Gather all section titles flattened (including sub-sections) for context
            const getFlattenedTitles = (nodes: Section[]): string[] => {
                let titles: string[] = [];
                nodes.forEach(node => {
                    titles.push(node.title);
                    if (node.children && node.children.length > 0) {
                        titles = [...titles, ...getFlattenedTitles(node.children)];
                    }
                });
                return titles;
            };
            const allFlattenedTitles = getFlattenedTitles(sections);

            const endpoint = workflowType === 'management' ? '/api/webhook/generate-tasks-management' : '/api/webhook/generate-tasks-advanced';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    sectionId: targetSection?.id,
                    sectionTitle: targetSection?.title || 'Unknown Section',
                    sourceIds,
                    userDescription: userDesc,
                    allSections: allFlattenedTitles // Pass ALL flattened titles (including sub-chapters)
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Webhook error response:', errorText);
                throw new Error(`Generation failed: ${response.status} ${response.statusText}`);
            }

            // Check if response has content
            const responseText = await response.text();
            if (!responseText || responseText.trim() === '') {
                console.error('Empty response from webhook');
                throw new Error('Empty response from server');
            }

            // Try to parse JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response:', responseText);
                throw new Error('Invalid JSON response from server');
            }

            if (data.result === 'success' || data.message) {
                toast.success(data.message || "Tasks generated!");

                // Set Progress Total if available
                if (data.total_modules) {
                    setProgress({ current: 0, total: data.total_modules }); // +2 for Arch/Flow tasks
                } else {
                    setProgress({ current: 0, total: 5 }); // Default heuristic
                }

                setIsAddTaskOpen(false);
                fetchData();
            } else if (data.result && typeof data.result === 'string') {
                setDialogInputValue(prev => mode === 'replace' ? data.result : (prev ? prev + "\n\n" + data.result : data.result));
                toast.success("Tasks generated (Draft)");
            }
        } catch (error) {
            console.error("Auto-generate error:", error);
            toast.error("Failed to generate requirements.");
        } finally {
            setGenerating(false);
        }
    };

    // ===== NEW: Subsection Generation (WF10) =====
    const handleSubsectionGenerationRequest = async (sourceIds: string[], targetSection: Section) => {
        // Check for existing children
        if (targetSection.children && targetSection.children.length > 0) {
            setPendingSubsectionArgs({ sourceIds, targetSection });
            setIsSubsectionConflictDialogOpen(true);
            return;
        }

        // No conflict, proceed directly
        await executeSubsectionGeneration(sourceIds, targetSection, 'append');
    };

    const confirmSubsectionGeneration = async (mode: 'replace' | 'append') => {
        if (!pendingSubsectionArgs) return;
        const { sourceIds, targetSection } = pendingSubsectionArgs;
        setIsSubsectionConflictDialogOpen(false);
        await executeSubsectionGeneration(sourceIds, targetSection, mode);
        setPendingSubsectionArgs(null);
    };

    const autoSortChildren = async (parentId: string) => {
        try {
            const { data } = await supabase.from('sections').select('*').eq('parent_id', parentId);
            if (!data || data.length === 0) return;

            const sorted = [...data].sort((a, b) => {
                const numA = parseChineseNumber(a.title);
                const numB = parseChineseNumber(b.title);
                if (numA !== Infinity && numB !== Infinity) return numA - numB;
                if (numA !== Infinity) return -1;
                if (numB !== Infinity) return 1;
                return a.order_index - b.order_index;
            });

            // Check if order changed
            const needsUpdate = sorted.some((item, index) => item.order_index !== index + 1);
            if (!needsUpdate) return;

            const updates = sorted.map((item, index) => ({
                id: item.id,
                project_id: projectId,
                title: item.title,
                parent_id: item.parent_id,
                order_index: index + 1
            }));

            await updateOrder(updates);
        } catch (e) {
            console.error("Auto-sort failed:", e);
        }
    };


    const executeSubsectionGeneration = async (sourceIds: string[], targetSection: Section, mode: 'replace' | 'append') => {
        setIsGeneratingSubsection(true);
        try {
            // Handle Replace Mode: Delete children first
            if (mode === 'replace') {
                const { error: deleteError } = await supabase
                    .from('sections')
                    .delete()
                    .eq('parent_id', targetSection.id);

                if (deleteError) throw deleteError;
                // Wait a bit for propagation if needed, or rely on fetch
                await new Promise(r => setTimeout(r, 200));
            }

            // Gather all parent section titles (for context to avoid duplicates)
            const allParentSections = sections.map(s => s.title);

            const response = await fetch('/webhook/generate-requirements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    sectionId: targetSection.id,
                    sectionTitle: targetSection.title,
                    sourceIds,
                    userDescription: '',
                    allParentSections
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Subsection generation error:', errorText);
                throw new Error(`Generation failed: ${response.status}`);
            }

            toast.success("子章節生成成功！");
            setIsGenerateSubsectionOpen(false);

            // Auto-sort the children by Chinese numerals
            await autoSortChildren(targetSection.id);

            fetchData();
        } catch (error) {
            console.error("Subsection generation error:", error);
            toast.error("子章節生成失敗");
        } finally {
            setIsGeneratingSubsection(false);
        }
    };

    // ===== NEW: Task Generation (WF11) =====
    // Step 1: Open dialog with context
    const executeTaskGeneration = async (sourceIds: string[], targetSection: Section, workflowType: 'technical' | 'management' = 'technical') => {
        // Save context and open dialog
        setTaskGenerationContext({
            sourceIds,
            targetSection,
            workflowType
        });
        setIsTaskGenerationDialogOpen(true);
    };

    // Step 2: Confirm and execute generation with user options
    const confirmTaskGeneration = async (options: TaskGenerationOptions) => {
        if (!taskGenerationContext) return;

        const { sourceIds, targetSection, workflowType } = taskGenerationContext;

        setGenerating(true);
        try {
            // Gather all parent section titles (for context to avoid duplicates)
            const allParentSections = sections.map(s => s.title);

            const endpoint = workflowType === 'management' ? '/api/webhook/generate-tasks-management' : '/api/webhook/generate-tasks-advanced';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    sectionId: targetSection.id,
                    sectionTitle: targetSection.title,
                    sourceIds,
                    userDescription: options.userDescription || '',
                    projectType: options.projectType, // Pass user-selected project type (or undefined for AI auto-detect)
                    allSections: allParentSections // Pass context
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Task generation error:', errorText);
                throw new Error(`Generation failed: ${response.status}`);
            }

            // Parse response safely
            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse JSON:", text);
                throw new Error("Invalid response from server");
            }

            if (result.errorMessage || result.error || result.result === 'error') {
                console.error('Workflow error:', result);
                throw new Error(result.errorMessage || result.error || 'Workflow execution failed');
            }

            toast.success("任務生成成功！");
            setIsAddTaskOpen(false);
            setIsTaskGenerationDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error("Task generation error:", error);
            toast.error("任務生成失敗");
        } finally {
            setGenerating(false);
        }
    };

    // ===== Content Generation (WF12) =====
    const fetchTaskContents = async () => {
        try {
            // Get all task IDs from current sections
            const taskIds: string[] = [];
            const collectTaskIds = (nodes: Section[]) => {
                nodes.forEach(section => {
                    section.tasks?.forEach(task => taskIds.push(task.id));
                    if (section.children) collectTaskIds(section.children);
                });
            };
            collectTaskIds(sections);

            if (taskIds.length === 0) return;

            const { data, error } = await supabase
                .from('task_contents')
                .select('*')
                .in('task_id', taskIds)
                .order('version', { ascending: false });

            if (error) throw error;

            // Keep only latest version per task
            const contentsMap = new Map<string, TaskContent>();
            data?.forEach((tc: TaskContent) => {
                if (!contentsMap.has(tc.task_id)) {
                    contentsMap.set(tc.task_id, tc);
                }
            });
            setTaskContents(contentsMap);
        } catch (error) {
            console.error('Error fetching task contents:', error);
        }
    };

    // --- Chapter Integration Logic ---
    // --- Chapter Integration Logic ---
    const handleIntegrateSection = async (section: Section) => {
        setIntegratingSectionId(section.id);
        const tasks = section.tasks || [];
        if (tasks.length === 0) {
            toast.error("此章節無任務可供整合");
            setIntegratingSectionId(null);
            return;
        }

        const taskContentPayload: { title: string; content: string }[] = [];
        tasks.forEach(task => {
            const content = taskContents.get(task.id);
            if (content && content.content) {
                taskContentPayload.push({
                    title: task.requirement_text,
                    content: content.content
                });
            }
        });

        if (taskContentPayload.length === 0) {
            toast.error("找不到已生成的任務內容，請先為任務生成內容");
            setIntegratingSectionId(null);
            return;
        }

        try {
            toast.info(`正在整合 ${taskContentPayload.length} 篇任務內容...`);

            // 1. Call Integration Workflow (WF14)
            const response = await fetch('/api/webhook/integrate-chapter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    sectionId: section.id,
                    sectionTitle: section.title,
                    contents: taskContentPayload
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const msg = errorData.error || response.statusText || "整合請求失敗";
                console.error("[Integration] API Error:", msg);
                throw new Error(msg);
            }

            const data = await response.json();
            const resultText = data.integratedContent || data.content;

            if (!resultText) {
                console.warn("[Integration] No content returned:", data);
                throw new Error(`API未返回整合內容 (key: integratedContent/content missing). Data: ${JSON.stringify(data)}`);
            }

            // 2. Auto-save to Database
            const { error: dbError } = await supabase
                .from('sections')
                .update({
                    content: resultText,
                    last_integrated_at: new Date().toISOString()
                })
                .eq('id', section.id);

            if (dbError) {
                console.error("[Integration] DB Error:", dbError);
                throw new Error(`儲存資料庫失敗: ${dbError.message} (Code: ${dbError.code})`);
            }

            toast.success("整合成功且已儲存！");

            // 3. Update UI
            setSectionViewModes(prev => ({ ...prev, [section.id]: 'content' }));
            if (!expandedSections.has(section.id)) {
                setExpandedSections(prev => new Set(prev).add(section.id));
            }
            fetchData();

        } catch (error) {
            console.error("Integration failed full:", error);
            const msg = error instanceof Error ? getErrorMessage(error) : JSON.stringify(error);
            toast.error("整合失敗: " + msg);
        } finally {
            setIntegratingSectionId(null);
        }
    };

    const startEditingSectionContent = useCallback((section: Section) => {
        setInlineEditingSectionId(section.id);
        setInlineSectionValue(section.content || "");
    }, []);

    const cancelEditingSectionContent = useCallback(() => {
        setInlineEditingSectionId(null);
        setInlineSectionValue("");
    }, []);

    const saveEditingSectionContent = useCallback(async (sectionId: string) => {
        try {
            const { error } = await supabase
                .from('sections')
                .update({ content: inlineSectionValue })
                .eq('id', sectionId);

            if (error) throw error;
            toast.success("內文已更新");

            // Local update
            setSections(prev => {
                const updateNode = (nodes: Section[]): Section[] => {
                    return nodes.map(node => {
                        if (node.id === sectionId) {
                            return { ...node, content: inlineSectionValue };
                        }
                        if (node.children) {
                            return { ...node, children: updateNode(node.children) };
                        }
                        return node;
                    });
                };
                return updateNode(prev);
            });

            setInlineEditingSectionId(null);
        } catch (error) {
            console.error("Error saving section content:", error);
            toast.error("儲存失敗: " + getErrorMessage(error));
        }
    }, [inlineSectionValue, supabase]);

    // Generate content for a single task
    const handleGenerateTaskContent = useCallback((task: Task, section: Section) => {
        // Check if content already exists
        const existingContent = taskContents.get(task.id);

        if (existingContent && existingContent.content) {
            // Content exists, show confirmation dialog
            setPendingContentGeneration({ task, section });
            setContentGenerationSourceIds(linkedSourceIds);
            setIsContentConflictDialogOpen(true);
        } else {
            // No content, proceed directly
            setContentGenerationTarget({ task, section });
            setContentGenerationSourceIds(linkedSourceIds);
            setIsContentGenerationDialogOpen(true);
        }
    }, [taskContents, linkedSourceIds]);

    const confirmContentReplacement = (mode: 'append' | 'replace') => {
        if (!pendingContentGeneration) return;

        const { task, section } = pendingContentGeneration;
        setIsContentConflictDialogOpen(false);
        setPendingContentGeneration(null);

        // Continue with original flow
        setContentGenerationTarget({ task, section });
        setIsContentGenerationDialogOpen(true);

        // TODO: If mode === 'replace', we'll need to implement delete logic in WF12
        // For now, both modes will create new versions
    };

    const confirmGenerateTaskContent = async () => {
        if (!contentGenerationTarget) return;
        const { task, section } = contentGenerationTarget;

        setIsContentGenerationDialogOpen(false);
        setGeneratingTaskId(task.id);

        // Gather context
        const getFlattenedTitles = (nodes: Section[]): string[] => {
            let titles: string[] = [];
            nodes.forEach(node => {
                titles.push(node.title);
                if (node.children && node.children.length > 0) {
                    titles = [...titles, ...getFlattenedTitles(node.children)];
                }
            });
            return titles;
        };
        const allFlattenedTitles = getFlattenedTitles(sections);

        try {
            const response = await fetch('/api/webhook/generate-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'task',
                    projectId,
                    sectionId: section.id,
                    sectionTitle: section.title,
                    taskId: task.id,
                    taskText: task.requirement_text,
                    selectedSourceIds: contentGenerationSourceIds,
                    citationSourceId: task.citation_source_id,
                    citationPage: task.citation_page,
                    allSections: allFlattenedTitles
                })
            });

            if (!response.ok) {
                throw new Error(`Generation failed: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                toast.success(`內容生成成功！(${result.wordCount || 0}字)`);
                // Refresh task contents
                await fetchTaskContents();
                // Auto-open floating panel
                openContentPanel(task, section.title);
            }
        } catch (error) {
            console.error('Content generation error:', error);
            toast.error('內容生成失敗');
        } finally {
            setGeneratingTaskId(null);
            setContentGenerationTarget(null);
        }
    };

    // Generate content for all tasks in a section
    const handleGenerateSectionContent = async (section: Section) => {
        if (!section.tasks || section.tasks.length === 0) {
            toast.error('此章節沒有任務');
            return;
        }

        setGeneratingSectionId(section.id);

        // Gather context
        const getFlattenedTitles = (nodes: Section[]): string[] => {
            let titles: string[] = [];
            nodes.forEach(node => {
                titles.push(node.title);
                if (node.children && node.children.length > 0) {
                    titles = [...titles, ...getFlattenedTitles(node.children)];
                }
            });
            return titles;
        };
        const allFlattenedTitles = getFlattenedTitles(sections);

        try {
            const sourceIds = sources.map((s: Source) => s.id);

            const response = await fetch('/api/webhook/generate-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'section',
                    projectId,
                    sectionId: section.id,
                    sectionTitle: section.title,
                    tasks: section.tasks.map(t => ({
                        id: t.id,
                        requirement_text: t.requirement_text,
                        citations: t.citations || []
                    })),
                    selectedSourceIds: sourceIds,
                    allSections: allFlattenedTitles
                })
            });

            if (!response.ok) {
                throw new Error(`Generation failed: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                toast.success(`章節內容生成成功！(${result.wordCount || 0}字)`);
                // For section mode, we display the content in a dialog or somewhere
                // For now, just show success
            }
        } catch (error) {
            console.error('Section content generation error:', error);
            toast.error('章節內容生成失敗');
        } finally {
            setGeneratingSectionId(null);
        }
    };

    // Open content in floating panel
    const openContentPanel = useCallback((task: Task, sectionTitle: string) => {
        setOpenContentPanels(prev => {
            const newMap = new Map(prev);
            newMap.set(task.id, { taskText: task.requirement_text, sectionTitle });
            return newMap;
        });
    }, []);

    // Close floating panel
    const closeContentPanel = useCallback((taskId: string) => {
        setOpenContentPanels(prev => {
            const newMap = new Map(prev);
            newMap.delete(taskId);
            return newMap;
        });
    }, []);

    // Fetch task contents when sections change
    useEffect(() => {
        if (sections.length > 0) {
            fetchTaskContents();
        }
    }, [sections]);

    // ===== NEW: Manual Subsection Add =====
    const handleAddSubsection = async () => {
        if (!subsectionInputValue.trim() || !subsectionTargetSection) return;

        try {
            const newOrder = (subsectionTargetSection.children?.length || 0) + 1;
            const { error } = await supabase
                .from('sections')
                .insert({
                    project_id: projectId,
                    title: subsectionInputValue,
                    order_index: newOrder,
                    parent_id: subsectionTargetSection.id
                });

            if (error) throw error;

            toast.success("子章節新增成功");
            setSubsectionInputValue("");
            setIsAddSubsectionOpen(false);
            fetchData();
        } catch (error) {
            toast.error("新增子章節失敗");
            console.error(error);
        }
    };

    // ===== Image Generation Logic (WF15) =====
    const handleGenerateTaskImage = useCallback((task: Task, section: Section) => {
        setSelectedTaskForImage(task);
        setImageGenDialogOpen(true);
    }, []);

    const executeImageGeneration = async (options: ImageGenerationOptions) => {
        if (!selectedTaskForImage) return;
        const { type, customPrompt, referenceImage } = options;

        try {
            // Call local API route which proxies to n8n
            const response = await fetch('/api/webhook/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    task_id: selectedTaskForImage.id,
                    project_id: projectId,
                    task_content: selectedTaskForImage.requirement_text,
                    image_type: type,
                    custom_prompt: customPrompt,
                    reference_image: referenceImage
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Image generation API error:", errorData);
                throw new Error(errorData.error || `Image generation failed: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.image_url) {
                await fetchTaskContents(); // Refresh in case we show images in content later
                toast.success("圖片生成成功！");
            }
        } catch (error) {
            console.error("Error generating image:", error);
            toast.error(getErrorMessage(error) || "圖片生成失敗，請稍後再試。");
        }
    };

    const handleUploadImage = async (file: File, taskId: string) => {
        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${taskId}_${Date.now()}_custom.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('task-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('task-images')
                .getPublicUrl(fileName);

            // 3. Insert into task_images
            const { data: insertData, error: insertError } = await supabase
                .from('task_images')
                .insert({
                    project_id: projectId,
                    task_id: taskId,
                    image_type: 'custom',
                    prompt: 'User uploaded reference',
                    image_url: publicUrl,
                    caption: '使用者上傳參考圖'
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // 4. Update local state
            setAllProjectImages(prev => [insertData, ...prev]);

            return publicUrl;
        } catch (error) {
            console.error("Failed to upload image:", error);
            toast.error("圖片上傳失敗");
            throw error;
        }
    };

    const handleDeleteImage = useCallback(async (imageId: string, imageUrl: string) => {
        if (!confirm('確定要刪除這張圖片嗎？')) return;

        try {
            // 1. Delete from DB
            const { error: dbError } = await supabase
                .from('task_images')
                .delete()
                .eq('id', imageId);

            if (dbError) throw dbError;

            // 2. Delete from Storage
            const fileName = imageUrl.split('/').pop();
            if (fileName) {
                const { error: storageError } = await supabase
                    .storage
                    .from('task-images')
                    .remove([fileName]);

                if (storageError) console.error('Error deleting from storage:', storageError);
            }

            toast.success('圖片已刪除');
            // Manual refresh - using fetchData to reload all data including images
            fetchData();
        } catch (error) {
            console.error('Error deleting image:', error);
            toast.error('刪除圖片失敗');
        }
    }, [supabase, fetchData]);

    // --- Section Actions ---

    const handleAddSection = useCallback(async () => {
        if (!dialogInputValue.trim()) return;

        try {
            const newOrder = sections.length + 1; // Simplified ordering
            const { data, error } = await supabase
                .from('sections')
                .insert({
                    project_id: projectId,
                    title: dialogInputValue,
                    order_index: newOrder,
                    parent_id: targetSectionId // null for root, or sectionId for sub
                })
                .select()
                .single();

            if (error) throw error;

            toast.success("Section added");
            setDialogInputValue("");
            setIsAddSectionOpen(false);
            fetchData(); // Refresh tree
        } catch (error) {
            toast.error("Failed to add section");
        }
    }, [dialogInputValue, sections.length, projectId, targetSectionId, supabase, fetchData]);

    const handleUpdateSection = useCallback(async () => {
        if (!editingSection || !dialogInputValue.trim()) return;

        try {
            const { error } = await supabase
                .from('sections')
                .update({ title: dialogInputValue })
                .eq('id', editingSection.id);

            if (error) throw error;

            toast.success("Section updated");
            setDialogInputValue("");
            setEditingSection(null);
            fetchData();
        } catch (error) {
            toast.error("Failed to update section");
        }
    }, [editingSection, dialogInputValue, supabase, fetchData]);

    const handleDeleteSection = useCallback(async (id: string) => {
        if (!confirm("Are you sure? This will delete all sub-sections and tasks.")) return;

        try {
            const { error } = await supabase
                .from('sections')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success("Section deleted");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete section");
        }
    }, [supabase, fetchData]);

    // --- Task Actions ---

    const handleAddTask = useCallback(async () => {
        if (!dialogInputValue.trim() || !targetSection) return;

        try {
            const { error } = await supabase
                .from('tasks')
                .insert({
                    project_id: projectId,
                    section_id: targetSection.id,
                    requirement_text: dialogInputValue,
                    status: 'pending' // Default status
                });

            if (error) throw error;

            toast.success("Task added");
            setDialogInputValue("");
            setIsAddTaskOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to add task");
        }
    }, [dialogInputValue, targetSection, projectId, supabase, fetchData]);

    const handleDeleteTask = useCallback(async (id: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;

        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success("Task deleted");

            // Update local state directly to avoid page refresh
            setSections(prev => {
                const removeTaskRecursive = (sections: Section[]): Section[] => {
                    return sections.map(section => ({
                        ...section,
                        tasks: section.tasks ? section.tasks.filter(t => t.id !== id) : [],
                        children: section.children ? removeTaskRecursive(section.children) : []
                    }));
                };
                return removeTaskRecursive(prev);
            });
        } catch (error) {
            toast.error("Failed to delete task");
        }
    }, [supabase]);

    const handleUpdateTask = async () => {
        if (!editingTask || !dialogInputValue.trim()) return;

        try {
            const { error } = await supabase
                .from('tasks')
                .update({ requirement_text: dialogInputValue })
                .eq('id', editingTask.id);

            if (error) throw error;

            toast.success("Task updated");
            setDialogInputValue("");
            setEditingTask(null);
            setIsAddTaskOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to update task");
        }
    };

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;
        if (active.id === over.id) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // --- TASK DRAGGING ---
        if (activeData?.type === 'task') {
            const activeTaskId = active.id as string;
            const sourceSectionId = activeData.sectionId as string;

            // Determine target section
            let targetSectionId: string;
            let targetTaskId: string | null = null;

            if (overData?.type === 'task') {
                // Dropped on another task
                targetSectionId = overData.sectionId as string;
                targetTaskId = over.id as string;
            } else if (overData?.type === 'section') {
                // Dropped on a section header
                targetSectionId = over.id as string;
            } else if (overData?.type === 'empty-section') {
                // Dropped on empty section placeholder
                targetSectionId = overData.sectionId as string;
            } else {
                // Fallback: same section
                targetSectionId = sourceSectionId;
            }

            // Find source and target sections
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
            const activeTaskIndex = sourceTasks.findIndex(t => t.id === activeTaskId);
            if (activeTaskIndex === -1) return;

            const [movedTask] = sourceTasks.splice(activeTaskIndex, 1);

            let targetTasks: Task[];
            let insertIndex: number;

            if (sourceSectionId === targetSectionId) {
                // Same section reorder
                targetTasks = sourceTasks;
                if (targetTaskId) {
                    insertIndex = targetTasks.findIndex(t => t.id === targetTaskId);
                    if (insertIndex === -1) insertIndex = targetTasks.length;
                } else {
                    insertIndex = targetTasks.length;
                }
            } else {
                // Cross-section move
                targetTasks = [...(targetSection.tasks || [])];
                if (targetTaskId) {
                    insertIndex = targetTasks.findIndex(t => t.id === targetTaskId);
                    if (insertIndex === -1) insertIndex = targetTasks.length;
                } else {
                    insertIndex = targetTasks.length;
                }
            }

            // Insert task at new position
            const taskToInsert = { ...movedTask, section_id: targetSectionId };
            targetTasks.splice(insertIndex, 0, taskToInsert);

            // Recalculate order_index for the inserted task
            const prevTask = targetTasks[insertIndex - 1];
            const nextTask = targetTasks[insertIndex + 1];

            // Default spacing is 1000. If no prev, use next-1000 or 0. If no next, use prev+1000.
            const prevOrder = prevTask?.order_index ?? (nextTask?.order_index ? nextTask.order_index - 1000 : 0);
            const nextOrder = nextTask?.order_index ?? (prevOrder + 1000);

            const newOrderIndex = (prevOrder + nextOrder) / 2;
            taskToInsert.order_index = newOrderIndex;

            // Optimistic UI update
            setSections(prev => {
                const updateSections = (nodes: Section[]): Section[] => {
                    return nodes.map(node => {
                        const updatedNode = { ...node };
                        if (node.id === sourceSectionId && sourceSectionId !== targetSectionId) {
                            updatedNode.tasks = sourceTasks;
                        }
                        if (node.id === targetSectionId) {
                            updatedNode.tasks = targetTasks;
                        }
                        if (node.id === sourceSectionId && sourceSectionId === targetSectionId) {
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

            // Server update
            updateTaskOrder([{
                id: taskToInsert.id,
                section_id: targetSectionId,
                order_index: newOrderIndex
            }]);

            // No need to re-index others unless collision, but floating point helps avoid collision for a long time.

            return;
        }

        // --- SECTION DRAGGING (existing logic) ---
        // Recursive Helper: Find parent info
        const getParentInfo = (nodes: Section[], targetId: string): { parent: Section | null, list: Section[] } | null => {
            const findDeep = (list: Section[], parent: Section | null): { parent: Section | null, list: Section[] } | null => {
                if (list.some(n => n.id === targetId)) return { parent, list };

                for (const node of list) {
                    if (node.children) {
                        const found = findDeep(node.children, node);
                        if (found) return found;
                    }
                }
                return null;
            };
            return findDeep(nodes, null);
        };

        const activeInfo = getParentInfo(sections, active.id as string);
        const overInfo = getParentInfo(sections, over.id as string);

        if (!activeInfo || !overInfo) return;

        // Strict Requirement: Parent must be the same
        if (activeInfo.parent?.id !== overInfo.parent?.id) {
            return; // Deny cross-parent drop
        }

        const list = activeInfo.list;
        const oldIndex = list.findIndex(item => item.id === active.id);
        const newIndex = list.findIndex(item => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const newList = arrayMove(list, oldIndex, newIndex);

        // Optimistic UI Update
        const updateTree = (nodes: Section[]): Section[] => {
            // If we are updating roots
            if (activeInfo.parent === null) return newList;

            return nodes.map(node => {
                if (node.id === activeInfo.parent!.id) {
                    return { ...node, children: newList };
                }
                if (node.children) {
                    return { ...node, children: updateTree(node.children) };
                }
                return node;
            });
        };

        setSections(updateTree(sections));

        // Server Update
        const updates = newList.map((item, index) => ({
            id: item.id,
            title: item.title,
            project_id: projectId,
            order_index: index + 1,
            parent_id: activeInfo.parent ? activeInfo.parent.id : null
        }));

        updateOrder(updates);

    }, [sections, projectId, supabase]);

    const updateTaskOrder = async (updates: { id: string; section_id?: string; order_index?: number }[]) => {
        try {
            for (const update of updates) {
                const { error } = await supabase
                    .from('tasks')
                    .update(update)
                    .eq('id', update.id);
                if (error) throw error;
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to save task order");
        }
    };


    const updateOrder = async (items: any[]) => {
        try {
            // We only need to update the order_index and parent_id
            // Supabase upsert: needs primary key match
            const { error } = await supabase
                .from('sections')
                .upsert(
                    items.map(item => ({
                        id: item.id,
                        project_id: projectId, // specific constraint
                        title: item.title,
                        order_index: item.order_index,
                        parent_id: item.parent_id
                    })),
                    { onConflict: 'id' }
                );

            if (error) throw error;
        } catch (e) {
            console.error(e);
            toast.error("Failed to save order");
        }
    };


    // --- UI Helpers ---

    const toggleExpand = useCallback((id: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const openAddSection = (parentId: string | null = null) => {
        setTargetSectionId(parentId);
        setDialogInputValue("");
        setIsAddSectionOpen(true);
    };

    const openEditSection = (section: Section) => {
        setEditingSection(section);
        setDialogInputValue(section.title);
    };

    const handleClearTasks = async (sectionId: string) => {
        const { error } = await supabase.from('tasks').delete().eq('section_id', sectionId);
        if (error) {
            console.error('Failed to clear tasks', error);
            toast.error('Failed to clear old tasks');
            return;
        }
        setSections(prev => {
            const clearTasks = (list: Section[]): Section[] => {
                return list.map(s => {
                    if (s.id === sectionId) return { ...s, tasks: [] };
                    if (s.children) return { ...s, children: clearTasks(s.children) };
                    return s;
                });
            };
            return clearTasks(prev);
        });
    };

    const openAddTask = (section: Section) => {
        // Always open Add Task dialog directly
        // Conflict check moved to handleSingleAutoGenerate (when user clicks Generate Requirements)
        continueAddTask(section);
    };

    const continueAddTask = (section: Section) => {
        setStructureWarningSection(null);
        setTargetSection(section);
        setEditingTask(null);
        setDialogInputValue("");
        setShowSourceSelector(false);
        setSelectedSourceIds(linkedSourceIds);
        setIsAddTaskOpen(true);
    };

    const openEditTask = (task: Task) => {
        setInlineEditingTaskId(task.id);
        setInlineTaskValue(task.requirement_text);
    };

    const saveInlineEdit = useCallback(async () => {
        if (!inlineEditingTaskId || !inlineTaskValue.trim()) return;

        try {
            const { error } = await supabase
                .from('tasks')
                .update({ requirement_text: inlineTaskValue })
                .eq('id', inlineEditingTaskId);

            if (error) throw error;

            toast.success("Task updated");
            setInlineEditingTaskId(null);
            setInlineTaskValue("");
            fetchData();
        } catch (error) {
            toast.error("Failed to update task");
        }
    }, [inlineEditingTaskId, inlineTaskValue, supabase, fetchData]);

    const cancelInlineEdit = useCallback(() => {
        setInlineEditingTaskId(null);
        setInlineTaskValue("");
    }, []);


    const openAddSubsection = (section: Section) => {
        setSubsectionTargetSection(section);
        setSubsectionInputValue("");
        setIsAddSubsectionOpen(true);
    };

    // --- Recursive Renderer ---

    // Inline edit handler for tasks (wrapper around openEditTask)
    const startInlineEdit = (task: Task) => {
        openEditTask(task);
    };

    // Memoize contentLoading object to prevent re-renders
    const contentLoading = useMemo(() =>
        generatingTaskId ? { [generatingTaskId]: true } : {},
        [generatingTaskId]
    );

    // Original renderSection definition replaced by:
    const renderSection = useCallback((section: Section, depth: number = 0, dragHandleProps?: any): React.ReactNode => {
        return (
            <ProposalTreeItem
                key={section.id}
                section={section}
                depth={depth}
                dragHandleProps={dragHandleProps}
                expandedSections={expandedSections}
                toggleExpand={toggleExpand}
                sectionViewModes={sectionViewModes}
                setSectionViewModes={setSectionViewModes}
                fullSources={fullSources}
                sources={sources}
                handleIntegrateSection={handleIntegrateSection}
                continueAddTask={continueAddTask}
                openAddSection={openAddSection}
                openAddSubsection={openAddSubsection}
                openEditSection={openEditSection}
                handleDeleteSection={handleDeleteSection}
                integratingSectionId={integratingSectionId}
                inlineEditingSectionId={inlineEditingSectionId}
                inlineSectionValue={inlineSectionValue}
                setInlineSectionValue={setInlineSectionValue}
                startEditingSectionContent={startEditingSectionContent}
                saveEditingSectionContent={saveEditingSectionContent}
                cancelEditingSectionContent={cancelEditingSectionContent}
                expandedTaskIds={expandedTaskIds}
                toggleTaskExpansion={toggleTaskExpansion}
                inlineEditingTaskId={inlineEditingTaskId}
                inlineTaskValue={inlineTaskValue}
                setInlineTaskValue={setInlineTaskValue}
                saveInlineEdit={saveInlineEdit}
                cancelInlineEdit={cancelInlineEdit}
                openEditTask={openEditTask}
                startInlineEdit={startInlineEdit}
                handleGenerateTaskContent={handleGenerateTaskContent}
                handleGenerateTaskImage={handleGenerateTaskImage}
                handleDeleteImage={handleDeleteImage}
                openContentPanel={openContentPanel}
                handleDeleteTask={handleDeleteTask}
                taskContents={taskContents}
                contentLoading={contentLoading}
                setSelectedEvidence={setSelectedEvidence}
                taskFilter={taskFilter} // Pass filter prop
            />
        );
    }, [
        expandedSections, toggleExpand, sectionViewModes, fullSources, sources,
        handleIntegrateSection, continueAddTask, openAddSection, openAddSubsection,
        openEditSection, handleDeleteSection, integratingSectionId, inlineEditingSectionId,
        inlineSectionValue, startEditingSectionContent, saveEditingSectionContent,
        cancelEditingSectionContent, expandedTaskIds, toggleTaskExpansion,
        inlineEditingTaskId, inlineTaskValue, saveInlineEdit, cancelInlineEdit,
        openEditTask, startInlineEdit, handleGenerateTaskContent, handleGenerateTaskImage,
        handleDeleteImage, openContentPanel, handleDeleteTask, taskContents, contentLoading
    ]);

    // --- Main Component Return ---
    return (
        <div className="flex h-full">
            {/* Left Panel: Proposal Structure */}
            <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
                {/* Header Toolbar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">章節規劃</h2>

                        {/* Task Filter Toggle */}
                        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex items-center">
                            <ToggleGroup type="single" value={taskFilter} onValueChange={(val) => val && setTaskFilter(val as any)}>
                                <ToggleGroupItem value="all" size="sm" className="h-7 px-3 text-xs data-[state=on]:bg-white dark:data-[state=on]:bg-gray-700 data-[state=on]:shadow-sm transition-all">
                                    全部
                                </ToggleGroupItem>
                                <ToggleGroupItem value="wf11_functional" size="sm" className="h-7 px-3 text-xs gap-1.5 data-[state=on]:bg-indigo-50 data-[state=on]:text-indigo-600 dark:data-[state=on]:bg-indigo-900/30 dark:data-[state=on]:text-indigo-400 data-[state=on]:shadow-sm transition-all">
                                    <Cpu className="w-3 h-3" />
                                    工程視角
                                </ToggleGroupItem>
                                <ToggleGroupItem value="wf13_article" size="sm" className="h-7 px-3 text-xs gap-1.5 data-[state=on]:bg-emerald-50 data-[state=on]:text-emerald-600 dark:data-[state=on]:bg-emerald-900/30 dark:data-[state=on]:text-emerald-400 data-[state=on]:shadow-sm transition-all">
                                    <FileText className="w-3 h-3" />
                                    管理視角
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={handleGenerateClick}
                            disabled={generating}
                        >
                            {generating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            {generating ? '生成中...' : '生成章節'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => openAddSection(null)}
                        >
                            <FolderPlus className="w-4 h-4" />
                            新增章節
                        </Button>
                    </div>
                </div>

                {/* Editor Card */}
                <div className="w-full bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    {/* Tree Content */}
                    <div className="p-4 min-h-[400px]">
                        {loading ? (
                            <div className="space-y-3">
                                <div className="h-10 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
                                <div className="h-10 bg-gray-100 dark:bg-gray-900 rounded animate-pulse ml-8" />
                                <div className="h-10 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
                            </div>
                        ) : sections.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <GripVertical className="w-10 h-10 mb-4 opacity-20" />
                                <p>No structure defined yet.</p>
                                <Button variant="link" onClick={() => openAddSection(null)}>Create your first chapter</Button>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={sections.map(s => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-1">
                                        {sections.map((section) => (
                                            // @ts-ignore - renderSection has correct signature despite TypeScript inference issue
                                            <SortableNode
                                                key={section.id}
                                                section={section}
                                                depth={0}
                                                renderSection={renderSection}
                                                expandedSections={expandedSections}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>

                    {/* --- Dialogs --- */}

                    {/* Add/Update Section Dialog */}
                    {/* Add/Update Section Dialog */}
                    <AddSectionDialog
                        open={isAddSectionOpen || !!editingSection}
                        onOpenChange={(open) => {
                            if (!open) {
                                setIsAddSectionOpen(false);
                                setEditingSection(null);
                            }
                        }}
                        editingSection={editingSection}
                        dialogInputValue={dialogInputValue}
                        setDialogInputValue={setDialogInputValue}
                        onAdd={handleAddSection}
                        onUpdate={handleUpdateSection}
                        onCancel={() => { setIsAddSectionOpen(false); setEditingSection(null); }}
                    />

                    {/* Add Subsection Dialog (Manual + AI Entry) */}

                    <AddSubsectionDialog
                        open={isAddSubsectionOpen}
                        onOpenChange={setIsAddSubsectionOpen}
                        targetSection={subsectionTargetSection}
                        dialogInputValue={subsectionInputValue}
                        setDialogInputValue={setSubsectionInputValue}
                        onSwitchToAI={() => {
                            setIsAddSubsectionOpen(false);
                            // Default to linked sources from Sidebar instead of ALL sources
                            setSubsectionSourceIds(linkedSourceIds);
                            setIsGenerateSubsectionOpen(true);
                        }}
                        onAdd={handleAddSubsection}
                        onCancel={() => setIsAddSubsectionOpen(false)}
                    />

                    {/* Generate Subsection Dialog (Source Selection) - Refined UI */}
                    {/* Generate Subsection Dialog (Source Selection) - Refined UI */}
                    <GenerateSubsectionDialog
                        open={isGenerateSubsectionOpen}
                        onOpenChange={(open) => {
                            setIsGenerateSubsectionOpen(open);
                            if (!open) {
                                // Optional: logic when closing
                            }
                        }}
                        targetSection={subsectionTargetSection}
                        sources={sources}
                        selectedSourceIds={subsectionSourceIds}
                        onSelectionChange={setSubsectionSourceIds}
                        onAddSource={() => setIsAddSourceDialogOpen(true)}
                        onGenerate={() => subsectionTargetSection && handleSubsectionGenerationRequest(subsectionSourceIds, subsectionTargetSection)}
                        isGenerating={isGeneratingSubsection}
                    />

                    {/* Subsection Conflict Dialog */}
                    <Dialog open={isSubsectionConflictDialogOpen} onOpenChange={setIsSubsectionConflictDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-amber-600">
                                    <span className="p-1 bg-amber-100 rounded-full"><div className="w-2 h-2 bg-amber-600 rounded-full" /></span>
                                    該章節已有子章節
                                </DialogTitle>
                            </DialogHeader>
                            <div className="py-4 text-sm text-gray-600">
                                此章節 (<strong>{pendingSubsectionArgs?.targetSection?.title}</strong>) 已經包含子章節。<br />
                                您希望如何處理？
                            </div>
                            <DialogFooter className="gap-2 sm:justify-between">
                                <Button variant="outline" onClick={() => setIsSubsectionConflictDialogOpen(false)}>取消</Button>
                                <div className="flex gap-2">
                                    <Button
                                        variant="destructive"
                                        className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                        onClick={() => confirmSubsectionGeneration('replace')}
                                    >
                                        取代章節 (刪除舊有)
                                    </Button>
                                    <Button
                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                        onClick={() => confirmSubsectionGeneration('append')}
                                    >
                                        新增章節 (保留舊有)
                                    </Button>
                                </div>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Add Task Dialog */}
                    <AddTaskDialog
                        open={isAddTaskOpen}
                        onOpenChange={setIsAddTaskOpen}
                        targetSection={targetSection}
                        editingTask={editingTask}
                        dialogInputValue={dialogInputValue}
                        setDialogInputValue={setDialogInputValue}
                        sources={sources}
                        selectedSourceIds={selectedSourceIds}
                        setSelectedSourceIds={setSelectedSourceIds}
                        showSourceSelector={showSourceSelector}
                        setShowSourceSelector={setShowSourceSelector}
                        onAddTask={handleAddTask}
                        onUpdateTask={handleUpdateTask}
                        onGenerateTechnical={() => handleSingleAutoGenerate('technical')}
                        onGenerateManagement={() => handleSingleAutoGenerate('management')}
                        onAddSource={() => setIsAddSourceDialogOpen(true)}
                        generating={generating}
                    />

                    {/* Task Conflict Dialog */}
                    <ConflictConfirmationDialog
                        open={!!taskConflictContext}
                        onOpenChange={(open) => !open && setTaskConflictContext(null)}
                        title="發現現有任務 (Existing Tasks Found)"
                        description={taskConflictContext?.type === 'all'
                            ? "您選擇的所有章節中已經包含任務。您希望如何處理？"
                            : "此章節已經包含任務。您希望如何處理？"}
                        appendOption={{
                            label: "保留並新增",
                            description: "不會刪除現有任務，新任務將加在最後面。",
                        }}
                        replaceOption={{
                            label: "全部取代",
                            description: `將刪除${taskConflictContext?.type === 'all' ? "目標章節的" : "此章節的"}現有任務，重新生成。`,
                            showWarning: true,
                        }}
                        onCancel={() => setTaskConflictContext(null)}
                        onAppend={() => confirmTaskConflict('append')}
                        onReplace={() => confirmTaskConflict('replace')}
                        cancelLabel="取消"
                    />

                    {/* Manual Task Conflict Dialog (Unified Style) */}
                    <Dialog open={!!structureWarningSection} onOpenChange={(open) => !open && setStructureWarningSection(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {structureWarningSection?.children && structureWarningSection.children.length > 0
                                        ? "發現現有子章節 (Has Sub-sections)"
                                        : "發現現有任務 (Existing Tasks Found)"}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="py-4 text-gray-600">
                                <p>
                                    {structureWarningSection?.children && structureWarningSection.children.length > 0
                                        ? `此章節「${structureWarningSection.title}」已經包含 ${structureWarningSection.children.length} 個子章節。您希望如何處理？`
                                        : `此章節「${structureWarningSection?.title}」已經包含現有任務。您希望如何處理？`
                                    }
                                </p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    <li><strong>保留並新增 (Append)</strong>: {structureWarningSection?.children && structureWarningSection.children.length > 0 ? "在父章節新增任務（將導致結構混合）。" : "不會刪除現有任務，新任務將加在最後面。"}</li>
                                    <li><strong>全部取代 (Replace)</strong>: ⚠️ {structureWarningSection?.children && structureWarningSection.children.length > 0 ? "將刪除目前所有子章節與任務，重新開始。" : "將刪除此章節的現有任務，重新生成。"}</li>
                                </ul>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button variant="outline" onClick={() => setStructureWarningSection(null)}>取消 (Cancel)</Button>
                                <Button variant="secondary" onClick={async () => {
                                    if (structureWarningSection) {
                                        setStructureWarningSection(null);
                                        // Check if this is from Generate flow (sources selected)
                                        if (selectedSourceIds.length > 0) {
                                            await executeSingleGeneration('append', selectedSourceIds, dialogInputValue, structureWarningSection);
                                        } else {
                                            continueAddTask(structureWarningSection);
                                        }
                                    }
                                }}>保留並新增 (Append)</Button>
                                <Button
                                    variant="destructive"
                                    onClick={async () => {
                                        if (structureWarningSection) {
                                            // 1. Delete Sub-sections (if any)
                                            if (structureWarningSection.children && structureWarningSection.children.length > 0) {
                                                const { error } = await supabase.from('sections').delete().eq('parent_id', structureWarningSection.id);
                                                if (error) {
                                                    console.error("Failed to delete subsections", error);
                                                    toast.error("Failed to delete sub-sections");
                                                    return;
                                                }
                                            }
                                            // 2. Delete Tasks
                                            await handleClearTasks(structureWarningSection.id);

                                            setStructureWarningSection(null);

                                            // 3. Route based on flow (Generate vs Manual)
                                            if (selectedSourceIds.length > 0) {
                                                await executeSingleGeneration('append', selectedSourceIds, dialogInputValue, structureWarningSection);
                                            } else {
                                                continueAddTask(structureWarningSection);
                                            }

                                            // 4. Force refresh to update tree structure
                                            fetchData();
                                        }
                                    }}>
                                    全部取代 (Replace)
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>



                    {/* Conflict Resolution Dialog */}
                    <ConflictConfirmationDialog
                        open={isConflictDialogOpen}
                        onOpenChange={setIsConflictDialogOpen}
                        title="發現現有章節 (Existing Chapters Found)"
                        description={`您已經有建立了 ${sections.length} 個章節。您希望如何處理新的生成內容？`}
                        appendOption={{
                            label: "保留並新增",
                            description: "不會刪除現有內容，新章節將加在最後面。",
                        }}
                        replaceOption={{
                            label: "全部取代",
                            description: "將刪除目前所有章節與任務，重新生成。",
                            showWarning: true,
                        }}
                        onCancel={() => setIsConflictDialogOpen(false)}
                        onAppend={() => executeGeneration('append')}
                        onReplace={() => executeGeneration('replace')}
                        cancelLabel="取消"
                    />

                    <TemplateUploadDialog
                        open={isTemplateDialogOpen}
                        onClose={() => setIsTemplateDialogOpen(false)}
                        projectId={projectId}
                        onSuccess={() => fetchData()}
                    />

                    {selectedEvidence && (
                        <div className="fixed inset-y-0 right-0 w-1/3 bg-white dark:bg-gray-900 shadow-2xl z-50 animate-in slide-in-from-right duration-300 border-l border-gray-200 dark:border-gray-800">
                            <SourceDetailPanel
                                source={selectedEvidence ? { ...fullSources[selectedEvidence.source_id], id: selectedEvidence.source_id } : undefined}
                                evidence={selectedEvidence}
                                onClose={() => setSelectedEvidence(null)}
                                onGenerateSummary={async (sourceId: string) => {
                                    try {
                                        await sourcesApi.summarize(sourceId);

                                        // Note: We might need to update the source in a more persistent way or just notify user
                                        toast.success('摘要生成成功 (Summary Generated)');
                                    } catch (error) {
                                        toast.error('摘要生成失敗 (Failed to generate summary)');
                                    }
                                }}
                            />
                        </div>
                    )}


                    {/* Content Generation Conflict Dialog */}
                    <ConflictConfirmationDialog
                        open={isContentConflictDialogOpen}
                        onOpenChange={setIsContentConflictDialogOpen}
                        title="發現現有內容 (Existing Content Found)"
                        description="此任務已經有生成的內容。您希望如何處理？"
                        appendOption={{
                            label: "保留並新增",
                            description: "不會刪除現有內容，新內容將加版本號。",
                        }}
                        replaceOption={{
                            label: "全部取代",
                            description: "將刪除此任務的現有內容，重新生成。",
                            showWarning: true,
                        }}
                        onCancel={() => {
                            setIsContentConflictDialogOpen(false);
                            setPendingContentGeneration(null);
                        }}
                        onAppend={() => confirmContentReplacement('append')}
                        onReplace={() => confirmContentReplacement('replace')}
                        cancelLabel="取消"
                    />

                    <ContentGenerationDialog
                        open={isContentGenerationDialogOpen}
                        onOpenChange={setIsContentGenerationDialogOpen}
                        contentGenerationTarget={contentGenerationTarget}
                        sources={sources}
                        contentGenerationSourceIds={contentGenerationSourceIds}
                        setContentGenerationSourceIds={setContentGenerationSourceIds}
                        onGenerate={confirmGenerateTaskContent}
                        onAddSource={() => setIsAddSourceDialogOpen(true)}
                    />

                    <AddSourceDialog
                        open={isAddSourceDialogOpen}
                        onOpenChange={setIsAddSourceDialogOpen}
                        projectId={projectId}
                        onSourceAdded={() => {
                            fetchData();
                        }}
                    />
                </div>

                {/* Floating Content Panels */}
                {Array.from(openContentPanels.entries()).map(([taskId, info], index) => {
                    const content = taskContents.get(taskId);
                    if (!content) return null;
                    return (
                        <DraggableContentPanel
                            key={taskId}
                            taskId={taskId}
                            taskText={info.taskText}
                            content={content.content}
                            wordCount={content.word_count}
                            sectionTitle={info.sectionTitle}
                            onClose={() => closeContentPanel(taskId)}
                            initialPosition={{ x: 150 + index * 30, y: 100 + index * 30 }}
                        />
                    );
                })}
            </div>
            {/* Image Generation Dialog */}
            <ImageGenerationDialog
                open={imageGenDialogOpen}
                onOpenChange={setImageGenDialogOpen}
                task={selectedTaskForImage}
                projectImages={allProjectImages}
                onGenerate={executeImageGeneration}
                onUpload={(file) => handleUploadImage(file, selectedTaskForImage?.id || '')}
            />

            {/* Task Generation Dialog (WF11) */}
            <TaskGenerationDialog
                open={isTaskGenerationDialogOpen}
                onOpenChange={setIsTaskGenerationDialogOpen}
                sectionTitle={taskGenerationContext?.targetSection?.title || ''}
                onGenerate={confirmTaskGeneration}
            />

        </div>
    );
}
