"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Folder, Upload, Trash2, FileText, Clock, Edit2, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { VirtualizedList } from "@/components/common/VirtualizedList"
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
import { UploadZone } from "@/components/knowledge/UploadZone"

interface Folder {
    id: string
    name: string
    description: string | null
    created_at: string
    updated_at: string
    document_count?: number
}

interface FolderListProps {
    folders: Folder[]
    onFolderSelect: (folderId: string | null | "all") => void
    selectedFolderId: string | null | "all"
    onFolderEdit?: (folder: Folder) => void
    onFolderDelete?: (folder: Folder) => void
    onFolderUpdate?: () => void
    onCreateFolderClick?: () => void
}

export function FolderList({ folders, onFolderSelect, selectedFolderId, onFolderUpdate, onCreateFolderClick }: FolderListProps) {
    const [folderToDelete, setFolderToDelete] = React.useState<Folder | null>(null)
    const [deletingId, setDeletingId] = React.useState<string | null>(null)
    const [editingFolder, setEditingFolder] = React.useState<Folder | null>(null)
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

    const handleDelete = (folder: Folder) => {
        setFolderToDelete(folder)
    }

    const confirmDelete = async () => {
        if (!folderToDelete) return

        const folderId = folderToDelete.id
        setDeletingId(folderId)

        try {
            const { error } = await supabase
                .from('knowledge_folders')
                .delete()
                .eq('id', folderId)

            if (error) throw error
            toast.success('資料夾已刪除')
            
            // 通知父組件更新數據
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

    const handleEdit = (folder: Folder) => {
        setEditingFolder(folder)
        setEditName(folder.name)
        setEditDescription(folder.description || "")
        setIsEditDialogOpen(true)
    }

    const handleSaveEdit = async () => {
        if (!editingFolder) return

        try {
            const { error } = await supabase
                .from('knowledge_folders')
                .update({
                    name: editName,
                    description: editDescription || null,
                })
                .eq('id', editingFolder.id)

            if (error) throw error
            toast.success('資料夾已更新')
            setIsEditDialogOpen(false)
            setEditingFolder(null)
            
            // 通知父組件更新數據
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
            }, 250) // 250ms 延遲來區分單擊和雙擊
            setClickTimer(timer)
        }
    }

    // 處理上傳按鈕點擊（不觸發資料夾選擇）
    const handleUploadButtonClick = (e: React.MouseEvent, folderId: string | null | "all") => {
        e.stopPropagation()
        setUploadFolderId(folderId)
        setIsUploadDialogOpen(true)
    }

    // Render folder card for virtualized list
    const renderFolderCard = (folder: Folder) => {
        return (
            <div
                onClick={() => handleFolderClick(folder.id)}
                className={`group cursor-pointer block h-full transition-all duration-300 group-hover:-translate-y-1 rounded-[4px] ${selectedFolderId === folder.id ? 'border-2 border-[#FA4028]' : 'border border-gray-200 dark:border-white/10 hover:border-[#FA4028]/50'} bg-white dark:bg-white/5 hover:shadow-xl hover:shadow-[#FA4028]/5`}
            >
                <div className="relative h-full flex flex-col overflow-hidden">
                    <div className="flex flex-row items-start justify-between space-y-0 pb-2 p-4">
                        <div className="flex flex-col gap-2 w-full pr-8">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <Folder className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-lg font-bold text-[#00063D] dark:text-white leading-tight line-clamp-2 group-hover:text-[#FA4028] transition-colors h-[3.5rem] flex items-center">
                                {folder.name}
                            </div>
                        </div>

                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleUploadButtonClick(e, folder.id)}
                                className="h-8 w-8 text-gray-300 hover:text-[#FA4028] hover:bg-orange-50 dark:hover:bg-orange-900/20 opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                                title="上傳文件"
                            >
                                <Upload className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleEdit(folder)
                                }}
                                className="h-8 w-8 text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                                title="編輯資料夾"
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleDelete(folder)
                                }}
                                className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                                title="刪除資料夾"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="pb-4 flex-1 px-4">
                        <div className="space-y-1.5 mt-2">
                            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                <span className="text-gray-400 dark:text-gray-500 text-xs mr-2">描述:</span>
                                {folder.description || "無描述"}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <div className="h-px bg-gray-100 dark:bg-white/5" />
                        <div className="pt-3 pb-3 bg-gray-50/50 dark:bg-black/20 flex justify-between items-center text-xs text-gray-400 font-medium px-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{new Date(folder.updated_at).toLocaleDateString()} 更新</span>
                            </div>
                            {folder.document_count !== undefined && (
                                <div className="flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>{folder.document_count} 個文件</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Use virtualization for folders with 50+ items
    const shouldVirtualize = folders.length >= 50;

    return (
        <>
            {shouldVirtualize ? (
                <VirtualizedList
                    items={folders}
                    renderItem={renderFolderCard}
                    height={800}
                    estimateSize={240}
                    overscan={5}
                    itemKey={(folder) => folder.id}
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                />
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {/* All Documents Folder */}
                    <div
                        onClick={() => handleFolderClick("all")}
                        className={`group cursor-pointer block h-full transition-all duration-300 group-hover:-translate-y-1 rounded-[4px] ${selectedFolderId === "all" ? 'border-2 border-[#FA4028]' : 'border border-gray-200 dark:border-white/10 hover:border-[#FA4028]/50'} bg-white dark:bg-white/5 hover:shadow-xl hover:shadow-[#FA4028]/5`}
                    >
                        <div className="relative h-full flex flex-col overflow-hidden">
                            <div className="flex flex-row items-start justify-between space-y-0 pb-2 p-4">
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FA4028] to-[#D93620] flex items-center justify-center">
                                        <Folder className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-lg font-bold text-[#00063D] dark:text-white leading-tight">
                                        所有文件
                                    </div>
                                </div>
                            </div>

                            <div className="pb-4 flex-1 px-4">
                                <div className="space-y-1.5 mt-2">
                                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                        <span className="text-gray-400 dark:text-gray-500 text-xs mr-2">描述:</span>
                                        查看所有未分類的知識庫文件
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto">
                                <div className="h-px bg-gray-100 dark:bg-white/5" />
                                <div className="pt-3 pb-3 bg-gray-50/50 dark:bg-black/20 flex justify-between items-center text-xs text-gray-400 font-medium px-4">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>全部文件</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Custom Folders */}
                    {folders.map((folder) => (
                        <div key={folder.id}>
                            {renderFolderCard(folder)}
                        </div>
                    ))}

                    {/* Empty State Card - Only show when no custom folders */}
                    {folders.length === 0 && (
                        <div
                            onClick={() => onCreateFolderClick && onCreateFolderClick()}
                            className="group cursor-pointer block h-full transition-all duration-300 rounded-[4px] border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/5 hover:border-[#FA4028]/50 hover:bg-[#FA4028]/5"
                        >
                            <div className="relative h-full flex flex-col overflow-hidden p-6 items-center justify-center text-center min-h-[240px]">
                                <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-[#FA4028]/10 transition-colors">
                                    <FolderPlus className="w-8 h-8 text-[#FA4028]" />
                                </div>
                                <h3 className="text-lg font-serif font-bold text-[#00063D] dark:text-white mb-2">尚無資料夾</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    點擊建立資料夾來組織您的知識庫文件
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Upload Dialog */}
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">
                            上傳文件到「{uploadFolderId === "all" ? '所有文件' : folders.find(f => f.id === uploadFolderId)?.name || '所有文件'}」
                        </DialogTitle>
                        <DialogDescription>
                            選擇要上傳的文件，它們將會被加入到此資料夾。
                        </DialogDescription>
                    </DialogHeader>
                    <UploadZone
                        folders={folders}
                        selectedFolderId={uploadFolderId}
                        onFolderChange={() => {}}
                        onUploadComplete={() => {
                            // 關閉對話框
                            setIsUploadDialogOpen(false)
                            // 通知父組件更新數據
                            if (onFolderUpdate) {
                                onFolderUpdate()
                            }
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">編輯資料夾</DialogTitle>
                        <DialogDescription>
                            修改資料夾的名稱和描述。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name" className="font-bold">資料夾名稱</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="例如：公司政策、技術文件"
                                required
                                className="font-medium"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description" className="font-bold">描述（選填）</Label>
                            <Input
                                id="edit-description"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="簡短描述此資料夾的用途"
                                className="font-medium"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                        >
                            取消
                        </Button>
                        <Button
                            onClick={handleSaveEdit}
                            className="bg-[#FA4028] hover:bg-[#D93620] text-white font-bold"
                        >
                            儲存變更
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-serif text-[#00063D] dark:text-white">確認刪除此資料夾？</AlertDialogTitle>
                        <AlertDialogDescription>
                            這將永久刪除「{folderToDelete?.name}」。<br />
                            資料夾內的文件將會移至「所有文件」分類。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={deletingId === folderToDelete?.id}
                            className="bg-[#FA4028] hover:bg-[#D93620] text-white"
                        >
                            {deletingId === folderToDelete?.id ? '刪除中...' : '確認刪除'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}