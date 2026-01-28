/**
 * SortableSectionItem Component
 *
 * A draggable, sortable section item within a chapter.
 * Displays section title, tasks, and provides CRUD operations.
 */

import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown, MoreVertical, Trash2, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { GenerationBadge } from "./GenerationBadge";
import { TaskItem } from "./TaskItem";
import type { Section, TaskGenerationMode } from "../types";

interface SortableSectionItemProps {
    /** Section data */
    section: Section;
    /** Parent chapter ID */
    chapterId: string;
    /** Parent chapter title for context */
    chapterTitle: string;
    /** Chapter index in outline */
    cIndex: number;
    /** Section index within chapter */
    sIndex: number;
    /** Toggle task list visibility */
    toggleSectionTasks: (cIndex: number, sIndex: number) => void;
    /** Update section title */
    updateSectionTitle: (cIndex: number, sIndex: number, title: string) => void;
    /** Delete this section */
    deleteSection: (cIndex: number, sIndex: number) => void;
    /** Generate tasks for this section */
    handleGenerateTasks: (id: string, title: string, mode: TaskGenerationMode) => void;
    /** Whether AI generation is in progress */
    generating: boolean;
    taskFilter: 'all' | 'wf11_functional' | 'wf13_article';
    handleGenerateContent: (task: any, section: any) => void;
    handleGenerateSectionContent: (section: any) => void;
    handleGenerateImage: (task: any) => void;
}

/**
 * Draggable section item with task management
 */
function SortableSectionItemComponent({
    section,
    chapterId,
    chapterTitle,
    cIndex,
    sIndex,
    toggleSectionTasks,
    updateSectionTitle,
    deleteSection,
    handleGenerateTasks,
    generating,
    taskFilter,
    handleGenerateContent,
    handleGenerateSectionContent,
    handleGenerateImage
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
                                onClick={() => handleGenerateSectionContent(section)}
                                disabled={generating || !section.tasks || section.tasks.length === 0}
                                className="focus:bg-orange-50 focus:text-orange-600 cursor-pointer font-bold text-xs py-2"
                            >
                                <FileText className={cn("mr-2 h-3 w-3", generating && "animate-spin")} />
                                BATCH CONTENT GENERATION (WF12)
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
                    {section.tasks.filter(task => {
                        if (taskFilter === 'all') return true;
                        if (taskFilter === 'wf11_functional') return task.workflow_type === 'wf11_functional';
                        if (taskFilter === 'wf13_article') return task.workflow_type === 'wf13_article';
                        return true;
                    }).map((task) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            section={section}
                            handleGenerateContent={handleGenerateContent}
                            handleGenerateImage={handleGenerateImage}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Memoized SortableSectionItem to reduce re-renders
 * Only updates when section data or state changes
 */
export const SortableSectionItem = memo(
    SortableSectionItemComponent,
    (prevProps, nextProps) => {
        const { section: prevSection, cIndex: prevCIndex, sIndex: prevSIndex, generating: prevGenerating, taskFilter: prevFilter } = prevProps;
        const { section: nextSection, cIndex: nextCIndex, sIndex: nextSIndex, generating: nextGenerating, taskFilter: nextFilter } = nextProps;

        // Check filter
        if (prevFilter !== nextFilter) return false;

        // Check section identity and core properties
        if (prevSection.id !== nextSection.id) return false;
        if (prevSection.title !== nextSection.title) return false;
        if (prevSection.expanded !== nextSection.expanded) return false;
        if (prevSection.generation_method !== nextSection.generation_method) return false;
        if (prevSection.is_modified !== nextSection.is_modified) return false;

        // Check indices
        if (prevCIndex !== nextCIndex || prevSIndex !== nextSIndex) return false;

        // Check generating state
        if (prevGenerating !== nextGenerating) return false;

        if ((prevSection.tasks?.length || 0) !== (nextSection.tasks?.length || 0)) return false;

        return true;
    }
);
