"use client"

import * as React from "react"
import type { Template } from "@/types"
import { FileText, MoreVertical, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { TemplateListSkeleton } from "@/components/ui/skeletons/TemplateListSkeleton"
import { useTemplateList, type TemplateFolder } from "./hooks/useTemplateList"
import { useRouter } from "next/navigation"

// ============================================
// Types
// ============================================

interface TemplateListProps {
    templates: Template[]
    /** @deprecated folders prop is kept for API compatibility but currently unused */
    folders?: TemplateFolder[]
    onTemplateUpdate?: () => void
    viewMode?: 'grid' | 'list'
    isLoading?: boolean
}

// ============================================
// Sub-components
// ============================================

interface TemplateCardProps {
    template: Template
    reparsingId: string | null
    onTemplateClick: (template: Template) => void
    onEdit: (template: Template) => void
    onDownload: (template: Template) => void
    onReparse: (template: Template) => void
    onDelete: (template: Template) => void
    formatDate: (dateString?: string) => string
}

function TemplateCard({
    template,
    reparsingId,
    onTemplateClick,
    onEdit,
    onDownload,
    onReparse,
    onDelete,
    formatDate,
}: TemplateCardProps) {
    const router = useRouter()

    return (
        <Card
            onClick={() => onTemplateClick(template)}
            className="group relative flex flex-col overflow-visible border-[1.5px] border-black dark:border-white rounded-none bg-background transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] cursor-pointer"
        >
            <CardHeader className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <Badge className="rounded-none border-black dark:border-white font-mono text-[9px] uppercase font-black px-2 py-0.5 bg-black text-white">
                        DOCX_TEMPLATE
                    </Badge>

                    <TemplateCardMenu
                        template={template}
                        reparsingId={reparsingId}
                        onDesign={() => router.push(`/dashboard/templates/${template.id}/design`)}
                        onEdit={() => onEdit(template)}
                        onDownload={() => onDownload(template)}
                        onReparse={() => onReparse(template)}
                        onDelete={() => onDelete(template)}
                    />
                </div>

                <div className="space-y-1">
                    <CardTitle className="text-2xl font-black leading-[1.1] font-mono tracking-tighter uppercase group-hover:text-[#FA4028] transition-colors line-clamp-2">
                        {template.name}
                    </CardTitle>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2">
                    <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-black dark:border-white space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FA4028] uppercase tracking-[0.2em]">
                            <FileText className="h-3.5 w-3.5" />
                            CATEGORY_ENTITY
                        </div>
                        <div className="text-xl font-black font-mono text-foreground break-words leading-tight line-clamp-1">
                            {template.category || "SYSTEM_DEFAULT"}
                        </div>
                    </div>

                    <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-[#FA4028] space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FA4028] uppercase tracking-[0.2em]">
                            <FileText className="h-3.5 w-3.5" />
                            STRUCTURE_NOTE
                        </div>
                        <div className="text-xl font-black font-mono text-foreground leading-tight line-clamp-1">
                            {template.description || "NO_DECODER_LOG"}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardFooter className="px-5 py-3 flex items-center justify-between border-t border-black/5 dark:border-white/5 mt-auto opacity-40 hover:opacity-100 transition-opacity">
                <div className="flex gap-4 text-[9px] font-mono uppercase font-bold italic">
                    <span>Upd: {formatDate(template.updated_at)}</span>
                    <span>Cre: {formatDate(template.created_at)}</span>
                </div>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </CardFooter>
        </Card>
    )
}

interface TemplateCardMenuProps {
    template: Template
    reparsingId: string | null
    onDesign: () => void
    onEdit: () => void
    onDownload: () => void
    onReparse: () => void
    onDelete: () => void
}

function TemplateCardMenu({
    template,
    reparsingId,
    onDesign,
    onEdit,
    onDownload,
    onReparse,
    onDelete,
}: TemplateCardMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none border-black dark:border-white font-mono text-xs" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={onDesign}>DESIGN</DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>EDIT_INFO</DropdownMenuItem>
                <DropdownMenuItem onClick={onDownload}>DOWNLOAD</DropdownMenuItem>
                <DropdownMenuItem onClick={onReparse} disabled={reparsingId === template.id}>
                    {reparsingId === template.id ? 'REPARSING...' : 'REPARSE_V2'}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-black/10" />
                <DropdownMenuItem
                    className="text-red-600 focus:bg-red-600 focus:text-white rounded-none cursor-pointer"
                    onClick={onDelete}
                >
                    DELETE
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

interface TemplateListRowProps {
    template: Template
    onTemplateClick: (template: Template) => void
    onEdit: (template: Template) => void
    onDownload: (template: Template) => void
    onDelete: (template: Template) => void
    formatDate: (dateString?: string) => string
}

function TemplateListRow({
    template,
    onTemplateClick,
    onEdit,
    onDownload,
    onDelete,
    formatDate,
}: TemplateListRowProps) {
    const router = useRouter()

    return (
        <div
            onClick={() => onTemplateClick(template)}
            className="grid grid-cols-1 md:grid-cols-[1fr_180px_150px_120px] gap-4 p-4 items-center hover:bg-[#FA4028]/5 transition-colors cursor-pointer group"
        >
            <div className="font-mono text-sm font-black uppercase group-hover:text-[#FA4028] transition-colors truncate">
                <div className="flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-3 text-[#FA4028] opacity-0 group-hover:opacity-100 transition-opacity" />
                    {template.name}
                </div>
            </div>

            <div className="font-mono text-[11px] font-bold text-foreground/60 uppercase border-l border-black/5 pl-4">
                {template.category || "GENERAL"}
            </div>

            <div className="font-mono text-[11px] font-bold text-foreground/60 border-l border-black/5 pl-4">
                {formatDate(template.created_at)}
            </div>

            <div className="flex justify-end gap-1 border-l border-black/5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none hover:bg-black hover:text-white transition-colors">
                            <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none border-black dark:border-white font-mono text-xs" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/templates/${template.id}/design`)}>DESIGN</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(template)}>EDIT_INFO</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownload(template)}>DOWNLOAD</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-black/10" />
                        <DropdownMenuItem
                            className="text-red-600 focus:bg-red-600 focus:text-white rounded-none cursor-pointer"
                            onClick={() => onDelete(template)}
                        >
                            DELETE_TEMPLATE
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

interface EditDialogProps {
    isOpen: boolean
    name: string
    description: string
    category: string
    onOpenChange: (open: boolean) => void
    onNameChange: (name: string) => void
    onDescriptionChange: (description: string) => void
    onCategoryChange: (category: string) => void
    onConfirm: () => void
}

function EditDialog({
    isOpen,
    name,
    description,
    category,
    onOpenChange,
    onNameChange,
    onDescriptionChange,
    onCategoryChange,
    onConfirm,
}: EditDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                                value={name}
                                onChange={(e) => onNameChange(e.target.value)}
                                className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-category" className="text-sm font-black uppercase tracking-widest">分類</Label>
                            <Input
                                id="edit-category"
                                value={category}
                                onChange={(e) => onCategoryChange(e.target.value)}
                                className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description" className="text-sm font-black uppercase tracking-widest">描述</Label>
                            <Textarea
                                id="edit-description"
                                value={description}
                                onChange={(e) => onDescriptionChange(e.target.value)}
                                className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-none border-black border-2 font-black uppercase tracking-widest hover:bg-gray-100">
                            取消
                        </Button>
                        <Button onClick={onConfirm} className="rounded-none border-black border-2 bg-[#FA4028] hover:bg-black text-white font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]">
                            確認更新
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}

interface DeleteDialogProps {
    template: Template | null
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
}

function DeleteDialog({
    template,
    onOpenChange,
    onConfirm,
}: DeleteDialogProps) {
    return (
        <AlertDialog open={!!template} onOpenChange={() => onOpenChange(false)}>
            <AlertDialogContent className="rounded-none border-4 border-black p-0">
                <div className="p-6">
                    <AlertDialogHeader className="mb-6">
                        <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">確認刪除範本</AlertDialogTitle>
                        <AlertDialogDescription className="font-mono text-black dark:text-gray-400 uppercase text-xs mt-2">
                            確定要刪除範本「{template?.name}」嗎？此操作無法復原。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                        <AlertDialogCancel className="rounded-none border-black border-2 font-black uppercase tracking-widest hover:bg-gray-100">取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onConfirm}
                            className="rounded-none border-black border-2 bg-red-600 hover:bg-black text-white font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                        >
                            確認刪除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}

function EmptyState() {
    return (
        <div className="text-center py-20 border-2 border-dashed border-black/10 dark:border-white/10 rounded-none bg-black/5 dark:bg-white/5">
            <FileText className="h-16 w-16 mx-auto text-black/20 dark:text-white/20 mb-6" strokeWidth={1.5} />
            <h3 className="font-black uppercase tracking-tight text-foreground mb-3 text-lg">
                NO TEMPLATES IN FOLDER
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed uppercase tracking-wide font-bold">
                This folder is empty. Upload a DOCX template to get started.
            </p>
        </div>
    )
}

// ============================================
// Main Component
// ============================================

export function TemplateList({
    templates,
    folders: _folders,
    onTemplateUpdate,
    viewMode = 'grid',
    isLoading = false
}: TemplateListProps) {
    // Note: _folders is intentionally unused but kept for API compatibility
    void _folders
    const {
        localTemplates,
        deletingId,
        reparsingId,
        editDialog,
        deleteDialog,
        openEditDialog,
        closeEditDialog,
        setEditName,
        setEditDescription,
        setEditCategory,
        confirmEdit,
        openDeleteDialog,
        closeDeleteDialog,
        confirmDelete,
        handleReparse,
        handleDownload,
        handleTemplateClick,
        formatDate,
    } = useTemplateList({ templates, onTemplateUpdate })

    // Loading state
    if (isLoading) {
        return <TemplateListSkeleton viewMode={viewMode} count={8} />
    }

    // Empty state
    if (localTemplates.length === 0) {
        return <EmptyState />
    }

    // Filter out deleting templates
    const visibleTemplates = localTemplates.filter(t => t.id !== deletingId)

    return (
        <>
            {viewMode === 'grid' ? (
                <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {visibleTemplates.map((template) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            reparsingId={reparsingId}
                            onTemplateClick={handleTemplateClick}
                            onEdit={openEditDialog}
                            onDownload={handleDownload}
                            onReparse={handleReparse}
                            onDelete={openDeleteDialog}
                            formatDate={formatDate}
                        />
                    ))}
                </div>
            ) : (
                <div className="border-[1.5px] border-black dark:border-white bg-white dark:bg-black overflow-hidden rounded-none">
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="hidden md:grid grid-cols-[1fr_180px_150px_120px] gap-4 p-4 bg-muted border-b border-black dark:border-white text-[10px] font-black uppercase tracking-[0.2em] opacity-60 italic text-black dark:text-white min-w-[640px]">
                            <div>Template_Name</div>
                            <div>Category</div>
                            <div>Created_At</div>
                            <div className="text-right">Ops</div>
                        </div>

                        <div className="divide-y divide-black/10 dark:divide-white/10 min-w-[640px]">
                            {visibleTemplates.map((template) => (
                                <TemplateListRow
                                    key={template.id}
                                    template={template}
                                    onTemplateClick={handleTemplateClick}
                                    onEdit={openEditDialog}
                                    onDownload={handleDownload}
                                    onDelete={openDeleteDialog}
                                    formatDate={formatDate}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Dialog */}
            <EditDialog
                isOpen={editDialog.isOpen}
                name={editDialog.name}
                description={editDialog.description}
                category={editDialog.category}
                onOpenChange={(open) => !open && closeEditDialog()}
                onNameChange={setEditName}
                onDescriptionChange={setEditDescription}
                onCategoryChange={setEditCategory}
                onConfirm={confirmEdit}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteDialog
                template={deleteDialog.template}
                onOpenChange={closeDeleteDialog}
                onConfirm={confirmDelete}
            />
        </>
    )
}
