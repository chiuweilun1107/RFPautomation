"use client"

import * as React from "react"
import { CheckCircle2, Circle, ChevronDown, Sparkles, Loader2, Wand2, Edit3, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { TaskEditorSheet } from "./TaskEditorSheet"
import { DraftEditor } from "./DraftEditor"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import { SourceDetailSheet } from "@/components/workspace/SourceDetailSheet"
import { createClient } from "@/lib/supabase/client"
import { ragApi } from "@/features/rag/api/ragApi"
import { templatesApi } from "@/features/templates/api/templatesApi"
import { Upload } from "lucide-react"

// Types based on the schema
interface Task {
    id: string
    title?: string
    description?: string
    requirement_text: string
    response_draft?: string
    status: string
    ai_confidence?: number
}

interface DraftSource {
    id?: string
    title?: string
    source_title?: string
    similarity?: number
}

interface FullSource {
    id: string
    title: string
    type: string
    status: string
    content?: string
    summary?: string
    topics?: string[]
    source_type?: string
    created_at: string
    origin_url?: string
}

interface Section {
    id: string
    content: string // Title
    content_draft?: string // AI 生成的草稿
    draft_sources?: DraftSource[] // 引用來源
    title?: string
    tasks: Task[]
    children?: Section[]
    template_file_url?: string // 上傳的模版文件連結
}

interface SectionListProps {
    sections: Section[]
    projectId: string
}

export function SectionList({ sections, projectId }: SectionListProps) {
    const router = useRouter()
    const supabase = createClient()
    const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [generatingSectionId, setGeneratingSectionId] = React.useState<string | null>(null)
    const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set())

    // 來源詳情相關狀態
    const [selectedSource, setSelectedSource] = React.useState<FullSource | null>(null)
    const [isSourceDetailOpen, setIsSourceDetailOpen] = React.useState(false)
    const [loadingSourceId, setLoadingSourceId] = React.useState<string | null>(null)

    // 點擊引用來源，查看詳情
    const handleViewSource = async (source: DraftSource) => {
        if (!source.id) {
            toast.error('來源資訊不完整')
            return
        }

        setLoadingSourceId(source.id)

        try {
            // 從資料庫獲取完整來源資訊
            const { data, error } = await supabase
                .from('sources')
                .select('*')
                .eq('id', source.id)
                .single()

            if (error || !data) {
                // 嘗試用 title 查詢
                const { data: byTitle } = await supabase
                    .from('sources')
                    .select('*')
                    .eq('title', source.title || source.source_title)
                    .single()

                if (byTitle) {
                    setSelectedSource(byTitle as FullSource)
                    setIsSourceDetailOpen(true)
                } else {
                    toast.error('找不到來源詳情')
                }
            } else {
                setSelectedSource(data as FullSource)
                setIsSourceDetailOpen(true)
            }
        } catch (err) {
            console.error('Failed to fetch source:', err)
            toast.error('載入來源失敗')
        } finally {
            setLoadingSourceId(null)
        }
    }

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

    const handleEditTask = (task: Task) => {
        setSelectedTask(task)
        setIsSheetOpen(true)
    }

    const handleTaskUpdated = () => {
        router.refresh()
    }

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev)
            if (next.has(sectionId)) {
                next.delete(sectionId)
            } else {
                next.add(sectionId)
            }
            return next
        })
    }

    // RAG 生成章節草稿
    const handleGenerateDraft = async (section: Section) => {
        setGeneratingSectionId(section.id)
        try {
            const data = await ragApi.generate({
                project_id: projectId,
                section_id: section.id,
                section_title: section.content || section.title,
            })

            // 顯示引用來源
            if (data.sources && data.sources.length > 0) {
                const sourceNames = data.sources.map((s: any) => s.title || s.source_title).filter(Boolean).slice(0, 3)
                toast.success(`草稿生成完成！參考了 ${data.sources.length} 個來源: ${sourceNames.join(', ')}`)
            } else {
                toast.success('草稿生成完成！（無匹配的知識來源，使用 AI 通用知識生成）')
            }

            console.log('[RAG] Generated with sources:', data.sources)
            router.refresh()
        } catch (error: any) {
            console.error('Generate draft failed:', error)
            const errorMsg = error.message || '生成草稿失敗'
            if (errorMsg.includes('404') || errorMsg.includes('not registered')) {
                toast.error('請先在 n8n 中啟動 WF08 RAG Query workflow')
            } else {
                toast.error(`生成失敗：${errorMsg}`)
            }
        } finally {
            setGeneratingSectionId(null)
        }
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
                    onGenerate={() => handleGenerateDraft(section)}
                    onEditTask={handleEditTask}
                    onViewSource={handleViewSource}
                    loadingSourceId={loadingSourceId}
                />
            ))}

            <TaskEditorSheet
                task={selectedTask}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onTaskUpdated={handleTaskUpdated}
            />

            {/* 來源詳情視窗 */}
            <SourceDetailSheet
                source={selectedSource}
                open={isSourceDetailOpen}
                onOpenChange={setIsSourceDetailOpen}
            />
        </div>
    )
}

// 章節卡片組件
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

function SectionCard({ section, isExpanded, isGenerating, onToggle, onGenerate, onEditTask, onViewSource, loadingSourceId }: SectionCardProps) {
    const [isEditing, setIsEditing] = React.useState(false)
    const [localDraft, setLocalDraft] = React.useState(section.content_draft || '')
    const [localTemplateUrl, setLocalTemplateUrl] = React.useState(section.template_file_url || null)
    const [activeView, setActiveView] = React.useState<'draft' | 'template'>('draft')

    // Check if we have content for views
    const hasDraft = localDraft && localDraft.trim().length > 0;
    const hasTemplate = !!localTemplateUrl;

    // Default to template view if only template exists and no draft
    React.useEffect(() => {
        if (hasTemplate && !hasDraft && activeView !== 'template') {
            setActiveView('template')
        }
    }, [hasTemplate, hasDraft, activeView])

    // Sync props to local state if they change (e.g. after SWR revalidation)
    React.useEffect(() => {
        setLocalDraft(section.content_draft || '')
    }, [section.content_draft])

    React.useEffect(() => {
        if (section.template_file_url) {
            setLocalTemplateUrl(section.template_file_url)
        }
    }, [section.template_file_url])

    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = React.useState(false)
    const router = useRouter()

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.docx')) {
            toast.error('僅支援 .docx 格式')
            return
        }

        setIsUploading(true)
        try {
            const supabase = createClient()

            // 1. Upload to Supabase Storage
            toast.info('正在上傳文件...')
            const fileExt = file.name.split('.').pop()
            const fileName = `${section.id}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`
            const filePath = `section-templates/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('raw-files')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('raw-files')
                .getPublicUrl(filePath)

            // 2. Update Section template_file_url
            const { error: updateError } = await supabase
                .from('sections')
                .update({
                    template_file_url: publicUrl
                })
                .eq('id', section.id)

            if (updateError) throw updateError

            toast.success('文件上傳成功！')
            if (fileInputRef.current) fileInputRef.current.value = ''

            // Optimistic Update
            setLocalTemplateUrl(publicUrl)

            // Switch to template view
            setActiveView('template')

            router.refresh()

        } catch (error: any) {
            console.error('Upload failed object:', error)
            console.error('Upload failed message:', error.message)
            console.error('Upload failed details:', JSON.stringify(error))
            toast.error(`上傳失敗: ${error.message || '未知錯誤'}`)
        } finally {
            setIsUploading(false)
        }
    }

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
                                                            <span className="mr-2">📄</span>
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
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 dark:text-white/40">UPLOADED_TEMPLATE_PREVIEW</span>
                                        <a href={localTemplateUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-blue-600 hover:underline">
                                            下載原始檔案
                                        </a>
                                    </div>
                                    <div className="w-full aspect-[3/4] min-h-[600px] border border-gray-200 shadow-sm bg-white">
                                        <iframe
                                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(localTemplateUrl)}`}
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
