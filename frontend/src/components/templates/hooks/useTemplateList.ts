"use client"

import * as React from "react"
import type { Template } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useErrorHandler } from "@/hooks/useErrorHandler"
import { logger } from "@/lib/errors/logger"
import { toast } from "sonner"

// ============================================
// Types
// ============================================

export interface TemplateFolder {
    id: string
    name: string
}

export interface UseTemplateListOptions {
    templates: Template[]
    onTemplateUpdate?: () => void
}

export interface EditDialogState {
    isOpen: boolean
    template: Template | null
    name: string
    description: string
    category: string
}

export interface DeleteDialogState {
    template: Template | null
}

export interface UseTemplateListReturn {
    // State
    localTemplates: Template[]
    deletingId: string | null
    reparsingId: string | null
    editDialog: EditDialogState
    deleteDialog: DeleteDialogState

    // Edit Dialog Actions
    openEditDialog: (template: Template) => void
    closeEditDialog: () => void
    setEditName: (name: string) => void
    setEditDescription: (description: string) => void
    setEditCategory: (category: string) => void
    confirmEdit: () => Promise<void>

    // Delete Dialog Actions
    openDeleteDialog: (template: Template) => void
    closeDeleteDialog: () => void
    confirmDelete: () => Promise<void>

    // Template Actions
    handleReparse: (template: Template) => Promise<void>
    handleDownload: (template: Template) => Promise<void>
    handleTemplateClick: (template: Template) => void

    // Utilities
    formatDate: (dateString?: string) => string
}

// ============================================
// Hook Implementation
// ============================================

export function useTemplateList({
    templates,
    onTemplateUpdate
}: UseTemplateListOptions): UseTemplateListReturn {
    const { handleError, handleApiError, handleDbError } = useErrorHandler()
    const supabase = createClient()
    const router = useRouter()

    // ============================================
    // Local Templates State (for optimistic updates)
    // ============================================
    const [localTemplates, setLocalTemplates] = React.useState<Template[]>(templates)

    // Sync when templates prop changes
    React.useEffect(() => {
        setLocalTemplates(templates)
    }, [templates])

    // ============================================
    // Delete Dialog State
    // ============================================
    const [templateToDelete, setTemplateToDelete] = React.useState<Template | null>(null)
    const [deletingId, setDeletingId] = React.useState<string | null>(null)

    // ============================================
    // Edit Dialog State
    // ============================================
    const [editingTemplate, setEditingTemplate] = React.useState<Template | null>(null)
    const [editName, setEditName] = React.useState("")
    const [editDescription, setEditDescription] = React.useState("")
    const [editCategory, setEditCategory] = React.useState("")
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

    // ============================================
    // Reparse State
    // ============================================
    const [reparsingId, setReparsingId] = React.useState<string | null>(null)

    // ============================================
    // Edit Dialog Actions
    // ============================================
    const openEditDialog = React.useCallback((template: Template) => {
        setEditingTemplate(template)
        setEditName(template.name)
        setEditDescription(template.description || "")
        setEditCategory(template.category || "")
        setIsEditDialogOpen(true)
    }, [])

    const closeEditDialog = React.useCallback(() => {
        setIsEditDialogOpen(false)
        setEditingTemplate(null)
    }, [])

    const confirmEdit = React.useCallback(async () => {
        if (!editingTemplate) return

        const oldTemplate = editingTemplate
        const newValues: Partial<Template> = {
            name: editName,
            description: editDescription || undefined,
            category: editCategory || undefined,
        }

        // Optimistic update: immediately update UI
        setLocalTemplates(prev => prev.map(t =>
            t.id === editingTemplate.id ? { ...t, ...newValues } as Template : t
        ))
        setIsEditDialogOpen(false)
        setEditingTemplate(null)

        try {
            const { error } = await supabase
                .from('templates')
                .update(newValues)
                .eq('id', oldTemplate.id)

            if (error) throw error

            toast.success("範本資訊已更新")

            logger.info('Template info updated', 'TemplateList', {
                templateId: oldTemplate.id,
                changes: newValues
            })

            // Background sync
            if (onTemplateUpdate) {
                onTemplateUpdate()
            }
        } catch (error) {
            // Rollback on failure
            setLocalTemplates(prev => prev.map(t =>
                t.id === oldTemplate.id ? oldTemplate : t
            ))
            handleDbError(error, 'UpdateTemplateInfo', {
                userMessage: '更新失敗，請重試',
                metadata: { templateId: oldTemplate.id }
            })
        }
    }, [editingTemplate, editName, editDescription, editCategory, supabase, onTemplateUpdate, handleDbError])

    // ============================================
    // Delete Dialog Actions
    // ============================================
    const openDeleteDialog = React.useCallback((template: Template) => {
        setTemplateToDelete(template)
    }, [])

    const closeDeleteDialog = React.useCallback(() => {
        setTemplateToDelete(null)
    }, [])

    const confirmDelete = React.useCallback(async () => {
        if (!templateToDelete) return

        const templateToRemove = templateToDelete

        // Optimistic update: immediately remove from UI
        setLocalTemplates(prev => prev.filter(t => t.id !== templateToRemove.id))
        setTemplateToDelete(null)
        setDeletingId(templateToRemove.id)

        try {
            if (templateToRemove.file_path) {
                const { error: storageError } = await supabase.storage
                    .from('raw-files')
                    .remove([templateToRemove.file_path])

                if (storageError) {
                    logger.warn('Storage file delete failed', 'TemplateList', {
                        templateId: templateToRemove.id,
                        filePath: templateToRemove.file_path,
                        error: storageError
                    })
                }
            }

            const { error: dbError } = await supabase
                .from('templates')
                .delete()
                .eq('id', templateToRemove.id)

            if (dbError) throw dbError

            toast.success("範本已刪除")

            logger.info('Template deleted successfully', 'TemplateList', {
                templateId: templateToRemove.id,
                templateName: templateToRemove.name
            })

            // Background sync
            if (onTemplateUpdate) {
                onTemplateUpdate()
            }
        } catch (error) {
            // Rollback on failure: restore deleted template
            setLocalTemplates(prev => [...prev, templateToRemove].sort((a, b) =>
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            ))
            handleDbError(error, 'DeleteTemplate', {
                userMessage: '刪除失敗，請重試',
                metadata: { templateId: templateToRemove.id }
            })
        } finally {
            setDeletingId(null)
        }
    }, [templateToDelete, supabase, onTemplateUpdate, handleDbError])

    // ============================================
    // Template Actions
    // ============================================
    const handleReparse = React.useCallback(async (template: Template) => {
        setReparsingId(template.id)
        try {
            // Updated to use the standard WF04 endpoint
            const response = await fetch("/api/webhook/process-proposal-template", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    projectId: template.id,
                    filePath: template.file_path,
                    fileName: template.name,
                    mode: 'replace' // Manual reparse usually implies a desire to reset/update structure
                }),
            })

            if (!response.ok) {
                throw new Error("Trigger failed")
            }

            toast.success("已觸發重新解析 (WF04)")
            logger.info('Template reparse triggered', 'TemplateList', {
                templateId: template.id,
                templateName: template.name
            })
        } catch (error) {
            handleApiError(error, 'ReparseTemplate', {
                userMessage: '觸發解析失敗，請重試',
                metadata: { templateId: template.id }
            })
        } finally {
            setTimeout(() => setReparsingId(null), 1000)
        }
    }, [handleApiError])

    const handleDownload = React.useCallback(async (template: Template) => {
        try {
            if (!template.file_path) {
                toast.error('文件路徑不存在')
                return
            }

            const { data, error } = await supabase.storage
                .from('raw-files')
                .download(template.file_path)

            if (error) throw error

            const url = URL.createObjectURL(data)
            const a = document.createElement('a')
            a.href = url
            a.download = template.name + '.docx'
            a.click()
            URL.revokeObjectURL(url)
            toast.success("範本下載成功")

            logger.info('Template downloaded', 'TemplateList', {
                templateId: template.id,
                templateName: template.name
            })
        } catch (error) {
            handleError(error, {
                context: 'DownloadTemplate',
                userMessage: '下載失敗，請重試',
                metadata: { templateId: template.id }
            })
        }
    }, [supabase, handleError])

    const handleTemplateClick = React.useCallback((template: Template) => {
        router.push(`/dashboard/templates/${template.id}/design`)
    }, [router])

    // ============================================
    // Utilities
    // ============================================
    const formatDate = React.useCallback((dateString?: string): string => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    }, [])

    // ============================================
    // Return Value
    // ============================================
    return {
        // State
        localTemplates,
        deletingId,
        reparsingId,
        editDialog: {
            isOpen: isEditDialogOpen,
            template: editingTemplate,
            name: editName,
            description: editDescription,
            category: editCategory,
        },
        deleteDialog: {
            template: templateToDelete,
        },

        // Edit Dialog Actions
        openEditDialog,
        closeEditDialog,
        setEditName,
        setEditDescription,
        setEditCategory,
        confirmEdit,

        // Delete Dialog Actions
        openDeleteDialog,
        closeDeleteDialog,
        confirmDelete,

        // Template Actions
        handleReparse,
        handleDownload,
        handleTemplateClick,

        // Utilities
        formatDate,
    }
}
