"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Folder, Upload, Trash2, FileText, Clock, Edit2, FolderPlus, ArrowRight, LayoutGrid, MoreVertical } from "lucide-react"
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
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
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

interface TemplateFolder {
    id: string
    name: string
    description: string | null
    created_at: string
    updated_at: string
    template_count?: number
}

interface TemplateFolderListProps {
    folders: TemplateFolder[]
    onFolderSelect: (folderId: string | null | "all") => void
    selectedFolderId: string | null | "all"
    onFolderUpdate?: () => void
    onCreateFolderClick?: () => void
    viewMode?: 'grid' | 'list'
}

export function TemplateFolderList({
    folders,
    onFolderSelect,
    selectedFolderId,
    onFolderUpdate,
    onCreateFolderClick,
    viewMode = 'grid'
}: TemplateFolderListProps) {
    const [folderToDelete, setFolderToDelete] = React.useState<TemplateFolder | null>(null)
    const [deletingId, setDeletingId] = React.useState<string | null>(null)
    const [editingFolder, setEditingFolder] = React.useState<TemplateFolder | null>(null)
    const [editName, setEditName] = React.useState("")
    const [editDescription, setEditDescription] = React.useState("")
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
    const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false)
    const [uploadFolderId, setUploadFolderId] = React.useState<string | null | "all">(null)
    const [clickTimer, setClickTimer] = React.useState<NodeJS.Timeout | null>(null)
    const supabase = createClient()

    // 清理計時器
    React.useEffect(() => {
        return () => {
            if (clickTimer) {
                clearTimeout(clickTimer)
            }
        }
    }, [clickTimer])

    const handleDelete = (folder: TemplateFolder) => {
        setFolderToDelete(folder)
    }

    const confirmDelete = async () => {
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

            if (onFolderUpdate) {
                onFolderUpdate()
            }
        } catch (error) {
            console.error('Delete failed:', error)
            toast.error('無法刪除資料夾')
        } finally {
            setDeletingId(null)
            setFolderToDelete(null)
        }
    }

    const handleEdit = (folder: TemplateFolder) => {
        setEditingFolder(folder)
        setEditName(folder.name)
        setEditDescription(folder.description || "")
        setIsEditDialogOpen(true)
    }

    const handleSaveEdit = async () => {
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

            if (onFolderUpdate) {
                onFolderUpdate()
            }
        } catch (error) {
            console.error('Update failed:', error)
            toast.error('無法更新資料夾')
        }
    }

    // 處理單擊和雙擊
    const handleFolderClick = (folderId: string | null | "all") => {
        if (clickTimer) {
            // 雙擊：清除計時器並開啟上傳視窗
            clearTimeout(clickTimer)
            setClickTimer(null)
            setUploadFolderId(folderId)
            setIsUploadDialogOpen(true)
        } else {
            // 單擊：設定計時器，延遲選中資料夾
            const timer = setTimeout(() => {
                onFolderSelect(folderId)
                setClickTimer(null)
            }, 250)
            setClickTimer(timer)
        }
    }

    // 處理上傳按鈕點擊
    const handleUploadButtonClick = (e: React.MouseEvent, folderId: string | null | "all") => {
        e.stopPropagation()
        setUploadFolderId(folderId)
        setIsUploadDialogOpen(true)
    }

    return (
        <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* All Templates Folder */}
                {/* All Templates Folder */}
                <div
                    onClick={() => handleFolderClick("all")}
                    className={cn(
                        "group relative flex flex-col justify-between h-[340px] border-[1.5px] border-black dark:border-white rounded-none bg-background transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] cursor-pointer",
                        selectedFolderId === "all" ? "ring-2 ring-black ring-inset text-[#FA4028]" : ""
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

                {/* Custom Folders */}
                {folders.filter(f => f.id !== deletingId).map((folder) => (
                    <div
                        key={folder.id}
                        onClick={() => handleFolderClick(folder.id)}
                        className={cn(
                            "group relative flex flex-col justify-between h-[340px] border-[1.5px] border-black dark:border-white rounded-none bg-background transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] cursor-pointer",
                            selectedFolderId === folder.id ? "ring-2 ring-black ring-inset text-[#FA4028]" : ""
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
                                        <DropdownMenuItem onClick={() => handleEdit(folder)}>
                                            EDIT_FOLDER
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-black/10" />
                                        <DropdownMenuItem
                                            className="text-red-500 focus:bg-red-500 focus:text-white rounded-none cursor-pointer"
                                            onClick={() => handleDelete(folder)}
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
                ))}
            </div>

            {/* Empty State Card */}
            {
                folders.length === 0 && (
                    <div
                        onClick={() => onCreateFolderClick && onCreateFolderClick()}
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

            {/* Upload Dialog */}
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogContent className="sm:max-w-[600px] rounded-none border-4 border-black p-0">
                    <div className="p-6">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                                UPLOAD_TO: {uploadFolderId === "all" ? 'ALL_RESOURCES' : folders.find(f => f.id === uploadFolderId)?.name || 'ALL_RESOURCES'}
                            </DialogTitle>
                            <DialogDescription className="font-mono text-black dark:text-gray-400 uppercase text-xs mt-1">
                                // SELECT WORD TEMPLATE (.DOCX) FOR UPLOAD.
                            </DialogDescription>
                        </DialogHeader>
                        <UploadTemplateZone
                            folders={folders}
                            selectedFolderId={uploadFolderId}
                            onFolderChange={() => { }}
                            onUploadComplete={() => {
                                setIsUploadDialogOpen(false)
                                if (onFolderUpdate) {
                                    onFolderUpdate()
                                }
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-none border-4 border-black p-0">
                    <div className="p-6">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">EDIT_FOLDER</DialogTitle>
                            <DialogDescription className="font-mono text-black dark:text-gray-400 uppercase text-xs mt-1">
                                // MODIFY FOLDER NAME AND DESCRIPTION.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name" className="text-sm font-black uppercase tracking-widest">FOLDER_NAME</Label>
                                <Input
                                    id="edit-name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Enter folder name..."
                                    required
                                    className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-description" className="text-sm font-black uppercase tracking-widest">DESCRIPTION</Label>
                                <Input
                                    id="edit-description"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="Optional description..."
                                    className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                                />
                            </div>
                        </div>
                        <DialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                                className="rounded-none border-2 border-black font-mono font-bold uppercase tracking-widest w-full sm:w-auto hover:bg-gray-100"
                            >
                                CANCEL
                            </Button>
                            <Button
                                onClick={handleSaveEdit}
                                className="rounded-none border-2 border-black bg-black hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-widest w-full sm:w-auto"
                            >
                                SAVE_CHANGES
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
                <AlertDialogContent className="rounded-none border-4 border-black p-0">
                    <div className="p-6">
                        <AlertDialogHeader className="mb-6">
                            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">CONFIRM_DELETE</AlertDialogTitle>
                            <AlertDialogDescription className="font-mono text-black dark:text-gray-400 uppercase text-xs mt-2 italic">
                                // PERMANENTLY REMOVING: 「{folderToDelete?.name}」<br />
                                // CONTENTS WILL BE MOVED TO SYSTEM_POOL.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                            <AlertDialogCancel className="rounded-none border-2 border-black font-mono font-bold uppercase tracking-widest w-full sm:w-auto hover:bg-gray-100">
                                ABORT
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                disabled={deletingId === folderToDelete?.id}
                                className="rounded-none border-2 border-black bg-[#FA4028] hover:bg-black text-white font-mono font-bold uppercase tracking-widest w-full sm:w-auto shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                            >
                                {deletingId === folderToDelete?.id ? 'PROCESSING...' : 'CONFIRM_DELETE'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

