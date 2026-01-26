
import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Sparkles, MoreVertical, FileText, Database, Copy, Check, Download, ChevronRight } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Draggable from "react-draggable";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AddChapterMethodDialog } from "./dialogs/AddChapterMethodDialog";
import { GenerationModeDialog } from "./dialogs/GenerationModeDialog";
import { TemplateUploadDialog } from "@/components/templates/TemplateUploadDialog";
import { SourceSelectionDialog } from "./dialogs/SourceSelectionDialog";
import { getErrorMessage } from "@/lib/errorUtils";

// --- Sub-components ---

function DraggableTaskPopup({ task, isOpen, onClose }: { task: Task, isOpen: boolean, onClose: () => void }) {
    const nodeRef = React.useRef(null);
    const [copied, setCopied] = React.useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        const text = typeof task.requirement_text === 'string'
            ? task.requirement_text
            : JSON.stringify(task.requirement_text, null, 2);

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied to clipboard");
    };

    const handleDownload = () => {
        const text = typeof task.requirement_text === 'string'
            ? task.requirement_text
            : JSON.stringify(task.requirement_text, null, 2);

        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `task-requirement-${task.id.slice(0, 8)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Download started");
    };

    // Helper to render requirement text safely
    const renderRequirementText = (text: any) => {
        if (typeof text === 'string') return text;
        try {
            return JSON.stringify(text, null, 2);
        } catch (e) {
            return String(text);
        }
    };

    return createPortal(
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
            <Draggable nodeRef={nodeRef} handle=".drag-handle">
                <div
                    ref={nodeRef}
                    className="pointer-events-auto w-full max-w-2xl bg-white dark:bg-zinc-950 border-2 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)] flex flex-col max-h-[85vh] overflow-hidden"
                >
                    {/* Header / Drag Handle */}
                    <div className="drag-handle cursor-move p-4 border-b-2 border-black dark:border-white bg-[#FA4028] text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 opacity-50" />
                            <h3 className="text-sm font-black uppercase tracking-widest font-mono italic">Task_Details_View</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopy}
                                className="p-1 hover:bg-black/20 transition-colors border-2 border-transparent hover:border-black/50 flex items-center gap-1.5"
                                title="Copy Requirements"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                <span className="text-[10px] font-bold uppercase">Copy</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                className="p-1 hover:bg-black/20 transition-colors border-2 border-transparent hover:border-black/50 flex items-center gap-1.5"
                                title="Download Requirements"
                            >
                                <Download className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase">Download</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-black/20 transition-colors border-2 border-transparent hover:border-black/50"
                            >
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-zinc-950">
                        <div className="p-8 space-y-8">
                            {/* Requirement Spec */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-4 bg-black dark:bg-white" />
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Requirement_Spec</h4>
                                </div>
                                <div className="p-5 bg-zinc-50 dark:bg-zinc-900 border-2 border-black/5 dark:border-white/5 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                                    {renderRequirementText(task.requirement_text)}
                                </div>
                            </div>

                            {/* Reference */}
                            {(task.citation_quote || task.citation_source_id) && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-blue-500" />
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Source_Reference</h4>
                                    </div>
                                    <div className="border-2 border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 p-5">
                                        {task.citation_quote && (
                                            <blockquote className="text-xs italic text-zinc-600 dark:text-zinc-400 border-l-4 border-[#FA4028] pl-4 py-1 mb-4">
                                                "{task.citation_quote}"
                                            </blockquote>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline" className="rounded-none border-2 border-blue-200 bg-white dark:bg-zinc-900 text-blue-600 font-mono text-[10px]">
                                                SOURCE: {task.citation_source_id?.slice(0, 8)}...
                                            </Badge>
                                            {task.citation_page && (
                                                <Badge variant="outline" className="rounded-none border-2 border-zinc-200 bg-white dark:bg-zinc-900 text-zinc-600 font-mono text-[10px]">
                                                    PAGE: {task.citation_page}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-black/5 dark:border-white/5">
                                <div>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status_Flag</span>
                                    <div className="mt-2 text-xs font-black uppercase">
                                        <span className={cn(
                                            "inline-block px-2 py-1 border-2",
                                            task.status === 'pending' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                                                task.status === 'approved' ? 'border-green-200 bg-green-50 text-green-700' :
                                                    'border-zinc-200 bg-zinc-50 text-zinc-500'
                                        )}>
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Entry_ID</span>
                                    <div className="mt-2 font-mono text-xs text-zinc-600">{task.id}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t-2 border-black dark:border-white bg-zinc-50 dark:bg-zinc-900 shrink-0 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="rounded-none border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-bold uppercase tracking-tighter"
                        >
                            ACKNOWLEDGE_&_CLOSE
                        </Button>
                    </div>
                </div>
            </Draggable>
        </div>,
        document.body
    );
}

function TaskItem({ task }: { task: Task }) {
    const [isOpen, setIsOpen] = useState(false);

    // Defensive summary rendering
    const renderSummary = (text: any) => {
        if (typeof text === 'string') return text;
        try {
            const str = JSON.stringify(text);
            return str.length > 100 ? str.slice(0, 100) + '...' : str;
        } catch (e) {
            return '[Structured Data]';
        }
    };

    return (
        <>
            <div
                onClick={() => setIsOpen(true)}
                className="pl-4 border-l-2 border-black/5 dark:border-white/5 py-2 text-xs group cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-r-sm"
            >
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-1">
                        <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-black/80 dark:text-white/80 line-clamp-2 group-hover:text-black dark:group-hover:text-white transition-colors">
                            <div className="whitespace-pre-wrap font-medium">
                                {renderSummary(task.requirement_text)}
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className={cn(
                            "text-[9px] uppercase font-bold px-1.5 py-0.5 border",
                            task.status === 'pending' ? 'bg-yellow-100/50 text-yellow-700 border-yellow-200' :
                                task.status === 'approved' ? 'bg-green-100/50 text-green-700 border-green-200' :
                                    'bg-zinc-100 text-zinc-500 border-zinc-200'
                        )}>
                            {task.status}
                        </span>
                    </div>
                </div>
            </div>

            <DraggableTaskPopup task={task} isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}

function GenerationBadge({ method, isModified, compact = false }: { method?: 'manual' | 'ai_gen' | 'template', isModified?: boolean, compact?: boolean }) {
    if (!method) return null;

    const labelMap = {
        manual: 'MANUAL',
        ai_gen: 'AI_GEN',
        template: 'TEMPLATE'
    };

    const colorMap = {
        manual: 'text-black border-black bg-zinc-100 dark:bg-zinc-800 dark:text-white dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]',
        ai_gen: 'text-white border-black bg-[#FA4028] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
        template: 'text-white border-black bg-blue-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
    };

    return (
        <span className={cn(
            "font-mono font-bold uppercase border px-1.5 py-0.5 select-none transition-all",
            compact ? "text-[7px] leading-none py-0.5" : "text-[9px] tracking-widest",
            colorMap[method]
        )}>
            {labelMap[method] || 'MANUAL'}{isModified ? '*' : ''}
        </span>
    );
}

interface TenderPlanningProps {
    projectId: string;
    onNextStage?: () => void;
    onPrevStage?: () => void;
}

interface Section {
    id: string;
    title: string;
    parent_id: string | null;
    order_index: number;
    generation_method?: 'manual' | 'ai_gen' | 'template';
    is_modified?: boolean;
    tasks?: Task[];
    expanded?: boolean; // UI state for task visibility
}

interface Task {
    id: string;
    requirement_text: string;
    status: string;
    section_id: string;
    citation_source_id?: string;
    citation_page?: number;
    citation_quote?: string;
    created_at?: string;
}

interface Chapter {
    id: string;
    title: string;
    sections: Section[]; // Child sections from the database
    generation_method?: 'manual' | 'ai_gen' | 'template';
    is_modified?: boolean;
    expanded?: boolean; // UI state for section visibility
}

// Fallback initial outline if none exists
const DEFAULT_OUTLINE: Chapter[] = [];

export function TenderPlanning({ projectId, onNextStage, onPrevStage }: TenderPlanningProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [outline, setOutline] = useState<Chapter[]>([]);
    const [deletedSectionIds, setDeletedSectionIds] = useState<string[]>([]); // Track deleted sections for save

    // New Dialog States
    const [isMethodDialogOpen, setIsMethodDialogOpen] = useState(false);
    const [methodDialogContext, setMethodDialogContext] = useState<'chapter' | 'section'>('chapter');
    const [activeSectionChapterIndex, setActiveSectionChapterIndex] = useState<number | null>(null);
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const [isGenerationModeDialogOpen, setIsGenerationModeDialogOpen] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Task Generation Mode State
    const [isTaskModeDialogOpen, setIsTaskModeDialogOpen] = useState(false);
    const [taskGenerationContext, setTaskGenerationContext] = useState<{ sectionId: string, sectionTitle: string, mode: 'function' | 'content' } | null>(null);

    // Source Selection State
    const [isSourceSelectionOpen, setIsSourceSelectionOpen] = useState(false);
    const [sourceSelectionContext, setSourceSelectionContext] = useState<{
        type: 'chapter' | 'section' | 'task',
        data: any,
        next: (sourceIds: string[]) => void
    } | null>(null);

    // Collapsible Header State
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setOutline((prev) => {
            const newOutline = [...prev];

            // 1. Try to find if it's a chapter move
            const oldChapterIndex = prev.findIndex(c => c.id === active.id);
            const newChapterIndex = prev.findIndex(c => c.id === over.id);

            if (oldChapterIndex !== -1 && newChapterIndex !== -1) {
                return arrayMove(newOutline, oldChapterIndex, newChapterIndex).map(item => ({ ...item, is_modified: true }));
            }

            // 2. Try to find if it's a section move within same chapter
            for (let i = 0; i < newOutline.length; i++) {
                const chapter = newOutline[i];
                const sections = chapter.sections || [];
                const oldSectionIndex = sections.findIndex(s => s.id === active.id);
                const newSectionIndex = sections.findIndex(s => s.id === over.id);

                if (oldSectionIndex !== -1 && newSectionIndex !== -1) {
                    const newSections = arrayMove([...sections], oldSectionIndex, newSectionIndex);
                    newOutline[i] = {
                        ...chapter,
                        sections: newSections.map((s, idx) => ({ ...s, order_index: idx + 1 })),
                        is_modified: true
                    };
                    return newOutline;
                }
            }

            return prev;
        });
    };

    const [supabase] = useState(() => createClient());

    const fetchData = useCallback(async () => {
        try {
            // Fetch sections from the sections table
            const { data: sectionsData, error } = await supabase
                .from('sections')
                .select('*')
                .eq('project_id', projectId)
                .order('order_index', { ascending: true });

            if (error) throw error;

            if (sectionsData && sectionsData.length > 0) {
                // Fetch tasks for these sections
                const sectionIds = sectionsData.map((s: Section) => s.id);
                const { data: tasksData } = await supabase
                    .from('tasks')
                    .select('*')
                    .in('section_id', sectionIds)
                    .order('created_at', { ascending: true });

                const tasksBySection = (tasksData || []).reduce((acc: Record<string, Task[]>, task: Task) => {
                    if (!acc[task.section_id]) acc[task.section_id] = [];
                    acc[task.section_id].push(task);
                    return acc;
                }, {});

                // Group sections by parent_id to build tree
                const rootSections = sectionsData.filter((s: Section) => s.parent_id === null);
                const childSections = sectionsData.filter((s: Section) => s.parent_id !== null);

                // Build chapters with their child sections
                const chapters: Chapter[] = rootSections.map((root: Section) => ({
                    id: root.id,
                    title: root.title,
                    generation_method: root.generation_method,
                    is_modified: root.is_modified,
                    expanded: true, // Default to expanded
                    sections: childSections
                        .filter((child: Section) => child.parent_id === root.id)
                        .map((child: Section) => ({
                            ...child,
                            generation_method: child.generation_method || 'manual',
                            is_modified: child.is_modified || false,
                            tasks: tasksBySection[child.id] || []
                        }))
                        .sort((a: Section, b: Section) => (a.order_index || 0) - (b.order_index || 0))
                }));

                // Sort chapters
                chapters.sort((a, b) => {
                    const idxA = rootSections.find((r: Section) => r.id === a.id)?.order_index || 0;
                    const idxB = rootSections.find((r: Section) => r.id === b.id)?.order_index || 0;
                    return idxA - idxB;
                });

                if (chapters.length > 0) {
                    setOutline(chapters);
                } else {
                    setOutline(DEFAULT_OUTLINE);
                }
            } else {
                setOutline(DEFAULT_OUTLINE);
            }
        } catch (error) {
            console.error('Error fetching outline:', error);
            toast.error('Failed to load outline');
        } finally {
            setLoading(false);
        }
    }, [projectId, supabase]);

    const toggleChapter = (cIndex: number) => {
        setOutline(prev => {
            const newOutline = [...prev];
            const newChapter = { ...newOutline[cIndex] };
            newChapter.expanded = !newChapter.expanded;
            newOutline[cIndex] = newChapter;
            return newOutline;
        });
    };

    const toggleSectionTasks = (cIndex: number, sIndex: number) => {
        setOutline(prev => {
            const newOutline = [...prev];
            const newChapter = { ...newOutline[cIndex] };
            const newSections = [...(newChapter.sections || [])];
            if (newSections[sIndex]) {
                const newSection = { ...newSections[sIndex] };
                newSection.expanded = !newSection.expanded;
                newSections[sIndex] = newSection;
                newChapter.sections = newSections;
                newOutline[cIndex] = newChapter;
            }
            return newOutline;
        });
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Delete removed sections first
            if (deletedSectionIds.length > 0) {
                const { error: deleteError } = await supabase
                    .from('sections')
                    .delete()
                    .in('id', deletedSectionIds);

                if (deleteError) throw deleteError;
            }

            // Upsert all chapters and sections
            for (let i = 0; i < outline.length; i++) {
                const chapter = outline[i];

                // Upsert chapter (root section)
                const { error: chapterError } = await supabase
                    .from('sections')
                    .upsert({
                        id: chapter.id,
                        project_id: projectId,
                        title: chapter.title,
                        parent_id: null,
                        order_index: i + 1,
                        generation_method: chapter.generation_method || 'manual',
                        is_modified: chapter.is_modified || false
                    });
                if (chapterError) throw chapterError;

                // Upsert child sections
                for (let j = 0; j < chapter.sections.length; j++) {
                    const section = chapter.sections[j];
                    const { error: sectionError } = await supabase
                        .from('sections')
                        .upsert({
                            id: section.id,
                            project_id: projectId,
                            title: section.title,
                            parent_id: chapter.id,
                            order_index: j + 1,
                            generation_method: (section.generation_method as any) || 'manual',
                            is_modified: section.is_modified || false
                        });
                    if (sectionError) throw sectionError;
                }
            }

            setDeletedSectionIds([]);
            toast.success("Proposal Outline Saved", {
                description: "Your changes have been committed to the database."
            });
        } catch (error: any) {
            console.error("Error saving outline:", error);
            toast.error("Save Failed", {
                description: error.message
            });
        } finally {
            setSaving(false);
        }
    };

    const updateChapterTitle = (index: number, newTitle: string) => {
        const newOutline = [...outline];
        newOutline[index].title = newTitle;
        newOutline[index].is_modified = true; // Mark as modified on user edit
        setOutline(newOutline);
    };

    const updateSectionTitle = (chapterIndex: number, sectionIndex: number, newTitle: string) => {
        const newOutline = [...outline];
        if (!newOutline[chapterIndex].sections) newOutline[chapterIndex].sections = [];
        newOutline[chapterIndex].sections[sectionIndex] = {
            ...newOutline[chapterIndex].sections[sectionIndex],
            title: newTitle,
            is_modified: true // Mark as modified on user edit
        };
        setOutline(newOutline);
    };

    const addChapter = () => {
        setOutline([...outline, {
            id: crypto.randomUUID(),
            title: "New Chapter",
            sections: [],
            generation_method: 'manual',
            is_modified: false
        }]);
    };

    const deleteChapter = (index: number) => {
        const chapter = outline[index];
        // Track deleted IDs
        const idsToDelete = [chapter.id, ...chapter.sections.map(s => s.id)];
        setDeletedSectionIds(prev => [...prev, ...idsToDelete]);

        const newOutline = [...outline];
        newOutline.splice(index, 1);
        setOutline(newOutline);
    };

    const addSection = (chapterIndex: number, method: 'manual' | 'ai_gen' | 'template' = 'manual') => {
        const newOutline = [...outline];
        if (!newOutline[chapterIndex].sections) newOutline[chapterIndex].sections = [];
        newOutline[chapterIndex].sections.push({
            id: crypto.randomUUID(),
            title: method === 'manual' ? "New Section" : (method === 'ai_gen' ? "New AI Section" : "New Template Section"),
            parent_id: newOutline[chapterIndex].id,
            order_index: newOutline[chapterIndex].sections.length + 1,
            generation_method: method,
            is_modified: false
        });
        setOutline(newOutline);
    };

    const deleteSection = (chapterIndex: number, sectionIndex: number) => {
        const section = outline[chapterIndex].sections[sectionIndex];
        setDeletedSectionIds(prev => [...prev, section.id]);

        const newOutline = [...outline];
        newOutline[chapterIndex].sections.splice(sectionIndex, 1);
        setOutline(newOutline);
    };

    // --- Advanced Chapter Addition Logic ---

    const handleAddChapterClick = () => {
        setMethodDialogContext('chapter');
        setIsMethodDialogOpen(true);
    };

    const handleAddSectionClick = (chapterIndex: number) => {
        setActiveSectionChapterIndex(chapterIndex);
        setMethodDialogContext('section');
        setIsMethodDialogOpen(true);
    };

    const handleMethodSelect = async (method: 'manual' | 'ai' | 'template') => {
        setIsMethodDialogOpen(false);

        if (methodDialogContext === 'section' && activeSectionChapterIndex !== null) {
            // Handle Section Addition
            if (method === 'ai') {
                const chapter = outline[activeSectionChapterIndex];
                if (!chapter) return;

                // Check for existing entries to trigger conflict dialog
                if (chapter.sections && chapter.sections.length > 0) {
                    setIsGenerationModeDialogOpen(true);
                    // We keep activeSectionChapterIndex set so handleGenerationModeConfirm knows which chapter
                    return;
                }

                // No existing sections, open Source Selection directly
                setSourceSelectionContext({
                    type: 'section',
                    data: { chapterIndex: activeSectionChapterIndex, mode: 'append_only' },
                    next: (sourceIds) => executeSubsectionGeneration(activeSectionChapterIndex, 'append_only', sourceIds)
                });
                setIsSourceSelectionOpen(true);
            } else {
                // Manual or Template - Client side addition
                const sectionMethod = method;
                addSection(activeSectionChapterIndex, sectionMethod as 'manual' | 'ai_gen' | 'template');
                setActiveSectionChapterIndex(null);
            }
        } else {
            // Handle Chapter Addition (Existing Logic)
            if (method === 'manual') {
                addChapter();
            } else if (method === 'template') {
                setIsTemplateDialogOpen(true);
            } else if (method === 'ai') {
                // Open Mode Selection Dialog instead of executing directly
                setIsGenerationModeDialogOpen(true);
            }
        }
    };

    const executeSubsectionGeneration = async (chapterIndex: number, mode: 'replace_all' | 'append_only', sourceIds: string[]) => {
        setGenerating(true);
        const chapter = outline[chapterIndex];
        if (!chapter) {
            setGenerating(false);
            return;
        }

        console.log(`[TenderPlanning] Triggering WF10 (Sub-section Gen) for Chapter: ${chapter.title}. Mode: ${mode}`);

        try {
            // 1. Handle "Replace" mode -> Delete existing sub-sections first
            if (mode === 'replace_all' && chapter.id) {
                const { error: deleteError } = await supabase
                    .from('sections')
                    .delete()
                    .eq('parent_id', chapter.id);

                if (deleteError) throw deleteError;
                // Update local state briefly to show deletion if needed, but fetchData will handle it
            }

            // 2. Snapshot existing IDs
            const { data: initialSections } = await supabase
                .from('sections')
                .select('id')
                .eq('project_id', projectId);
            const initialIds = new Set((initialSections || []).map(s => s.id));

            // 3. Prepare payload
            const allParentSections = outline.map(c => c.title);
            const payload = {
                id: chapter.id,
                projectId,
                project_id: projectId,
                sectionId: chapter.id,
                sectionTitle: chapter.title,
                allParentSections,
                chapterId: chapter.id,
                chapter_id: chapter.id,
                parentId: chapter.id,
                parent_id: chapter.id,
                chapterTitle: chapter.title,
                chapter_title: chapter.title,
                sourceIds, // Source Selection
                generation_method: 'ai_gen'
            };

            const res = await fetch('/api/webhook/generate-requirements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to generate sections");
            }

            toast.success("AI Generation Started", {
                description: "AI Workflow is generating sub-sections..."
            });

            // 4. Post-process: Tag newly created sections
            setTimeout(async () => {
                const { data: finalSections } = await supabase
                    .from('sections')
                    .select('id, generation_method, is_modified')
                    .eq('project_id', projectId);

                if (finalSections) {
                    const newIds = finalSections
                        .filter(s => !initialIds.has(s.id))
                        .map(s => s.id);

                    if (newIds.length > 0) {
                        await supabase
                            .from('sections')
                            .update({ generation_method: 'ai_gen' })
                            .in('id', newIds);
                    }
                }

                fetchData();
                setGenerating(false);
                toast.success("Structure Updated");
                setActiveSectionChapterIndex(null); // Reset after done
            }, 4000);

        } catch (error: any) {
            console.error("WF10 Trigger Failed:", error);
            toast.error("Generation Failed", { description: error.message });
            setGenerating(false);
            setActiveSectionChapterIndex(null);
        }
    };

    const handleGenerationModeConfirm = async (mode: 'replace_all' | 'append_only') => {
        setIsGenerationModeDialogOpen(false);

        if (methodDialogContext === 'chapter') {
            // After Mode -> Source Selection
            setSourceSelectionContext({
                type: 'chapter',
                data: { mode },
                next: (sourceIds) => executeAIGeneration(mode, sourceIds)
            });
            setIsSourceSelectionOpen(true);
        } else if (methodDialogContext === 'section' && activeSectionChapterIndex !== null) {
            // After Mode -> Source Selection
            setSourceSelectionContext({
                type: 'section',
                data: { chapterIndex: activeSectionChapterIndex, mode },
                next: (sourceIds) => executeSubsectionGeneration(activeSectionChapterIndex, mode, sourceIds)
            });
            setIsSourceSelectionOpen(true);
        }
    };

    const handleSourceSelectionConfirm = (sourceIds: string[]) => {
        if (sourceSelectionContext) {
            sourceSelectionContext.next(sourceIds);
            setSourceSelectionContext(null);
        }
    };

    const executeAIGeneration = async (mode: 'replace_all' | 'append_only' = 'append_only', sourceIds: string[]) => {
        setGenerating(true);
        console.log('[TenderPlanning] Starting AI Generation. Mode:', mode);
        try {
            // 1. Handle "Replace" mode -> Delete existing data first
            if (mode === 'replace_all') {
                const { error: deleteError } = await supabase
                    .from('chapters')
                    .delete()
                    .eq('project_id', projectId);

                if (deleteError) throw deleteError;
                // Start fresh
                setOutline([]);
            }

            // 2. Trigger WF04 (Structure Generation)
            const res = await fetch('/api/webhook/generate-structure-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    sourceIds,
                    action: 'append',
                    generation_method: 'ai_gen'
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to trigger AI generation");
            }

            toast.success("Structure Generation Started", { description: "AI is creating chapters..." });

            // Wait for DB updates and refresh
            setTimeout(() => {
                fetchData();
                setGenerating(false);
                toast.success("Structure Updated");
            }, 5000);

        } catch (error: any) {
            console.error("WF04 Trigger Failed:", error);
            toast.error("Generation Failed", { description: error.message });
            setGenerating(false);
        }
    };

    const handleGenerateTasks = async (sectionId: string, sectionTitle: string, mode: 'function' | 'content' = 'function') => {
        // Check for existing tasks to show conflict dialog
        const section = outline.flatMap(c => c.sections).find(s => s.id === sectionId);
        if (section && section.tasks && section.tasks.length > 0) {
            setTaskGenerationContext({ sectionId, sectionTitle, mode });
            setIsTaskModeDialogOpen(true);
            return;
        }

        // Open Source Selection directly
        setSourceSelectionContext({
            type: 'task',
            data: { sectionId, sectionTitle, mode },
            next: (sourceIds) => executeTaskGeneration(sectionId, sectionTitle, mode, 'append_only', sourceIds)
        });
        setIsSourceSelectionOpen(true);
    };

    const handleTaskModeConfirm = async (conflictMode: 'replace_all' | 'append_only') => {
        if (!taskGenerationContext) return;
        setIsTaskModeDialogOpen(false);
        const { sectionId, sectionTitle, mode } = taskGenerationContext;

        // After Conflict Mode -> Source Selection
        setSourceSelectionContext({
            type: 'task',
            data: { sectionId, sectionTitle, mode, conflictMode },
            next: (sourceIds) => executeTaskGeneration(sectionId, sectionTitle, mode, conflictMode, sourceIds)
        });
        setIsSourceSelectionOpen(true);
        setTaskGenerationContext(null);
    };

    const executeTaskGeneration = async (sectionId: string, sectionTitle: string, mode: 'function' | 'content', conflictMode: 'replace_all' | 'append_only', sourceIds: string[]) => {
        setGenerating(true);
        console.log(`[TenderPlanning] Generating tasks for: ${sectionTitle} (${sectionId}) Mode: ${mode} Conflict: ${conflictMode}`);
        try {
            // 1. Handle "Replace" mode -> Delete existing tasks first
            if (conflictMode === 'replace_all') {
                const { error: deleteError } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('section_id', sectionId);

                if (deleteError) throw deleteError;
            }

            // 2. Pass sourceIds to webhook
            if (sourceIds.length === 0) {
                toast.error("No sources selected", { description: "Please select at least one source." });
                setGenerating(false);
                return;
            }

            // 3. Prepare context (all chapter titles)
            const allSections = outline.map(c => c.title);

            // 4. Trigger WF11 or WF13 based on mode
            const endpoint = mode === 'function' ? '/api/webhook/generate-tasks-advanced' : '/api/webhook/generate-tasks-management';
            console.log(`[TenderPlanning] POST ${endpoint} with ${sourceIds.length} sources:`, sourceIds);
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    sectionId,
                    sectionTitle,
                    sourceIds,
                    allSections
                })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to trigger task generation");
            }

            toast.success("Task Generation Started", {
                description: mode === 'function'
                    ? `AI is designing function specs (WF11) using ${sourceIds.length} sources...`
                    : `AI is designing content draft (WF13) using ${sourceIds.length} sources...`
            });

            // Wait for DB updates and refresh
            setTimeout(() => {
                fetchData();
                setGenerating(false);
                toast.success("Tasks Updated", { description: "New tasks have been added to the section." });
            }, 5000);

        } catch (error: any) {
            console.error("Task Gen Failed:", error);
            toast.error("Task Generation Failed", { description: error.message });
            setGenerating(false);
        }
    };

    // Loading state is handled by page-level loading.tsx
    return (
        <div className="h-full w-full">
            <div className="flex w-full min-h-full gap-8 relative font-mono text-black dark:text-white pb-20">
                {/* Main Content Area */}
                <div className="flex-1">

                    {/* Sticky Header Container */}
                    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-4 pb-0 mb-4 border-b border-black/5 dark:border-white/5 transition-all duration-300">

                        {/* Collapse Toggle Button */}
                        <div className="absolute top-4 right-8 z-30">
                            <button
                                onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                            >
                                {isHeaderExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-black/40 dark:text-white/40" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-black/40 dark:text-white/40" />
                                )}
                            </button>
                        </div>

                        {/* Collapsible Title Area */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isHeaderExpanded ? 'max-h-[200px] opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0'}`}>
                            <div className="flex flex-col items-center">
                                <div className="relative inline-flex items-center">
                                    {/* Back Navigation Arrow */}
                                    {onPrevStage && (
                                        <div className="absolute -left-20 top-1/2 -translate-y-1/2">
                                            <button
                                                onClick={onPrevStage}
                                                className="group relative w-12 h-12 border-2 border-black dark:border-white bg-white dark:bg-black transition-all hover:translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] active:shadow-none flex items-center justify-center overflow-hidden"
                                            >
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    className="w-6 h-6 fill-none stroke-black dark:stroke-white stroke-[3] transition-transform group-hover:-translate-x-1"
                                                >
                                                    <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="square" strokeLinejoin="miter" />
                                                </svg>
                                                <div className="absolute inset-0 bg-[#FA4028] translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10 opacity-10" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="bg-[#FA4028] text-white px-10 py-4 flex flex-col items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]">
                                        <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                                            PROPOSAL_PLANNING
                                        </h2>
                                    </div>

                                    {/* Next Navigation Arrow */}
                                    {onNextStage && (
                                        <div className="absolute -right-20 top-1/2 -translate-y-1/2">
                                            <button
                                                onClick={onNextStage}
                                                className="group relative w-12 h-12 border-2 border-black dark:border-white bg-white dark:bg-black transition-all hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] active:shadow-none flex items-center justify-center overflow-hidden"
                                            >
                                                {/* Custom Brutalist Arrow SVG */}
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    className="w-6 h-6 fill-none stroke-black dark:stroke-white stroke-[3] transition-transform group-hover:translate-x-1"
                                                >
                                                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="square" strokeLinejoin="miter" />
                                                </svg>

                                                {/* Glitch Effect Element */}
                                                <div className="absolute inset-0 bg-[#FA4028] translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10 opacity-10" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <p className="mt-4 text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">
                                    Stage 03 // Structure Definition & Strategy
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex justify-end mb-8 max-w-4xl mx-auto">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-none bg-black text-white hover:bg-[#FA4028] dark:bg-white dark:text-black dark:hover:bg-[#FA4028] transition-colors border-2 border-transparent hover:border-black font-bold uppercase tracking-wider"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    SAVING...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    SAVE_STRUCTURE
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Editable Outline Card */}
                    <div className="max-w-4xl mx-auto pb-12">
                        <Card className="rounded-none border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
                            <CardHeader className="border-b border-black dark:border-white bg-black/5 dark:bg-white/5 py-4">
                                <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                    <GripVertical className="h-5 w-5 opacity-40" />
                                    SERVICE_PROPOSAL_OUTLINE
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={outline.map(c => c.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {outline.map((chapter, cIndex) => (
                                            <SortableChapterItem
                                                key={chapter.id || cIndex}
                                                chapter={chapter}
                                                cIndex={cIndex}
                                                toggleChapter={toggleChapter}
                                                updateChapterTitle={updateChapterTitle}
                                                handleGenerateTasks={handleGenerateTasks}
                                                generating={generating}
                                                deleteChapter={deleteChapter}
                                                toggleSectionTasks={toggleSectionTasks}
                                                updateSectionTitle={updateSectionTitle}
                                                deleteSection={deleteSection}
                                                handleAddSectionClick={handleAddSectionClick}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>

                                {/* Add Chapter Button (Updated) */}
                                <Button
                                    variant="outline"
                                    onClick={handleAddChapterClick}
                                    disabled={generating}
                                    className="w-full py-6 border-dashed border-2 border-black/20 hover:border-[#FA4028] hover:bg-[#FA4028] hover:text-white rounded-none uppercase tracking-widest font-bold"
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            GENERATING_STRUCTURE...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-5 w-5 mr-2" />
                                            ADD_NEW_CHAPTER
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <AddChapterMethodDialog
                open={isMethodDialogOpen}
                onOpenChange={setIsMethodDialogOpen}
                onSelectMethod={handleMethodSelect}
                title={methodDialogContext === 'chapter' ? 'ADD_NEW_CHAPTER' : 'ADD_NEW_SECTION'}
                context={methodDialogContext}
            />

            <GenerationModeDialog
                open={isGenerationModeDialogOpen}
                onOpenChange={setIsGenerationModeDialogOpen}
                onConfirm={handleGenerationModeConfirm}
            />

            <TemplateUploadDialog
                open={isTemplateDialogOpen}
                onClose={() => setIsTemplateDialogOpen(false)}
                projectId={projectId}
                onSuccess={fetchData}
            />

            <GenerationModeDialog
                open={isTaskModeDialogOpen}
                onOpenChange={setIsTaskModeDialogOpen}
                onConfirm={handleTaskModeConfirm}
                title="TASK_GENERATION_MODE"
                description="Existing tasks detected. Choose how to proceed with AI generation."
                itemLabel="任務"
            />

            <SourceSelectionDialog
                open={isSourceSelectionOpen}
                onOpenChange={setIsSourceSelectionOpen}
                projectId={projectId}
                onConfirm={handleSourceSelectionConfirm}
            />
        </div>
    );
}

// --- Sortable Components ---

interface SortableChapterItemProps {
    chapter: Chapter;
    cIndex: number;
    toggleChapter: (index: number) => void;
    updateChapterTitle: (index: number, title: string) => void;
    handleGenerateTasks: (id: string, title: string, mode: 'function' | 'content') => void;
    generating: boolean;
    deleteChapter: (index: number) => void;
    toggleSectionTasks: (cIndex: number, sIndex: number) => void;
    updateSectionTitle: (cIndex: number, sIndex: number, title: string) => void;
    deleteSection: (cIndex: number, sIndex: number) => void;
    handleAddSectionClick: (chapterIndex: number) => void;
}

function SortableChapterItem({
    chapter,
    cIndex,
    toggleChapter,
    updateChapterTitle,
    handleGenerateTasks,
    generating,
    deleteChapter,
    toggleSectionTasks,
    updateSectionTitle,
    deleteSection,
    handleAddSectionClick
}: SortableChapterItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: chapter.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group/chapter relative pl-4 border-l-2 border-black/10 dark:border-white/10 hover:border-[#FA4028] transition-colors"
        >
            {/* Chapter Row */}
            <div className="flex items-center gap-4 mb-4">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 opacity-100 text-black/20 dark:text-white/20 shrink-0" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-40 block">Chapter {cIndex + 1}</label>
                        <GenerationBadge
                            method={chapter.generation_method}
                            isModified={chapter.is_modified}
                        />
                    </div>
                    <Input
                        value={chapter.title}
                        onChange={(e) => updateChapterTitle(cIndex, e.target.value)}
                        className="font-bold text-lg rounded-none border-x-0 border-t-0 border-b-2 border-black/20 focus:border-[#FA4028] bg-transparent px-0 h-auto py-1 focus:ring-0"
                    />
                </div>
                <div className="flex items-center gap-1">
                    {/* Chapter Toggle Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleChapter(cIndex)}
                        className="h-6 w-6 rounded-none hover:bg-zinc-100 mt-4"
                        title={chapter.expanded ? "Hide Sections" : "Show Sections"}
                    >
                        {chapter.expanded ? (
                            <ChevronUp className="h-3 w-3" />
                        ) : (
                            <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold">{chapter.sections?.length || 0}</span>
                                <ChevronDown className="h-3 w-3" />
                            </div>
                        )}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-none data-[state=open]:bg-zinc-100 opacity-0 group-hover/chapter:opacity-100 transition-opacity mt-4"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)]">
                            <DropdownMenuLabel className="text-[10px] uppercase font-bold text-zinc-500">Chapter Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => handleGenerateTasks(chapter.id, chapter.title, 'function')}
                                disabled={generating}
                                className="focus:bg-blue-50 focus:text-blue-600 cursor-pointer font-bold text-xs py-2"
                            >
                                <Database className={cn("mr-2 h-3 w-3", generating && "animate-spin")} />
                                FUNCTIONAL DESIGN (WF11)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleGenerateTasks(chapter.id, chapter.title, 'content')}
                                disabled={generating}
                                className="focus:bg-purple-50 focus:text-purple-600 cursor-pointer font-bold text-xs py-2"
                            >
                                <FileText className={cn("mr-2 h-3 w-3", generating && "animate-spin")} />
                                ARTICLE DESIGN (WF13)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => deleteChapter(cIndex)}
                                className="focus:bg-red-50 focus:text-red-500 cursor-pointer font-bold text-xs py-2"
                            >
                                <Trash2 className="mr-2 h-3 w-3" />
                                DELETE CHAPTER
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Sections List */}
            {chapter.expanded && (
                <div className="pl-8 space-y-3">
                    <SortableContext
                        items={chapter.sections?.map(s => s.id) || []}
                        strategy={verticalListSortingStrategy}
                    >
                        {chapter.sections?.map((section, sIndex) => (
                            <SortableSectionItem
                                key={section.id || sIndex}
                                section={section}
                                chapterId={chapter.id}
                                chapterTitle={chapter.title}
                                cIndex={cIndex}
                                sIndex={sIndex}
                                toggleSectionTasks={toggleSectionTasks}
                                updateSectionTitle={updateSectionTitle}
                                deleteSection={deleteSection}
                                handleGenerateTasks={handleGenerateTasks}
                                generating={generating}
                            />
                        ))}
                    </SortableContext>

                    {/* Add Section Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddSectionClick(cIndex)}
                        className="h-8 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-[#FA4028] hover:bg-transparent pl-0 mt-2"
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Section
                    </Button>
                </div>
            )}
        </div>
    );
}

interface SortableSectionItemProps {
    section: Section;
    chapterId: string;
    chapterTitle: string;
    cIndex: number;
    sIndex: number;
    toggleSectionTasks: (cIndex: number, sIndex: number) => void;
    updateSectionTitle: (cIndex: number, sIndex: number, title: string) => void;
    deleteSection: (cIndex: number, sIndex: number) => void;
    handleGenerateTasks: (id: string, title: string, mode: 'function' | 'content') => void;
    generating: boolean;
}

function SortableSectionItem({
    section,
    chapterId,
    chapterTitle,
    cIndex,
    sIndex,
    toggleSectionTasks,
    updateSectionTitle,
    deleteSection,
    handleGenerateTasks,
    generating
}: SortableSectionItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group/section pl-4 border-l border-black/5 dark:border-white/5 pb-2"
        >
            <div className="flex items-center gap-3 mb-1">
                <div className="w-1.5 h-1.5 bg-black/20 dark:bg-white/20 rounded-none transform rotate-45 shrink-0" />
                <label className="text-[9px] font-bold uppercase tracking-wider opacity-40">Section {cIndex + 1}.{sIndex + 1}</label>
                <GenerationBadge
                    method={section.generation_method}
                    isModified={section.is_modified}
                    compact
                />
            </div>
            <div className="flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-3 w-3 opacity-100 text-black/10 dark:text-white/10 shrink-0" />
                </div>
                <Input
                    value={section.title}
                    onChange={(e) => updateSectionTitle(cIndex, sIndex, e.target.value)}
                    className="flex-1 text-sm rounded-none border-x-0 border-t-0 border-b border-black/10 focus:border-[#FA4028] bg-transparent px-0 h-8 focus:ring-0"
                />
                <div className="flex items-center gap-1">
                    {/* Task Toggle Button */}
                    {section.tasks && section.tasks.length > 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleSectionTasks(cIndex, sIndex)}
                            className="h-6 w-6 rounded-none hover:bg-zinc-100"
                            title={section.expanded ? "Hide Tasks" : "Show Tasks"}
                        >
                            {section.expanded ? (
                                <ChevronUp className="h-3 w-3" />
                            ) : (
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-bold">{section.tasks.length}</span>
                                    <ChevronDown className="h-3 w-3" />
                                </div>
                            )}
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-none data-[state=open]:bg-zinc-100 opacity-0 group-hover/section:opacity-100 transition-opacity"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)]">
                            <DropdownMenuLabel className="text-[10px] uppercase font-bold text-zinc-500">Task Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => handleGenerateTasks(section.id, section.title, 'function')}
                                disabled={generating}
                                className="focus:bg-blue-50 focus:text-blue-600 cursor-pointer font-bold text-xs py-2"
                            >
                                <Database className={cn("mr-2 h-3 w-3", generating && "animate-spin")} />
                                FUNCTIONAL DESIGN (WF11)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleGenerateTasks(section.id, section.title, 'content')}
                                disabled={generating}
                                className="focus:bg-purple-50 focus:text-purple-600 cursor-pointer font-bold text-xs py-2"
                            >
                                <FileText className={cn("mr-2 h-3 w-3", generating && "animate-spin")} />
                                ARTICLE DESIGN (WF13)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => deleteSection(cIndex, sIndex)}
                                className="focus:bg-red-50 focus:text-red-500 cursor-pointer font-bold text-xs py-2"
                            >
                                <Trash2 className="mr-2 h-3 w-3" />
                                DELETE SECTION
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Task List (Collapsible) */}
            {section.expanded && section.tasks && section.tasks.length > 0 && (
                <div className="mt-2 ml-7 space-y-2 border-l border-zinc-200 pl-2">
                    {section.tasks.map((task) => (
                        <TaskItem key={task.id} task={task} />
                    ))}
                </div>
            )}
        </div>
    );
}
