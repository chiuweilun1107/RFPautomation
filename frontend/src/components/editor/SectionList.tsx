"use client"

import * as React from "react"
import { CheckCircle2, Circle, ChevronDown, Sparkles, Loader2, Wand2, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { TaskEditorSheet } from "./TaskEditorSheet"
import { DraftEditor } from "./DraftEditor"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import { SourceDetailSheet } from "@/components/workspace/SourceDetailSheet"
import { createClient } from "@/lib/supabase/client"

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
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg border-gray-200 dark:border-zinc-800 m-8">
                <h3 className="mt-2 text-lg font-semibold">尚無章節</h3>
                <p className="text-sm text-muted-foreground text-gray-500 max-w-sm mx-auto mt-2">
                    文件尚未解析完成，或沒有識別到任何章節。
                    如果狀態仍為「處理中」，請稍候。
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
            const response = await fetch('/api/rag/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: projectId,
                    section_id: section.id,
                    section_title: section.content || section.title,
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || '生成失敗')
            }

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
    const hasDraft = localDraft && localDraft.trim().length > 0

    // 當 section.content_draft 更新時同步
    React.useEffect(() => {
        setLocalDraft(section.content_draft || '')
    }, [section.content_draft])

    return (
        <div className="border rounded-lg bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            {/* Section Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {section.content || section.title}
                    </h3>
                    {hasDraft && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3" />
                            已生成
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {hasDraft && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsEditing(!isEditing)
                            }}
                        >
                            <Edit3 className="w-4 h-4 mr-2" />
                            {isEditing ? '完成' : '編輯'}
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
                        className="shrink-0"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                生成中...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-4 h-4 mr-2" />
                                {hasDraft ? '重新生成' : 'AI 生成草稿'}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="border-t">
                    {/* Draft Content */}
                    {isEditing && hasDraft ? (
                        <div className="p-4">
                            <DraftEditor
                                sectionId={section.id}
                                initialContent={localDraft}
                                onSave={(content) => setLocalDraft(content)}
                            />
                        </div>
                    ) : hasDraft ? (
                        <div className="p-4 bg-gray-50/50 dark:bg-zinc-800/30">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI 草稿</span>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-900 p-4 rounded-lg border">
                                <ReactMarkdown>{localDraft}</ReactMarkdown>
                            </div>
                            {/* 引用來源 - 可點擊查看詳情 */}
                            {section.draft_sources && section.draft_sources.length > 0 && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">參考來源 ({section.draft_sources.length})</span>
                                        <span className="text-xs text-blue-500/70">點擊查看詳情</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {section.draft_sources.map((source, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => onViewSource(source)}
                                                disabled={loadingSourceId === source.id}
                                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-400 transition-colors cursor-pointer disabled:opacity-50"
                                                title={`相似度: ${source.similarity ? (source.similarity * 100).toFixed(1) + '%' : 'N/A'} - 點擊查看詳情`}
                                            >
                                                {loadingSourceId === source.id ? (
                                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                ) : (
                                                    <span className="mr-1">📄</span>
                                                )}
                                                {source.title || source.source_title || `來源 ${idx + 1}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400">
                            <Wand2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">尚未生成草稿</p>
                            <p className="text-xs mt-1">點擊「AI 生成草稿」按鈕來生成內容</p>
                        </div>
                    )}

                    {/* Tasks (if any) */}
                    {section.tasks && section.tasks.length > 0 && (
                        <div className="border-t p-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">需求項目</h4>
                            <div className="space-y-2">
                                {section.tasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 cursor-pointer"
                                        onClick={() => onEditTask(task)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {task.status === 'approved' ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <Circle className="w-4 h-4 text-gray-300" />
                                            )}
                                            <span className="text-sm">
                                                {task.title || task.requirement_text || '未命名項目'}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400">{task.status}</span>
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
