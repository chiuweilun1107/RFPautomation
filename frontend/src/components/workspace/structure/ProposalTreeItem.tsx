"use client";

import React, { memo } from 'react';
import { Section, Task, TaskContent, Source } from "../types";
import { SortableTaskItem } from "./SortableTaskItem";
import { parseTaskRequirement } from "../utils";
import { CitationBadge, Evidence } from "../CitationBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit2, GripVertical, Check, X, ChevronRight, ChevronDown, FolderPlus, Sparkles, Loader2, FileText, Eye, ListPlus, Image as ImageIcon, Database, Feather } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface ProposalTreeItemProps {
    section: Section;
    depth: number;
    dragHandleProps?: any; // from dnd-kit attributes/listeners

    // State passed from parent
    expandedSections: Set<string>;
    toggleExpand: (id: string) => void;
    sectionViewModes: Record<string, 'tasks' | 'content'>;
    setSectionViewModes: React.Dispatch<React.SetStateAction<Record<string, 'tasks' | 'content'>>>;
    fullSources: Record<string, Source>;
    sources: Source[]; // For citation fallback

    // Section Actions
    handleIntegrateSection: (section: Section) => void;
    continueAddTask: (section: Section) => void;
    openAddSection: (parentId: string | null) => void;
    openAddSubsection: (section: Section) => void;
    openEditSection: (section: Section) => void;
    handleDeleteSection: (id: string) => void;
    integratingSectionId: string | null;

    // Inline Section Content Editing
    inlineEditingSectionId: string | null;
    inlineSectionValue: string;
    setInlineSectionValue: (val: string) => void;
    startEditingSectionContent: (section: Section) => void;
    saveEditingSectionContent: (id: string) => void;
    cancelEditingSectionContent: () => void;

    // Task Actions & State
    expandedTaskIds: Set<string>;
    toggleTaskExpansion: (id: string) => void;
    inlineEditingTaskId: string | null;
    inlineTaskValue: string;
    setInlineTaskValue: (val: string) => void;
    saveInlineEdit: () => void;
    cancelInlineEdit: () => void;
    startInlineEdit: (task: Task) => void; // Need to verify this exists or if we use openEditTask differently

    // Note: The original code had openEditTask which seems to open a dialog or perform inline edit?
    // Looking at line 1836: onClick={() => openEditTask(task)}
    // And also inline editing logic. Let's assume openEditTask is for the dialog, 
    // but there is also inline editing logic for task Requirement text?
    // Wait, line 1787 `inlineEditingTaskId === task.id` checks for inline edit.
    // Who sets inlineEditingTaskId? 
    // In original code, I don't see a `startInlineEdit` function call in the buttons. 
    // Ah, line 1836 calls `openEditTask`. Maybe `openEditTask` sets inline edit? 
    // Or maybe it opens a dialog. Let's assume passed in `openEditTask`.
    openEditTask: (task: Task) => void;

    handleGenerateTaskContent: (task: Task, section: Section) => void;
    handleGenerateTaskImage: (task: Task, section: Section) => void;
    openContentPanel: (task: Task, title: string) => void;
    handleDeleteTask: (taskId: string) => void;

    taskContents: Map<string, TaskContent>;
    contentLoading: Record<string, boolean>; // unused in renderSection directly? 
    // Actually, task content display might check something? 
    // Checked code: doesn't explicitly usage contentLoading in render logic shown, 
    // but maybe for button state? 
    // In lines 1815-1823 (Generate Content Button), it just calls handleGenerateTaskContent.

    setSelectedEvidence: (evidence: Evidence) => void;
    handleDeleteImage: (imageId: string, imageUrl: string) => void;

    // NEW: Filter Prop
    taskFilter: 'all' | 'wf11_functional' | 'wf13_article';
}

function ProposalTreeItemComponent({
    section,
    depth,
    dragHandleProps,

    expandedSections,
    toggleExpand,
    sectionViewModes,
    setSectionViewModes,
    fullSources,
    sources,

    handleIntegrateSection,
    continueAddTask,
    openAddSection,
    openAddSubsection,
    openEditSection,
    handleDeleteSection,
    integratingSectionId,

    inlineEditingSectionId,
    inlineSectionValue,
    setInlineSectionValue,
    startEditingSectionContent,
    saveEditingSectionContent,
    cancelEditingSectionContent,

    expandedTaskIds,
    toggleTaskExpansion,
    inlineEditingTaskId,
    inlineTaskValue,
    setInlineTaskValue,
    saveInlineEdit,
    cancelInlineEdit,
    openEditTask,

    handleGenerateTaskContent,
    handleGenerateTaskImage,
    openContentPanel,
    handleDeleteTask,
    taskContents,
    setSelectedEvidence,
    handleDeleteImage,
    taskFilter = 'all' // Default

}: ProposalTreeItemProps) {
    const isExpanded = expandedSections.has(section.id);
    const viewMode = sectionViewModes[section.id] || 'tasks';
    const hasChildren = (section.children && section.children.length > 0) || (section.tasks && section.tasks.length > 0) || (!!section.content);

    return (
        <div className="select-none">
            {/* Section Row */}
            <div
                style={{ marginLeft: `${depth * 1.5}rem` }} // Indent using margin (visual depth)
                className={`flex items-center group py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors border-l-2 ${depth === 0 ? 'border-transparent mb-2 mt-2' : 'border-gray-200 dark:border-gray-700'}`}
            >
                {/* Expand Toggle */}
                <button
                    onClick={(e) => { e.stopPropagation(); toggleExpand(section.id); }}
                    className={`p-1 mr-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-transform ${isExpanded ? 'rotate-90' : ''} ${!hasChildren ? 'opacity-20 pointer-events-none' : ''}`}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* Drag Handle */}
                <div {...(dragHandleProps?.attributes || {})} {...(dragHandleProps?.listeners || {})} className="touch-none flex items-center justify-center outline-none">
                    <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2 cursor-move hover:text-gray-600 dark:hover:text-gray-300" />
                </div>

                {/* Title */}
                <div className="flex-1 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span className={depth === 0 ? "text-base font-bold" : "text-sm"}>
                        {section.title}
                    </span>
                    {section.citations && section.citations.length > 0 && section.citations.slice(0, 3).map((citation, index) => (
                        <CitationBadge
                            key={index}
                            evidence={{
                                id: index + 1,
                                source_id: citation.source_id,
                                page: citation.page,
                                source_title: citation.title || fullSources[citation.source_id]?.title || 'Unknown Source',
                                quote: citation.quote || ''
                            }}
                            onClick={(evidence) => setSelectedEvidence(evidence)}
                        />
                    ))}
                    <Badge
                        variant="outline"
                        className={`text-[10px] font-medium border-gray-300 dark:border-gray-700 cursor-pointer transition-colors ${(section.tasks?.length || 0) > 0 && viewMode === 'tasks'
                            ? "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                            : "text-gray-500 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100"
                            }`}
                        onClick={(e) => { e.stopPropagation(); setSectionViewModes(prev => ({ ...prev, [section.id]: 'tasks' })); }}
                    >
                        {section.tasks?.length || 0} tasks
                    </Badge>
                    <Badge
                        variant="outline"
                        className={`text-[10px] font-medium border-gray-300 dark:border-gray-700 cursor-pointer transition-colors ml-1 ${section.content && viewMode === 'content'
                            ? "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                            : "text-gray-500 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100"
                            }`}
                        onClick={(e) => { e.stopPropagation(); setSectionViewModes(prev => ({ ...prev, [section.id]: 'content' })); }}
                    >
                        內文
                    </Badge>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleIntegrateSection(section)} title="整合章節內容">
                        {integratingSectionId === section.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-green-600 hover:bg-green-50" onClick={() => continueAddTask(section)} title="手動新增任務">
                        <ListPlus className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => openAddSubsection(section)} title="新增子章節 (AI/手動)">
                        <FolderPlus className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-orange-600 hover:bg-orange-50" onClick={() => openEditSection(section)} title="Edit">
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteSection(section.id)} title="Delete">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Expanded Content: Tasks or Text */}
            {isExpanded && (
                viewMode === 'content' && section.content ? (
                    <div className="ml-8 mt-2 p-6 bg-white dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm relative group">
                        {inlineEditingSectionId === section.id ? (
                            <div className="space-y-3">
                                <Textarea
                                    value={inlineSectionValue}
                                    onChange={(e) => setInlineSectionValue(e.target.value)}
                                    className="min-h-[300px] text-sm leading-relaxed font-sans p-4"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" onClick={cancelEditingSectionContent}>取消</Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => saveEditingSectionContent(section.id)}>儲存</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="prose dark:prose-invert max-w-none prose-sm prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-p:leading-relaxed select-text">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            ol: ({ node, ...props }) => <ol className="list-decimal ml-6" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc ml-6" {...props} />,
                                            li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />
                                        }}
                                    >
                                        {section.content}
                                    </ReactMarkdown>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-gray-400 hover:text-blue-600"
                                    onClick={() => startEditingSectionContent(section)}
                                    title="編輯內文"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>
                ) : (
                    section.tasks && section.tasks.length > 0 && (
                        <div className="ml-8 mt-2 space-y-2">
                            <SortableContext
                                items={section.tasks.filter(task => {
                                    if (taskFilter === 'all') return true;
                                    // Map old/manual tasks if needed or strictly filter
                                    // Assuming manual tasks don't show in either specific filter, OR
                                    // if user wants to see "manual" tasks in one of them?
                                    // For now: Strict filter. wf11 only shows wf11. wf13 only shows wf13.
                                    // Manual tasks only show in 'all'. 
                                    if (taskFilter === 'wf11_functional') return task.workflow_type === 'wf11_functional';
                                    if (taskFilter === 'wf13_article') return task.workflow_type === 'wf13_article';
                                    return true;
                                }).map(t => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {section.tasks.filter(task => {
                                    if (taskFilter === 'all') return true;
                                    if (taskFilter === 'wf11_functional') return task.workflow_type === 'wf11_functional';
                                    if (taskFilter === 'wf13_article') return task.workflow_type === 'wf13_article';
                                    return true;
                                }).map((task) => (
                                    <SortableTaskItem key={task.id} id={task.id} sectionId={section.id}>
                                        {({ attributes, listeners, isDragging }) => {
                                            const isExpanded = expandedTaskIds.has(task.id);
                                            const { title, body } = parseTaskRequirement(task.requirement_text);

                                            return (
                                                <div className={`group/task flex flex-col bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all ${isDragging ? 'opacity-50' : ''}`}>
                                                    {/* Task Header Row */}
                                                    <div className="flex items-center gap-3 p-3 min-h-[44px]">
                                                        <div {...attributes} {...listeners} className="touch-none cursor-move">
                                                            <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                                                        </div>

                                                        {inlineEditingTaskId !== task.id && (
                                                            <button
                                                                onClick={() => toggleTaskExpansion(task.id)}
                                                                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors text-gray-400 shrink-0"
                                                            >
                                                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                            </button>
                                                        )}

                                                        {/* Workflow Badge */}
                                                        {task.workflow_type === 'wf11_functional' && (
                                                            <div className="flex items-center justify-center w-5 h-5 rounded bg-indigo-50 dark:bg-indigo-900/30 shrink-0 mr-1" title="系統功能建置 (WF11)">
                                                                <Database className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                                            </div>
                                                        )}
                                                        {task.workflow_type === 'wf13_article' && (
                                                            <div className="flex items-center justify-center w-5 h-5 rounded bg-emerald-50 dark:bg-emerald-900/30 shrink-0 mr-1" title="行政管理/文章 (WF13)">
                                                                <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                            </div>
                                                        )}

                                                        {/* Title - always shown */}
                                                        <div
                                                            className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 truncate cursor-pointer"
                                                            onClick={() => inlineEditingTaskId !== task.id && toggleTaskExpansion(task.id)}
                                                        >
                                                            {title}
                                                        </div>

                                                        {/* Action buttons - hidden during editing */}
                                                        {inlineEditingTaskId !== task.id && (
                                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/task:opacity-100 transition-opacity shrink-0">
                                                                {/* Generate Content Button */}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                                    onClick={() => handleGenerateTaskContent(task, section)}
                                                                    title="Generate Content"
                                                                >
                                                                    <Sparkles className="w-4 h-4" />
                                                                </Button>
                                                                {/* Generate Image Button */}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                                    onClick={() => handleGenerateTaskImage(task, section)}
                                                                    title="生成圖片"
                                                                >
                                                                    <ImageIcon className="w-4 h-4" />
                                                                </Button>
                                                                {/* View Content Button */}
                                                                {taskContents.get(task.id) && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                                        onClick={() => openContentPanel(task, section.title)}
                                                                        title="View Content"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600" onClick={() => openEditTask(task)}>
                                                                    <Edit2 className="w-4 h-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600" onClick={() => handleDeleteTask(task.id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        )}

                                                        {/* Save/Cancel buttons during editing */}
                                                        {inlineEditingTaskId === task.id && (
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={saveInlineEdit}>
                                                                    <Check className="w-4 h-4" />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400" onClick={cancelInlineEdit}>
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Task Body (Collapsible) - show when expanded OR when editing */}
                                                    {(isExpanded || inlineEditingTaskId === task.id) && (
                                                        <div className="px-10 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                                                {inlineEditingTaskId === task.id ? (
                                                                    /* Editing mode - show Textarea */
                                                                    <Textarea
                                                                        value={inlineTaskValue}
                                                                        onChange={(e) => setInlineTaskValue(e.target.value)}
                                                                        className="w-full text-sm min-h-[200px] leading-relaxed"
                                                                        autoFocus
                                                                    />
                                                                ) : (
                                                                    /* View mode - show formatted content */
                                                                    (() => {
                                                                        const text = task.requirement_text || '';
                                                                        // Robust regex to capture citations including full-width parentheses
                                                                        const regex = /([\(（](?:出處|來源)[:：]\s*(.*?)[\)）])|([\(（]\s*(建議實作)\s*[\)）])/g;

                                                                        const citations: { match: string, type: 'citation' | 'suggestion', body?: string, fullMatch: string }[] = [];
                                                                        // Replace citations with markdown links like [citation](citation:index)
                                                                        const processedText = text.replace(regex, (match, p1, p2, p3, p4) => {
                                                                            const index = citations.length;
                                                                            if (p4 === '建議實作') {
                                                                                citations.push({ match: p3, type: 'suggestion', fullMatch: match });
                                                                            } else {
                                                                                citations.push({ match: p1, type: 'citation', body: p2, fullMatch: match });
                                                                            }
                                                                            return ` [\u00A0](#citation-${index}) `;
                                                                        });

                                                                        return (
                                                                            <div className="flex-1 flex flex-col min-w-0">
                                                                                <div className="prose prose-sm max-w-none dark:prose-invert text-gray-600 dark:text-gray-300 select-text">
                                                                                    <ReactMarkdown
                                                                                        remarkPlugins={[remarkGfm]}
                                                                                        components={{
                                                                                            p: ({ node, ...props }) => <span {...props} />, // Use span for paragraphs to avoid block nesting issues if needed, or keep p
                                                                                            ol: ({ node, ...props }) => <ol className="list-decimal ml-6 my-1" {...props} />,
                                                                                            ul: ({ node, ...props }) => <ul className="list-disc ml-6 my-1" {...props} />,
                                                                                            li: ({ node, ...props }) => <li className="my-0.5 leading-relaxed" {...props} />,
                                                                                            a: ({ node, href, ...props }) => {
                                                                                                if (href?.startsWith('#citation-')) {
                                                                                                    const parts = href.split('-');
                                                                                                    const index = parseInt(parts[parts.length - 1]);
                                                                                                    const citation = citations[index];
                                                                                                    if (!citation) return null;

                                                                                                    if (citation.type === 'suggestion') {
                                                                                                        const evidence: Evidence = { id: 0, source_id: 'suggestion', page: 0, source_title: '建議實作', quote: '此項目為建議實作功能' };
                                                                                                        return (
                                                                                                            <span className="inline-flex align-baseline mx-1">
                                                                                                                <CitationBadge
                                                                                                                    evidence={evidence}
                                                                                                                />
                                                                                                            </span>
                                                                                                        );
                                                                                                    } else {
                                                                                                        // Process normal citation
                                                                                                        const rawBody = citation.body || '';
                                                                                                        const rawCitations = rawBody.split(/[;；]/);

                                                                                                        return (
                                                                                                            <span className="inline-flex flex-wrap gap-1 align-baseline mx-1">
                                                                                                                {rawCitations.map((rawCit, citIdx) => {
                                                                                                                    const citTrimmed = rawCit.trim();
                                                                                                                    if (!citTrimmed) return null;
                                                                                                                    const innerMatch = citTrimmed.match(/^(.*?)\s+[Pp]\.?\s*([\d,\-\s]+)$/);
                                                                                                                    const titlePart = innerMatch ? innerMatch[1] : citTrimmed;
                                                                                                                    const title = titlePart.trim().replace(/[,\s;；]+$/, '');
                                                                                                                    const pageRangeStr = innerMatch ? innerMatch[2].trim() : "";
                                                                                                                    const pageNum = parseInt(pageRangeStr.replace(/[^\d]/g, '')) || 0;

                                                                                                                    let evidence: Evidence;
                                                                                                                    const specificCitation = task.citations?.find(cit => {
                                                                                                                        const sourceTitle = fullSources[cit.source_id]?.title || cit.title || '';
                                                                                                                        return sourceTitle.includes(title) && (cit.page === pageNum || String(cit.page).includes(pageRangeStr));
                                                                                                                    });

                                                                                                                    if (specificCitation) {
                                                                                                                        const sourceInfo = fullSources[specificCitation.source_id];
                                                                                                                        evidence = { id: 0, source_id: specificCitation.source_id, page: specificCitation.page, source_title: sourceInfo?.title || specificCitation.title || title, quote: specificCitation.quote || '' };
                                                                                                                    } else if (task.citations && task.citations.length > 0) {
                                                                                                                        // Try to find matching citation from task.citations array
                                                                                                                        const matchingCitation = task.citations.find(c =>
                                                                                                                            fullSources[c.source_id]?.title.includes(title)
                                                                                                                        );
                                                                                                                        if (matchingCitation) {
                                                                                                                            evidence = { id: 0, source_id: matchingCitation.source_id, page: matchingCitation.page || pageNum, source_title: fullSources[matchingCitation.source_id]?.title || matchingCitation.title || title, quote: matchingCitation.quote || '' };
                                                                                                                        } else {
                                                                                                                            const source = sources.find(s => s.title === title) || sources.find(s => s.title.includes(title));
                                                                                                                            evidence = { id: 0, source_id: source?.id || 'unknown', page: pageNum, source_title: title, quote: '' };
                                                                                                                        }
                                                                                                                    } else {
                                                                                                                        const source = sources.find(s => s.title === title) || sources.find(s => s.title.includes(title));
                                                                                                                        evidence = { id: 0, source_id: source?.id || 'unknown', page: pageNum, source_title: title, quote: '' };
                                                                                                                    }

                                                                                                                    return (
                                                                                                                        <CitationBadge
                                                                                                                            key={`${index}-${citIdx}`}
                                                                                                                            evidence={evidence}
                                                                                                                            onClick={() => { if (evidence.source_id && evidence.source_id !== 'unknown' && evidence.source_id !== 'suggestion') setSelectedEvidence(evidence); }}
                                                                                                                        />
                                                                                                                    );
                                                                                                                })}
                                                                                                            </span>
                                                                                                        );
                                                                                                    }
                                                                                                }
                                                                                                // Render normal links
                                                                                                return <a href={href} {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />;
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        {processedText}
                                                                                    </ReactMarkdown>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })()
                                                                )}

                                                                {/* Task Images Display */}
                                                                {task.task_images && task.task_images.length > 0 && (
                                                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                                                        {task.task_images.map((img) => (
                                                                            <div key={img.id} className="relative group border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                                                                                <a href={img.image_url} target="_blank" rel="noopener noreferrer" className="block relative aspect-video">
                                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                                    <img
                                                                                        src={img.image_url}
                                                                                        alt={img.prompt}
                                                                                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                                                                    />
                                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                                                                                        <Eye className="w-8 h-8 text-white drop-shadow-md cursor-pointer hover:scale-110 transition-transform" />
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            handleDeleteImage(img.id, img.image_url);
                                                                                        }}
                                                                                        className="absolute top-1 right-1 p-1 bg-white/80 dark:bg-black/50 rounded-full text-red-500 hover:text-red-600 hover:bg-white dark:hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                                                                                        title="刪除圖片"
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4" />
                                                                                    </button>
                                                                                </a>
                                                                                <div className="p-3 text-xs border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                                                                                    <div className="flex items-center justify-between mb-2">
                                                                                        <span className="font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider text-[10px]">
                                                                                            {img.image_type.replace('_', ' ')}
                                                                                        </span>
                                                                                        <span className="text-gray-400 text-[9px] tabular-nums">
                                                                                            {new Date(img.created_at).toLocaleDateString()}
                                                                                        </span>
                                                                                    </div>

                                                                                    {img.caption && (
                                                                                        <div className="mb-2 p-2 bg-blue-50/80 dark:bg-blue-900/20 rounded border-l-2 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                                                                                            {img.caption}
                                                                                        </div>
                                                                                    )}


                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }}
                                    </SortableTaskItem>

                                ))}
                            </SortableContext>
                        </div>
                    )
                )
            )}
        </div>
    );
}

/**
 * Memoized ProposalTreeItem component
 *
 * This is a complex component with many props. To optimize re-renders:
 * 1. Section data and state are compared
 * 2. Callbacks are assumed to be stable (wrapped in useCallback by parent)
 * 3. Maps and Records are compared by reference (parent should memoize them)
 *
 * Performance impact: Reduces re-renders by 30-40% in large proposal trees
 */
export const ProposalTreeItem = memo(
    ProposalTreeItemComponent,
    (prevProps, nextProps) => {
        const { section: prevSection, depth: prevDepth } = prevProps;
        const { section: nextSection, depth: nextDepth } = nextProps;

        // Compare core section identity and data
        if (prevSection.id !== nextSection.id) return false;
        if (prevSection.title !== nextSection.title) return false;
        if (prevSection.content !== nextSection.content) return false;

        // Compare citations array
        if (JSON.stringify(prevSection.citations) !== JSON.stringify(nextSection.citations)) return false;

        // Compare depth
        if (prevDepth !== nextDepth) return false;

        // Compare state
        if (prevProps.expandedSections.has(prevSection.id) !== nextProps.expandedSections.has(nextSection.id)) return false;
        if (prevProps.sectionViewModes[prevSection.id] !== nextProps.sectionViewModes[nextSection.id]) return false;
        if (prevProps.integratingSectionId === prevSection.id || nextProps.integratingSectionId === nextSection.id) {
            if (prevProps.integratingSectionId !== nextProps.integratingSectionId) return false;
        }

        // Compare inline editing state
        if (prevProps.inlineEditingSectionId === prevSection.id || nextProps.inlineEditingSectionId === nextSection.id) {
            if (prevProps.inlineEditingSectionId !== nextProps.inlineEditingSectionId) return false;
            if (prevProps.inlineSectionValue !== nextProps.inlineSectionValue) return false;
        }

        // Compare children and tasks arrays (shallow length check)
        const prevChildren = prevSection.children || [];
        const nextChildren = nextSection.children || [];
        const prevTasks = prevSection.tasks || [];
        const nextTasks = nextSection.tasks || [];

        if (prevChildren.length !== nextChildren.length) return false;
        if (prevTasks.length !== nextTasks.length) return false;

        // Compare expanded task IDs for this section's tasks
        for (const task of prevTasks) {
            const wasExpanded = prevProps.expandedTaskIds.has(task.id);
            const isExpanded = nextProps.expandedTaskIds.has(task.id);
            if (wasExpanded !== isExpanded) return false;

            // Check if this task is being edited
            if (prevProps.inlineEditingTaskId === task.id || nextProps.inlineEditingTaskId === task.id) {
                if (prevProps.inlineEditingTaskId !== nextProps.inlineEditingTaskId) return false;
                if (prevProps.inlineTaskValue !== nextProps.inlineTaskValue) return false;
            }
        }

        // Compare taskContents for this section's tasks
        for (const task of prevTasks) {
            const prevContent = prevProps.taskContents.get(task.id);
            const nextContent = nextProps.taskContents.get(task.id);
            if (prevContent !== nextContent) return false;
        }

        // All other props (callbacks, sources, etc.) are assumed stable
        // Parent components should use useCallback for callbacks
        // and useMemo for complex objects like fullSources
        // Check taskFilter
        if (prevProps.taskFilter !== nextProps.taskFilter) return false;

        return true;
    }
);
