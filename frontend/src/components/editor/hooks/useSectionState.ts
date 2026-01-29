"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { ragApi } from "@/features/rag/api/ragApi"

// Types
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
    content: string
    content_draft?: string
    draft_sources?: DraftSource[]
    title?: string
    tasks: Task[]
    children?: Section[]
    template_file_url?: string
}

// ============================================
// useSectionListState - SectionList 组件的状态管理
// ============================================

interface UseSectionListStateReturn {
    // Task Editor 相关
    selectedTask: Task | null
    isSheetOpen: boolean
    handleEditTask: (task: Task) => void
    handleCloseSheet: () => void
    handleTaskUpdated: () => void

    // 展开/收起相关
    expandedSections: Set<string>
    toggleSection: (sectionId: string) => void

    // 草稿生成相关
    generatingSectionId: string | null
    handleGenerateDraft: (section: Section, projectId: string) => Promise<void>

    // 来源详情相关
    selectedSource: FullSource | null
    isSourceDetailOpen: boolean
    loadingSourceId: string | null
    handleViewSource: (source: DraftSource) => Promise<void>
    handleCloseSourceDetail: () => void
}

export function useSectionListState(): UseSectionListStateReturn {
    const router = useRouter()
    const supabase = createClient()

    // Task Editor 状态
    const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)

    // 展开状态
    const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set())

    // 草稿生成状态
    const [generatingSectionId, setGeneratingSectionId] = React.useState<string | null>(null)

    // 来源详情状态
    const [selectedSource, setSelectedSource] = React.useState<FullSource | null>(null)
    const [isSourceDetailOpen, setIsSourceDetailOpen] = React.useState(false)
    const [loadingSourceId, setLoadingSourceId] = React.useState<string | null>(null)

    // Task Editor 操作
    const handleEditTask = React.useCallback((task: Task) => {
        setSelectedTask(task)
        setIsSheetOpen(true)
    }, [])

    const handleCloseSheet = React.useCallback(() => {
        setIsSheetOpen(false)
    }, [])

    const handleTaskUpdated = React.useCallback(() => {
        router.refresh()
    }, [router])

    // 展开/收起操作
    const toggleSection = React.useCallback((sectionId: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev)
            if (next.has(sectionId)) {
                next.delete(sectionId)
            } else {
                next.add(sectionId)
            }
            return next
        })
    }, [])

    // 草稿生成操作
    const handleGenerateDraft = React.useCallback(async (section: Section, projectId: string) => {
        setGeneratingSectionId(section.id)
        try {
            const data = await ragApi.generate({
                project_id: projectId,
                section_id: section.id,
                section_title: section.content || section.title,
            })

            if (data.sources && data.sources.length > 0) {
                const sourceNames = data.sources
                    .map((s: { title?: string; source_title?: string }) => s.title || s.source_title)
                    .filter(Boolean)
                    .slice(0, 3)
                toast.success(`草稿生成完成！参考了 ${data.sources.length} 个来源: ${sourceNames.join(', ')}`)
            } else {
                toast.success('草稿生成完成！（无匹配的知识来源，使用 AI 通用知识生成）')
            }

            router.refresh()
        } catch (error: unknown) {
            console.error('Generate draft failed:', error)
            const errorMsg = error instanceof Error ? error.message : '生成草稿失败'
            if (errorMsg.includes('404') || errorMsg.includes('not registered')) {
                toast.error('请先在 n8n 中启动 WF08 RAG Query workflow')
            } else {
                toast.error(`生成失败：${errorMsg}`)
            }
        } finally {
            setGeneratingSectionId(null)
        }
    }, [router])

    // 来源详情操作
    const handleViewSource = React.useCallback(async (source: DraftSource) => {
        if (!source.id) {
            toast.error('来源资讯不完整')
            return
        }

        setLoadingSourceId(source.id)

        try {
            const { data, error } = await supabase
                .from('sources')
                .select('*')
                .eq('id', source.id)
                .single()

            if (error || !data) {
                const { data: byTitle } = await supabase
                    .from('sources')
                    .select('*')
                    .eq('title', source.title || source.source_title)
                    .single()

                if (byTitle) {
                    setSelectedSource(byTitle as FullSource)
                    setIsSourceDetailOpen(true)
                } else {
                    toast.error('找不到来源详情')
                }
            } else {
                setSelectedSource(data as FullSource)
                setIsSourceDetailOpen(true)
            }
        } catch (err) {
            console.error('Failed to fetch source:', err)
            toast.error('载入来源失败')
        } finally {
            setLoadingSourceId(null)
        }
    }, [supabase])

    const handleCloseSourceDetail = React.useCallback(() => {
        setIsSourceDetailOpen(false)
    }, [])

    return {
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
    }
}

// ============================================
// useSectionCardState - SectionCard 组件的状态管理
// ============================================

interface UseSectionCardStateProps {
    section: Section
}

interface UseSectionCardStateReturn {
    // 编辑状态
    isEditing: boolean
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>

    // 本地草稿状态
    localDraft: string
    setLocalDraft: React.Dispatch<React.SetStateAction<string>>

    // 模板状态
    localTemplateUrl: string | null
    setLocalTemplateUrl: React.Dispatch<React.SetStateAction<string | null>>

    // 视图切换
    activeView: 'draft' | 'template'
    setActiveView: React.Dispatch<React.SetStateAction<'draft' | 'template'>>

    // 刷新状态
    iframeKey: number
    isRefreshing: boolean

    // 上传状态
    isUploading: boolean
    fileInputRef: React.RefObject<HTMLInputElement | null>

    // 计算属性
    hasDraft: boolean
    hasTemplate: boolean

    // 操作方法
    openEditorPage: () => void
    refreshTemplatePreview: () => Promise<void>
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}

export function useSectionCardState({ section }: UseSectionCardStateProps): UseSectionCardStateReturn {
    const router = useRouter()
    const supabase = createClient()

    // 编辑状态
    const [isEditing, setIsEditing] = React.useState(false)

    // 本地草稿
    const [localDraft, setLocalDraft] = React.useState(section.content_draft || '')

    // 模板 URL
    const [localTemplateUrl, setLocalTemplateUrl] = React.useState<string | null>(section.template_file_url || null)

    // 视图模式
    const [activeView, setActiveView] = React.useState<'draft' | 'template'>('draft')

    // 刷新相关
    const [iframeKey, setIframeKey] = React.useState(0)
    const [isRefreshing, setIsRefreshing] = React.useState(false)

    // 上传相关
    const [isUploading, setIsUploading] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // 计算属性
    const hasDraft = !!(localDraft && localDraft.trim().length > 0)
    const hasTemplate = !!localTemplateUrl

    // 自动切换到模板视图（如果只有模板没有草稿）
    React.useEffect(() => {
        if (hasTemplate && !hasDraft && activeView !== 'template') {
            setActiveView('template')
        }
    }, [hasTemplate, hasDraft, activeView])

    // 同步 props 到本地状态
    React.useEffect(() => {
        setLocalDraft(section.content_draft || '')
    }, [section.content_draft])

    React.useEffect(() => {
        if (section.template_file_url) {
            setLocalTemplateUrl(section.template_file_url)
        }
    }, [section.template_file_url])

    // 跳转到独立编辑页面
    const openEditorPage = React.useCallback(() => {
        const pathParts = window.location.pathname.split('/')
        const dashboardIndex = pathParts.indexOf('dashboard')
        const projectId = pathParts[dashboardIndex + 1]

        if (projectId) {
            router.push(`/dashboard/${projectId}/writing/edit/${section.id}`)
        } else {
            toast.error('无法获取项目 ID')
        }
    }, [router, section.id])

    // 刷新模板预览
    const refreshTemplatePreview = React.useCallback(async () => {
        setIsRefreshing(true)

        try {
            const { data, error } = await supabase
                .from('sections')
                .select('template_file_url')
                .eq('id', section.id)
                .single()

            if (error) {
                console.error('Failed to fetch updated section:', error)
                toast.error('无法载入最新版本')
            } else if (data?.template_file_url) {
                setLocalTemplateUrl(data.template_file_url)
                setIframeKey(prev => prev + 1)
                toast.success('已更新至最新版本')
            }
        } catch (err) {
            console.error('Error refreshing template:', err)
            toast.error('刷新失败')
        } finally {
            setIsRefreshing(false)
        }
    }, [supabase, section.id])

    // 文件上传
    const handleFileUpload = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.docx')) {
            toast.error('仅支援 .docx 格式')
            return
        }

        setIsUploading(true)
        try {
            toast.info('正在处理字体...')
            const formData = new FormData()
            formData.append('file', file)
            formData.append('bucket', 'raw-files')
            formData.append('folder', 'section-templates')

            const response = await fetch('/api/process-and-upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || '字体处理失败')
            }

            const result = await response.json()

            toast.info('正在保存...')

            const { error: updateError } = await supabase
                .from('sections')
                .update({
                    template_file_url: result.url
                })
                .eq('id', section.id)

            if (updateError) throw updateError

            toast.success('文件上传成功！字体已处理')
            if (fileInputRef.current) fileInputRef.current.value = ''

            setLocalTemplateUrl(result.url)
            setActiveView('template')

            router.refresh()
        } catch (error: unknown) {
            console.error('Upload failed:', error)
            const errorMsg = error instanceof Error ? error.message : '未知错误'
            toast.error(`上传失败: ${errorMsg}`)
        } finally {
            setIsUploading(false)
        }
    }, [supabase, section.id, router])

    return {
        isEditing,
        setIsEditing,
        localDraft,
        setLocalDraft,
        localTemplateUrl,
        setLocalTemplateUrl,
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
    }
}

// 导出类型供外部使用
export type { Task, DraftSource, FullSource, Section }
