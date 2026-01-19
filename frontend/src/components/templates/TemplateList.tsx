"use client"

import * as React from "react"
import { getErrorMessage } from '@/lib/errorUtils';
import type { Template } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { FileText, Download, Trash2, Edit2, Clock, Palette, RotateCcw, Loader2 } from "lucide-react"
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
import { TemplatePreviewSheet } from "./TemplatePreviewSheet"



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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {templates.map((template) => (
                    <div
                        key={template.id}
                        onClick={() => handleTemplateClick(template)}
                        className="group cursor-pointer block h-full transition-all duration-300 hover:-translate-y-1 rounded-[4px] border border-gray-200 dark:border-white/10 hover:border-[#FA4028]/50 bg-white dark:bg-white/5 hover:shadow-xl hover:shadow-[#FA4028]/5"
                    >
                        <div className="relative h-full flex flex-col overflow-hidden">
                            <div className="flex flex-row items-start justify-between space-y-0 pb-2 p-4">
                                <div className="flex flex-col gap-2 w-full pr-8">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-base text-[#00063D] dark:text-white line-clamp-1">
                                            {template.name}
                                        </h3>
                                        {template.category && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                {template.category}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleReparse(template)
                                        }}
                                        disabled={reparsingId === template.id}
                                    >
                                        {reparsingId === template.id ? (
                                            <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />
                                        ) : (
                                            <RotateCcw className="h-4 w-4 text-orange-600" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            router.push(`/dashboard/templates/${template.id}/design`)
                                        }}
                                    >
                                        <Palette className="h-4 w-4 text-purple-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleEdit(template)
                                        }}
                                    >
                                        <Edit2 className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-900/20"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDownload(template)
                                        }}
                                    >
                                        <Download className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setTemplateToDelete(template)
                                        }}
                                        disabled={deletingId === template.id}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            </div>

                            <div className="px-4 pb-4 flex-1 flex flex-col justify-between">
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                                    {template.description || "無描述"}
                                </p>

                                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-white/5">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatDate(template.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">編輯範本資訊</DialogTitle>
                        <DialogDescription>
                            更新範本的名稱、分類和描述。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name" className="font-bold">範本名稱</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="font-medium"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-category" className="font-bold">分類</Label>
                            <Input
                                id="edit-category"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="font-medium"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description" className="font-bold">描述</Label>
                            <Textarea
                                id="edit-description"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="font-medium"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={confirmEdit} className="bg-[#FA4028] hover:bg-[#D93620] text-white font-bold">
                            確認更新
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-serif text-xl">確認刪除範本</AlertDialogTitle>
                        <AlertDialogDescription>
                            確定要刪除範本「{templateToDelete?.name}」嗎？此操作無法復原。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            確認刪除
                        </AlertDialogAction>
                    </AlertDialogFooter>
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

