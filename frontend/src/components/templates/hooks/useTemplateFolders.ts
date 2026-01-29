import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// ============================================================================
// Types
// ============================================================================

export interface TemplateFolder {
    id: string
    name: string
    description: string | null
    created_at: string
    updated_at: string
    template_count?: number
}

export type FolderId = string | null | "all"

interface EditState {
    folder: TemplateFolder | null
    name: string
    description: string
    isOpen: boolean
}

interface DeleteState {
    folder: TemplateFolder | null
    isDeleting: boolean
}

interface UploadState {
    folderId: FolderId
    isOpen: boolean
}


export interface UseTemplateFoldersOptions {
    onFolderUpdate?: () => void
    onFolderSelect: (folderId: FolderId) => void
}

export interface UseTemplateFoldersReturn {
    // Delete state & actions
    deleteState: DeleteState
    handleDelete: (folder: TemplateFolder) => void
    confirmDelete: () => Promise<void>
    clearDeleteState: () => void

    // Edit state & actions
    editState: EditState
    handleEdit: (folder: TemplateFolder) => void
    handleSaveEdit: () => Promise<void>
    setEditName: (name: string) => void
    setEditDescription: (description: string) => void
    setEditDialogOpen: (isOpen: boolean) => void

    // Upload state & actions
    uploadState: UploadState
    setUploadDialogOpen: (isOpen: boolean) => void
    handleUploadButtonClick: (e: React.MouseEvent, folderId: FolderId) => void

    // Folder click handling
    handleFolderClick: (folderId: FolderId) => void
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useTemplateFolders({
    onFolderUpdate,
    onFolderSelect,
}: UseTemplateFoldersOptions): UseTemplateFoldersReturn {
    const supabase = createClient()

    // -------------------------------------------------------------------------
    // Delete State
    // -------------------------------------------------------------------------
    const [folderToDelete, setFolderToDelete] = React.useState<TemplateFolder | null>(null)
    const [deletingId, setDeletingId] = React.useState<string | null>(null)

    const deleteState: DeleteState = {
        folder: folderToDelete,
        isDeleting: deletingId !== null,
    }

    const handleDelete = React.useCallback((folder: TemplateFolder) => {
        setFolderToDelete(folder)
    }, [])

    const confirmDelete = React.useCallback(async () => {
        if (!folderToDelete) return

        const folderId = folderToDelete.id
        setDeletingId(folderId)

        try {
            const { error } = await supabase
                .from('template_folders')
                .delete()
                .eq('id', folderId)

            if (error) throw error
            toast.success('資料夾已刪除')

            onFolderUpdate?.()
        } catch (error) {
            console.error('Delete failed:', error)
            toast.error('無法刪除資料夾')
        } finally {
            setDeletingId(null)
            setFolderToDelete(null)
        }
    }, [folderToDelete, supabase, onFolderUpdate])

    const clearDeleteState = React.useCallback(() => {
        setFolderToDelete(null)
    }, [])

    // -------------------------------------------------------------------------
    // Edit State
    // -------------------------------------------------------------------------
    const [editingFolder, setEditingFolder] = React.useState<TemplateFolder | null>(null)
    const [editName, setEditName] = React.useState("")
    const [editDescription, setEditDescription] = React.useState("")
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

    const editState: EditState = {
        folder: editingFolder,
        name: editName,
        description: editDescription,
        isOpen: isEditDialogOpen,
    }

    const handleEdit = React.useCallback((folder: TemplateFolder) => {
        setEditingFolder(folder)
        setEditName(folder.name)
        setEditDescription(folder.description || "")
        setIsEditDialogOpen(true)
    }, [])

    const handleSaveEdit = React.useCallback(async () => {
        if (!editingFolder) return

        try {
            const { error } = await supabase
                .from('template_folders')
                .update({
                    name: editName,
                    description: editDescription || null,
                })
                .eq('id', editingFolder.id)

            if (error) throw error
            toast.success('資料夾已更新')
            setIsEditDialogOpen(false)
            setEditingFolder(null)

            onFolderUpdate?.()
        } catch (error) {
            console.error('Update failed:', error)
            toast.error('無法更新資料夾')
        }
    }, [editingFolder, editName, editDescription, supabase, onFolderUpdate])

    const setEditDialogOpen = React.useCallback((isOpen: boolean) => {
        setIsEditDialogOpen(isOpen)
    }, [])

    // -------------------------------------------------------------------------
    // Upload State
    // -------------------------------------------------------------------------
    const [uploadFolderId, setUploadFolderId] = React.useState<FolderId>(null)
    const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false)

    const uploadState: UploadState = {
        folderId: uploadFolderId,
        isOpen: isUploadDialogOpen,
    }

    const setUploadDialogOpen = React.useCallback((isOpen: boolean) => {
        setIsUploadDialogOpen(isOpen)
    }, [])

    const handleUploadButtonClick = React.useCallback((e: React.MouseEvent, folderId: FolderId) => {
        e.stopPropagation()
        setUploadFolderId(folderId)
        setIsUploadDialogOpen(true)
    }, [])

    // -------------------------------------------------------------------------
    // Click Handling (single click vs double click)
    // -------------------------------------------------------------------------
    const [clickTimer, setClickTimer] = React.useState<NodeJS.Timeout | null>(null)

    // Cleanup timer on unmount
    React.useEffect(() => {
        return () => {
            if (clickTimer) {
                clearTimeout(clickTimer)
            }
        }
    }, [clickTimer])

    const handleFolderClick = React.useCallback((folderId: FolderId) => {
        if (clickTimer) {
            // Double click: clear timer and open upload dialog
            clearTimeout(clickTimer)
            setClickTimer(null)
            setUploadFolderId(folderId)
            setIsUploadDialogOpen(true)
        } else {
            // Single click: set timer, delay folder selection
            const timer = setTimeout(() => {
                onFolderSelect(folderId)
                setClickTimer(null)
            }, 250)
            setClickTimer(timer)
        }
    }, [clickTimer, onFolderSelect])

    // -------------------------------------------------------------------------
    // Return
    // -------------------------------------------------------------------------
    return {
        // Delete
        deleteState,
        handleDelete,
        confirmDelete,
        clearDeleteState,

        // Edit
        editState,
        handleEdit,
        handleSaveEdit,
        setEditName,
        setEditDescription,
        setEditDialogOpen,

        // Upload
        uploadState,
        setUploadDialogOpen,
        handleUploadButtonClick,

        // Click
        handleFolderClick,
    }
}
