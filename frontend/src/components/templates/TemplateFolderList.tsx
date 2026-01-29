"use client"

import * as React from "react"
import { Folder, FolderPlus, Clock, MoreVertical, LayoutGrid, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UploadTemplateZone } from "@/components/templates/UploadTemplateZone"
import {
    useTemplateFolders,
    type TemplateFolder,
    type FolderId,
} from "./hooks/useTemplateFolders"

// ============================================================================
// Types
// ============================================================================

interface TemplateFolderListProps {
    folders: TemplateFolder[]
    onFolderSelect: (folderId: FolderId) => void
    selectedFolderId: FolderId
    onFolderUpdate?: () => void
    onCreateFolderClick?: () => void
    viewMode?: 'grid' | 'list'
}

// ============================================================================
// Sub-components
// ============================================================================

interface AllTemplatesFolderCardProps {
    isSelected: boolean
    onClick: () => void
}

function AllTemplatesFolderCard({ isSelected, onClick }: AllTemplatesFolderCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative flex flex-col justify-between h-[340px] border-[1.5px] border-black dark:border-white rounded-none bg-background transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] cursor-pointer",
                isSelected ? "ring-2 ring-black ring-inset text-[#FA4028]" : ""
            )}
        >
            <div className="p-5 flex flex-col items-start flex-1 space-y-4">
                <div className="flex items-center justify-between w-full">
                    <Badge className="rounded-none border-black dark:border-white font-mono text-[9px] uppercase font-black px-2 py-0.5 bg-emerald-500 text-white border-none">
                        SYSTEM_POOL
                    </Badge>
                    <Folder className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="space-y-1">
                    <h3 className="text-2xl font-black font-mono uppercase tracking-tighter leading-[1.1] group-hover:text-[#FA4028] transition-colors line-clamp-2">
                        ALL_RESOURCES
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2 w-full">
                    <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-black dark:border-white space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FA4028] uppercase tracking-[0.2em]">
                            <LayoutGrid className="h-3.5 w-3.5" />
                            ROOT_DIRECTORY
                        </div>
                        <div className="text-xl font-black font-mono text-foreground break-words leading-tight line-clamp-1">
                            GLOBAL_INDEX
                        </div>
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-[#FA4028] space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FA4028] uppercase tracking-[0.2em]">
                            <Clock className="h-3.5 w-3.5" />
                            ACCESS_STATUS
                        </div>
                        <div className="text-xl font-black font-mono text-foreground leading-tight">
                            VERIFIED_STABLE
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 py-3 flex items-center justify-between border-t border-black/5 dark:border-white/5 mt-auto opacity-40 hover:opacity-100 transition-opacity">
                <div className="flex gap-4 text-[9px] font-mono uppercase font-bold italic">
                    <span>Upd: SYSTEM</span>
                </div>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    )
}

interface FolderCardProps {
    folder: TemplateFolder
    isSelected: boolean
    onClick: () => void
    onEdit: () => void
    onDelete: () => void
}

function FolderCard({ folder, isSelected, onClick, onEdit, onDelete }: FolderCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative flex flex-col justify-between h-[340px] border-[1.5px] border-black dark:border-white rounded-none bg-background transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] cursor-pointer",
                isSelected ? "ring-2 ring-black ring-inset text-[#FA4028]" : ""
            )}
        >
            <div className="p-5 flex flex-col items-start flex-1 space-y-4">
                <div className="flex items-center justify-between w-full">
                    <Badge className="rounded-none border-black dark:border-white font-mono text-[9px] uppercase font-black px-2 py-0.5 bg-indigo-500 text-white border-none">
                        CUSTOM_PATH
                    </Badge>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none border-black dark:border-white font-mono text-xs" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={onEdit}>
                                EDIT_FOLDER
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-black/10" />
                            <DropdownMenuItem
                                className="text-red-500 focus:bg-red-500 focus:text-white rounded-none cursor-pointer"
                                onClick={onDelete}
                            >
                                DELETE
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="space-y-1">
                    <h3 className="text-2xl font-black font-mono uppercase tracking-tighter leading-[1.1] group-hover:text-[#FA4028] transition-colors line-clamp-2">
                        {folder.name}
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2 w-full">
                    <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-black dark:border-white space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FA4028] uppercase tracking-[0.2em]">
                            <Folder className="h-3.5 w-3.5" />
                            ITEMS_COUNT
                        </div>
                        <div className="text-xl font-black font-mono text-foreground break-words leading-tight line-clamp-1">
                            {String(folder.template_count || 0).padStart(2, '0')} UNITS
                        </div>
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-[#FA4028] space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FA4028] uppercase tracking-[0.2em]">
                            <Clock className="h-3.5 w-3.5" />
                            UPDATED_AT
                        </div>
                        <div className="text-xl font-black font-mono text-foreground leading-tight">
                            {new Date(folder.updated_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 py-3 flex items-center justify-between border-t border-black/5 dark:border-white/5 mt-auto opacity-40 hover:opacity-100 transition-opacity">
                <div className="flex gap-4 text-[9px] font-mono uppercase font-bold italic">
                    <span>Cre: {new Date(folder.created_at).toLocaleDateString()}</span>
                </div>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    )
}

interface EmptyStateCardProps {
    onClick: () => void
}

function EmptyStateCard({ onClick }: EmptyStateCardProps) {
    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-black dark:border-white rounded-none bg-background transition-all hover:bg-black/5 cursor-pointer min-h-[300px]"
        >
            <div className="w-16 h-16 bg-black flex items-center justify-center mb-6 shadow-[8px_8px_0_0_#FA4028]">
                <FolderPlus className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black font-mono tracking-tighter uppercase mb-2">Initialize Folder</h3>
            <p className="text-xs font-mono text-muted-foreground uppercase text-center max-w-[200px]">
                system_state: empty
                <br />
                create new template directory
            </p>
        </div>
    )
}

// ============================================================================
// Dialog Components
// ============================================================================

interface UploadDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    folderId: FolderId
    folders: TemplateFolder[]
    onUploadComplete: () => void
}

function UploadDialog({ isOpen, onOpenChange, folderId, folders, onUploadComplete }: UploadDialogProps) {
    const folderName = folderId === "all"
        ? 'ALL_RESOURCES'
        : folders.find(f => f.id === folderId)?.name || 'ALL_RESOURCES'

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] rounded-none border-4 border-black p-0">
                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                            UPLOAD_TO: {folderName}
                        </DialogTitle>
                        <DialogDescription className="font-mono text-black dark:text-gray-400 uppercase text-xs mt-1">
                            {"// SELECT WORD TEMPLATE (.DOCX) FOR UPLOAD."}
                        </DialogDescription>
                    </DialogHeader>
                    <UploadTemplateZone
                        folders={folders}
                        selectedFolderId={folderId}
                        onFolderChange={() => { }}
                        onUploadComplete={onUploadComplete}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}

interface EditDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    name: string
    description: string
    onNameChange: (name: string) => void
    onDescriptionChange: (description: string) => void
    onSave: () => void
}

function EditDialog({
    isOpen,
    onOpenChange,
    name,
    description,
    onNameChange,
    onDescriptionChange,
    onSave,
}: EditDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-none border-4 border-black p-0">
                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">EDIT_FOLDER</DialogTitle>
                        <DialogDescription className="font-mono text-black dark:text-gray-400 uppercase text-xs mt-1">
                            {"// MODIFY FOLDER NAME AND DESCRIPTION."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name" className="text-sm font-black uppercase tracking-widest">FOLDER_NAME</Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => onNameChange(e.target.value)}
                                placeholder="Enter folder name..."
                                required
                                className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description" className="text-sm font-black uppercase tracking-widest">DESCRIPTION</Label>
                            <Input
                                id="edit-description"
                                value={description}
                                onChange={(e) => onDescriptionChange(e.target.value)}
                                placeholder="Optional description..."
                                className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-none border-2 border-black font-mono font-bold uppercase tracking-widest w-full sm:w-auto hover:bg-gray-100"
                        >
                            CANCEL
                        </Button>
                        <Button
                            onClick={onSave}
                            className="rounded-none border-2 border-black bg-black hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-widest w-full sm:w-auto"
                        >
                            SAVE_CHANGES
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}

interface DeleteDialogProps {
    folder: TemplateFolder | null
    isDeleting: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
}

function DeleteDialog({ folder, isDeleting, onOpenChange, onConfirm }: DeleteDialogProps) {
    return (
        <AlertDialog open={!!folder} onOpenChange={(open) => !open && onOpenChange(false)}>
            <AlertDialogContent className="rounded-none border-4 border-black p-0">
                <div className="p-6">
                    <AlertDialogHeader className="mb-6">
                        <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">CONFIRM_DELETE</AlertDialogTitle>
                        <AlertDialogDescription className="font-mono text-black dark:text-gray-400 uppercase text-xs mt-2 italic">
                            {`// PERMANENTLY REMOVING: 「${folder?.name}」`}<br />
                            {"// CONTENTS WILL BE MOVED TO SYSTEM_POOL."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                        <AlertDialogCancel className="rounded-none border-2 border-black font-mono font-bold uppercase tracking-widest w-full sm:w-auto hover:bg-gray-100">
                            ABORT
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="rounded-none border-2 border-black bg-[#FA4028] hover:bg-black text-white font-mono font-bold uppercase tracking-widest w-full sm:w-auto shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                        >
                            {isDeleting ? 'PROCESSING...' : 'CONFIRM_DELETE'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// ============================================================================
// Main Component
// ============================================================================

export function TemplateFolderList({
    folders,
    onFolderSelect,
    selectedFolderId,
    onFolderUpdate,
    onCreateFolderClick,
}: TemplateFolderListProps) {
    const {
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

        // Click
        handleFolderClick,
    } = useTemplateFolders({
        onFolderUpdate,
        onFolderSelect,
    })

    const handleUploadComplete = React.useCallback(() => {
        setUploadDialogOpen(false)
        onFolderUpdate?.()
    }, [setUploadDialogOpen, onFolderUpdate])

    // Filter out the folder being deleted
    const visibleFolders = React.useMemo(() =>
        folders.filter(f => f.id !== deleteState.folder?.id || !deleteState.isDeleting),
        [folders, deleteState.folder?.id, deleteState.isDeleting]
    )

    return (
        <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* All Templates Folder */}
                <AllTemplatesFolderCard
                    isSelected={selectedFolderId === "all"}
                    onClick={() => handleFolderClick("all")}
                />

                {/* Custom Folders */}
                {visibleFolders.map((folder) => (
                    <FolderCard
                        key={folder.id}
                        folder={folder}
                        isSelected={selectedFolderId === folder.id}
                        onClick={() => handleFolderClick(folder.id)}
                        onEdit={() => handleEdit(folder)}
                        onDelete={() => handleDelete(folder)}
                    />
                ))}
            </div>

            {/* Empty State Card */}
            {folders.length === 0 && onCreateFolderClick && (
                <EmptyStateCard onClick={onCreateFolderClick} />
            )}

            {/* Upload Dialog */}
            <UploadDialog
                isOpen={uploadState.isOpen}
                onOpenChange={setUploadDialogOpen}
                folderId={uploadState.folderId}
                folders={folders}
                onUploadComplete={handleUploadComplete}
            />

            {/* Edit Dialog */}
            <EditDialog
                isOpen={editState.isOpen}
                onOpenChange={setEditDialogOpen}
                name={editState.name}
                description={editState.description}
                onNameChange={setEditName}
                onDescriptionChange={setEditDescription}
                onSave={handleSaveEdit}
            />

            {/* Delete Dialog */}
            <DeleteDialog
                folder={deleteState.folder}
                isDeleting={deleteState.isDeleting}
                onOpenChange={clearDeleteState}
                onConfirm={confirmDelete}
            />
        </>
    )
}
