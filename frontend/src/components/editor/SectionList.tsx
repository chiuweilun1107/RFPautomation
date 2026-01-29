"use client"

import * as React from "react"
import { CheckCircle2, Circle, ChevronDown, Sparkles, Loader2, Wand2, Edit3, FileText, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskEditorSheet } from "./TaskEditorSheet"
import { DraftEditor } from "./DraftEditor"
import ReactMarkdown from "react-markdown"
import { SourceDetailSheet } from "@/components/workspace/SourceDetailSheet"
import {
    useSectionListState,
    useSectionCardState,
    type Task,
    type DraftSource,
    type Section,
} from "./hooks/useSectionState"

interface SectionListProps {
    sections: Section[]
    projectId: string
}

export function SectionList({ sections, projectId }: SectionListProps) {
    const {
        selectedTask,
        isSheetOpen,
        handleEditTask,
        handleCloseSheet,
        handleTaskUpdated,
        expandedSections,
        toggleSection,
        generatingSectionId,
        handleGenerateDraft,
        selectedSource,
        isSourceDetailOpen,
        loadingSourceId,
        handleViewSource,
        handleCloseSourceDetail,
    } = useSectionListState()

    if (!sections || sections.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-black dark:border-white m-8 font-mono">
                <h3 className="mt-2 text-xl font-black uppercase tracking-tighter italic">No_Sections_Found</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest max-w-sm mx-auto mt-4">
                    The document parsing sequence is incomplete or no chapters were identified.
                    Awaiting further data ingestion.
                </p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4">
            {sections.map((section) => (
                <SectionCard
                    key={section.id}
                    section={section}
                    isExpanded={expandedSections.has(section.id)}
                    isGenerating={generatingSectionId === section.id}
                    onToggle={() => toggleSection(section.id)}
                    onGenerate={() => handleGenerateDraft(section, projectId)}
                    onEditTask={handleEditTask}
                    onViewSource={handleViewSource}
                    loadingSourceId={loadingSourceId}
                />
            ))}

            <TaskEditorSheet
                task={selectedTask}
                open={isSheetOpen}
                onOpenChange={handleCloseSheet}
                onTaskUpdated={handleTaskUpdated}
            />

            <SourceDetailSheet
                source={selectedSource}
                open={isSourceDetailOpen}
                onOpenChange={handleCloseSourceDetail}
            />
        </div>
    )
}

// 章节卡片组件
interface SectionCardProps {
    section: Section
    isExpanded: boolean
    isGenerating: boolean
    onToggle: () => void
    onGenerate: () => void
    onEditTask: (task: Task) => void
    onViewSource: (source: DraftSource) => void
    loadingSourceId: string | null
}

function SectionCard({
    section,
    isExpanded,
    isGenerating,
    onToggle,
    onGenerate,
    onEditTask,
    onViewSource,
    loadingSourceId,
}: SectionCardProps) {
    const {
        isEditing,
        setIsEditing,
        localDraft,
        setLocalDraft,
        localTemplateUrl,
        activeView,
        setActiveView,
        iframeKey,
        isRefreshing,
        isUploading,
        fileInputRef,
        hasDraft,
        hasTemplate,
        openEditorPage,
        refreshTemplatePreview,
        handleFileUpload,
    } = useSectionCardState({ section })

    return (
        <div className="border-2 border-black dark:border-white bg-white dark:bg-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.15)]">
            {/* Section Header */}
            <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                onClick={onToggle}
            >
                <div className="flex items-center gap-4">
                    <ChevronDown className={`h-5 w-5 text-black dark:text-white transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`} />
                    <h3 className="font-black text-lg uppercase tracking-tight italic">
                        {section.content || section.title}
                    </h3>
                    <div className="flex gap-2">
                        {hasDraft && (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#FA4028] bg-[#FA4028]/10 px-3 py-1">
                                <Sparkles className="w-3 h-3" />
                                DRAFT
                            </span>
                        )}
                        {hasTemplate && (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-100 px-3 py-1">
                                <FileText className="w-3 h-3" />
                                TEMPLATE
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Only show Edit button in Draft view */}
                    {hasDraft && activeView === 'draft' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-none border border-black/10 dark:border-white/10 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-bold uppercase text-[10px]"
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsEditing(!isEditing)
                            }}
                        >
                            <Edit3 className="w-3 h-3 mr-2" />
                            {isEditing ? 'COMMIT' : 'EDIT'}
                        </Button>
                    )}

                    <Button
                        size="sm"
                        variant={hasDraft ? "outline" : "default"}
                        onClick={(e) => {
                            e.stopPropagation()
                            onGenerate()
                        }}
                        disabled={isGenerating}
                        className={`rounded-none border-2 border-black dark:border-white font-black uppercase text-[10px] tracking-widest transition-all ${hasDraft
                            ? "bg-transparent hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                            : "bg-[#FA4028] text-white hover:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            }`}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                PROCESSING...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-3 h-3 mr-2" />
                                {hasDraft ? 'REGENERATE' : 'GENERATE_AI_DRAFT'}
                            </>
                        )}
                    </Button>

                    {/* Upload Template Button */}
                    <div className="relative">
                        <input
                            type="file"
                            accept=".docx"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation()
                                fileInputRef.current?.click()
                            }}
                            disabled={isUploading || isGenerating}
                            className="rounded-none border-2 border-dashed border-black dark:border-white font-bold uppercase text-[10px] tracking-widest bg-transparent hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black ml-2"
                        >
                            {isUploading ? (
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            ) : (
                                <Upload className="w-3 h-3 mr-2" />
                            )}
                            {isUploading ? 'UPLOADING...' : 'UPLOAD_DOCX'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="border-t-2 border-black/10 dark:border-white/10">

                    {/* Render Tabs if we have reasons to switch or clear indications */}
                    <div className="flex border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 pt-2 gap-2">
                        <button
                            onClick={() => setActiveView('draft')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-t-sm ${activeView === 'draft'
                                ? 'bg-white dark:bg-black border-x border-t border-black/10 dark:border-white/10 text-[#FA4028] translate-y-[1px]'
                                : 'text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                        >
                            AI_GENERATED_DRAFT
                        </button>
                        <button
                            onClick={() => setActiveView('template')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-t-sm ${activeView === 'template'
                                ? 'bg-white dark:bg-black border-x border-t border-black/10 dark:border-white/10 text-blue-600 translate-y-[1px]'
                                : 'text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                        >
                            UPLOADED_TEMPLATE
                        </button>
                    </div>

                    <div className="bg-white dark:bg-black min-h-[400px]">
                        {/* VIEW: AI DRAFT */}
                        {activeView === 'draft' && (
                            isEditing && hasDraft ? (
                                <div className="p-6">
                                    <DraftEditor
                                        sectionId={section.id}
                                        initialContent={localDraft}
                                        onSave={(content) => setLocalDraft(content)}
                                    />
                                </div>
                            ) : hasDraft ? (
                                <div className="p-6 bg-black/[0.02] dark:bg-white/[0.02]">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="w-4 h-4 text-[#FA4028]" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 dark:text-white/40">AI_GENERATED_CONTENT</span>
                                    </div>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-black dark:text-white bg-white dark:bg-black p-8 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                                        <ReactMarkdown>{localDraft}</ReactMarkdown>
                                    </div>
                                    {/* Sources */}
                                    {section.draft_sources && section.draft_sources.length > 0 && (
                                        <div className="mt-6 p-4 border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <FileText className="w-4 h-4 text-[#FA4028]" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">KNOWLEDGE_SOURCES ({section.draft_sources.length})</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {section.draft_sources.map((source, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => onViewSource(source)}
                                                        disabled={loadingSourceId === source.id}
                                                        className="inline-flex items-center px-3 py-1.5 rounded-none text-[10px] font-bold bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white hover:bg-[#FA4028] hover:text-white hover:border-[#FA4028] transition-all disabled:opacity-50"
                                                    >
                                                        {loadingSourceId === source.id ? (
                                                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                        ) : (
                                                            <span className="mr-2">doc</span>
                                                        )}
                                                        {source.title || source.source_title || `SOURCE_${idx + 1}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-12 text-center h-full flex flex-col justify-center items-center">
                                    <Wand2 className="w-10 h-10 mx-auto mb-4 opacity-10 text-black dark:text-white" />
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30">No_Draft_Generated</p>
                                    <p className="text-[8px] uppercase tracking-widest mt-2 opacity-20">Click GENERATE_AI_DRAFT to start.</p>
                                </div>
                            )
                        )}

                        {/* VIEW: TEMPLATE */}
                        {activeView === 'template' && (
                            localTemplateUrl ? (
                                <div className="p-6">
                                    {/* Header Bar */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                                                UPLOADED_TEMPLATE_PREVIEW
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Edit Button (navigate to editor page) */}
                                            <Button
                                                size="sm"
                                                onClick={openEditorPage}
                                                className="rounded-none border-2 border-black dark:border-white bg-green-600 text-white hover:bg-green-700 font-black uppercase text-[10px] tracking-widest"
                                            >
                                                <Edit3 className="w-3 h-3 mr-2" />
                                                Open_In_Editor
                                            </Button>
                                            {/* Refresh Button */}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={refreshTemplatePreview}
                                                disabled={isRefreshing}
                                                className="rounded-none border-2 border-black dark:border-white font-black uppercase text-[10px] tracking-widest"
                                            >
                                                {isRefreshing ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    'Refresh'
                                                )}
                                            </Button>
                                            <a
                                                href={localTemplateUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] text-blue-600 hover:underline font-bold uppercase tracking-widest"
                                            >
                                                Download Original
                                            </a>
                                        </div>
                                    </div>

                                    {/* Preview Area */}
                                    <div className="w-full aspect-[3/4] min-h-[600px] border border-gray-200 shadow-sm bg-white">
                                        <iframe
                                            key={iframeKey}
                                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(localTemplateUrl)}&t=${iframeKey}`}
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            title="Document Preview"
                                        >
                                            This browser does not support PDFs. Please download the PDF to view it:
                                            <a href={localTemplateUrl}>Download PDF</a>
                                        </iframe>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center h-full flex flex-col justify-center items-center">
                                    <Upload className="w-10 h-10 mx-auto mb-4 opacity-10 text-black dark:text-white" />
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30">No_Template_Uploaded</p>
                                    <p className="text-[8px] uppercase tracking-widest mt-2 opacity-20">Upload a .docx file to see preview.</p>
                                </div>
                            )
                        )}
                    </div>

                    {/* Tasks (if any) */}
                    {section.tasks && section.tasks.length > 0 && (
                        <div className="border-t-2 border-black/10 dark:border-white/10 p-6 bg-white dark:bg-black">
                            <h4 className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-[0.2em] mb-4">Functional_Requirements</h4>
                            <div className="space-y-2">
                                {section.tasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="flex items-center justify-between p-4 border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] hover:bg-[#FA4028]/5 transition-colors cursor-pointer"
                                        onClick={() => onEditTask(task)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {task.status === 'approved' ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <Circle className="w-4 h-4 text-black/20 dark:text-white/20" />
                                            )}
                                            <span className="text-xs font-bold uppercase tracking-tight">
                                                {task.title || task.requirement_text || 'UNNAMED_REQUIREMENT'}
                                            </span>
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{task.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
