"use client"

import * as React from "react"
import { getErrorMessage } from '@/lib/errorUtils';
import type { Template } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { FileText, Download, Trash2, Edit2, Clock, Palette, RotateCcw, Loader2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { TemplatePreviewSheet } from "./TemplatePreviewSheet"
import { cn } from "@/lib/utils"



interface TemplateFolder {
    id: string
    name: string
}

interface TemplateListProps {
    templates: Template[]
    folders: TemplateFolder[]
    onTemplateUpdate?: () => void
}

export function TemplateList({ templates, folders, onTemplateUpdate }: TemplateListProps) {
    const [templateToDelete, setTemplateToDelete] = React.useState<Template | null>(null)
    const [deletingId, setDeletingId] = React.useState<string | null>(null)
    const [editingTemplate, setEditingTemplate] = React.useState<Template | null>(null)
    const [editName, setEditName] = React.useState("")
    const [editDescription, setEditDescription] = React.useState("")
    const [editCategory, setEditCategory] = React.useState("")
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
    const [previewTemplate, setPreviewTemplate] = React.useState<Template | null>(null)
    const [reparsingId, setReparsingId] = React.useState<string | null>(null)
    const supabase = createClient()
    const router = useRouter()

    const handleReparse = async (template: Template) => {
        setReparsingId(template.id)
        try {
            const response = await fetch("/webhook/parse-template-v2", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    file_path: template.file_path,
                    template_id: template.id,
                }),
            })

            if (!response.ok) {
                throw new Error("Trigger failed")
            }

            toast.success("已觸發重新解析")
        } catch (error) {
            console.error(error)
            toast.error("觸發解析失敗")
        } finally {
            // Delay clearing loading state slightly so user sees it happened
            setTimeout(() => setReparsingId(null), 1000)
        }
    }

    const handleEdit = (template: Template) => {
        setEditingTemplate(template)
        setEditName(template.name)
        setEditDescription(template.description || "")
        setEditCategory(template.category || "")
        setIsEditDialogOpen(true)
    }

    const confirmEdit = async () => {
        if (!editingTemplate) return

        try {
            const { error } = await supabase
                .from('templates')
                .update({
                    name: editName,
                    description: editDescription || null,
                    category: editCategory || null,
                })
                .eq('id', editingTemplate.id)

            if (error) throw error

            toast.success("範本資訊已更新")
            setIsEditDialogOpen(false)
            setEditingTemplate(null)

            if (onTemplateUpdate) {
                onTemplateUpdate()
            }
        } catch (error) {
            console.error("Update error:", error)
            toast.error(getErrorMessage(error) || "更新失敗")
        }
    }

    const confirmDelete = async () => {
        if (!templateToDelete) return

        const templateId = templateToDelete.id
        setDeletingId(templateId)

        try {
            // 1. Delete from storage
            if (templateToDelete.file_path) {
                const { error: storageError } = await supabase.storage
                    .from('raw-files')
                    .remove([templateToDelete.file_path])

                if (storageError) console.error("Storage delete error:", storageError)
            }

            // 2. Delete from database
            const { error: dbError } = await supabase
                .from('templates')
                .delete()
                .eq('id', templateId)

            if (dbError) throw dbError

            toast.success("範本已刪除")
            setTemplateToDelete(null)

            if (onTemplateUpdate) {
                onTemplateUpdate()
            }
        } catch (error) {
            console.error("Delete error:", error)
            toast.error(getErrorMessage(error) || "刪除失敗")
        } finally {
            setDeletingId(null)
        }
    }

    const handleDownload = async (template: Template) => {
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
        } catch (error) {
            console.error("Download error:", error)
            toast.error("下載失敗")
        }
    }

    // 處理範本卡片點擊 - 直接開啟預覽
    const handleTemplateClick = (template: Template) => {
        setPreviewTemplate(template)
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    }

    if (templates.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                此資料夾尚無範本
            </div>
        )
    }

    return (
        <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {templates.map((template) => (
                    <Card
                        key={template.id}
                        onClick={() => handleTemplateClick(template)}
                        className="group relative flex flex-col overflow-hidden border-[1.5px] border-black dark:border-white rounded-none bg-background transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] cursor-pointer"
                    >
                        <div className="h-1.5 w-full bg-black/40" />

                        <CardHeader className="p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-none bg-black flex items-center justify-center border border-black shadow-[2px_2px_0_0_#FA4028]">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                    <Badge className="rounded-none border-black dark:border-white font-mono text-[9px] uppercase font-black px-2 py-0.5 bg-black text-white">
                                        DOCX_TEMPLATE
                                    </Badge>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-none border-black dark:border-white font-mono text-xs" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem onClick={() => handleTemplateClick(template)}>PREVIEW</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push(`/dashboard/templates/${template.id}/design`)}>DESIGN</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEdit(template)}>EDIT_INFO</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDownload(template)}>DOWNLOAD</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleReparse(template)} disabled={reparsingId === template.id}>
                                                {reparsingId === template.id ? 'REPARSING...' : 'REPARSE_V2'}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-black/10" />
                                            <DropdownMenuItem
                                                className="text-red-600 focus:bg-red-600 focus:text-white rounded-none cursor-pointer"
                                                onClick={() => setTemplateToDelete(template)}
                                            >
                                                DELETE
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <CardTitle className="text-xl font-black leading-[1.1] font-mono tracking-tighter uppercase group-hover:text-[#FA4028] transition-colors line-clamp-1">
                                    {template.name}
                                </CardTitle>
                            </div>

                            <div className="grid grid-cols-1 gap-2 pt-2">
                                <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-black dark:border-white space-y-1">
                                    <div className="text-[9px] font-black text-[#FA4028] uppercase tracking-[0.2em]">CATEGORY</div>
                                    <div className="text-sm font-black font-mono uppercase truncate">
                                        {template.category || "SYSTEM_DEFAULT"}
                                    </div>
                                </div>

                                <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-black/20 dark:border-white/20 space-y-1">
                                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">STRUCTURE_NOTE</div>
                                    <div className="text-[11px] font-mono font-bold leading-tight uppercase opacity-70 line-clamp-2 h-[2.2em]">
                                        {template.description || "NO_STRUCTURE_DETECTION_LOG"}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardFooter className="px-5 py-3 flex items-center justify-between border-t border-black/5 dark:border-white/5 mt-auto bg-black/5">
                            <div className="text-[9px] font-mono uppercase font-bold italic opacity-40">
                                CRE: {formatDate(template.created_at)}
                            </div>
                            <Palette className="h-3.5 w-3.5 opacity-20 hover:opacity-100 hover:text-[#FA4028] transition-all" />
                        </CardFooter>
                    </Card>
                ))}
            </div>


            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-none border-4 border-black p-0">
                    <div className="p-6">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">編輯範本資訊</DialogTitle>
                            <DialogDescription className="font-mono text-black dark:text-gray-400 uppercase text-xs mt-1">
                                UPDATE TEMPLATE NAME, CATEGORY AND DESCRIPTION.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name" className="text-sm font-black uppercase tracking-widest">範本名稱</Label>
                                <Input
                                    id="edit-name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-category" className="text-sm font-black uppercase tracking-widest">分類</Label>
                                <Input
                                    id="edit-category"
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                    className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-description" className="text-sm font-black uppercase tracking-widest">描述</Label>
                                <Textarea
                                    id="edit-description"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-none border-black border-2 font-black uppercase tracking-widest hover:bg-gray-100">
                                取消
                            </Button>
                            <Button onClick={confirmEdit} className="rounded-none border-black border-2 bg-[#FA4028] hover:bg-black text-white font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]">
                                確認更新
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
                <AlertDialogContent className="rounded-none border-4 border-black p-0">
                    <div className="p-6">
                        <AlertDialogHeader className="mb-6">
                            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">確認刪除範本</AlertDialogTitle>
                            <AlertDialogDescription className="font-mono text-black dark:text-gray-400 uppercase text-xs mt-2">
                                確定要刪除範本「{templateToDelete?.name}」嗎？此操作無法復原。
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                            <AlertDialogCancel className="rounded-none border-black border-2 font-black uppercase tracking-widest hover:bg-gray-100">取消</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="rounded-none border-black border-2 bg-red-600 hover:bg-black text-white font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                            >
                                確認刪除
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* Template Preview Sheet */}
            <TemplatePreviewSheet
                template={previewTemplate}
                open={!!previewTemplate}
                onOpenChange={(open) => !open && setPreviewTemplate(null)}
                onEdit={handleEdit}
                onDownload={handleDownload}
            />
        </>
    )
}

