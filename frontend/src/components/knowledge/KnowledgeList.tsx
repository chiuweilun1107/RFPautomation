"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useErrorHandler } from "@/hooks/useErrorHandler"
import { logger } from "@/lib/errors/logger"
import {
    FileText,
    Trash2,
    CheckCircle2,
    Clock,
    AlertCircle,
    Edit2,
    MoreVertical,
    Search,
    LayoutGrid,
    List as ListIcon,
    ArrowRight,
    Loader2
} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { KnowledgeListSkeleton } from "@/components/ui/skeletons/KnowledgeListSkeleton"

interface Source {
    id: string
    title: string
    origin_url: string
    type: string
    status: 'processing' | 'ready' | 'error'
    created_at: string
}

export function KnowledgeList({
    initialDocs,
    searchQuery = "",
    viewMode = 'grid',
    isLoading = false
}: {
    initialDocs: any[],
    searchQuery?: string,
    viewMode?: 'grid' | 'list',
    isLoading?: boolean
}) {
    const { handleDbError } = useErrorHandler();

    // ✅ 使用本地狀態管理樂觀更新
    const [localDocs, setLocalDocs] = React.useState<Source[]>(initialDocs as Source[])

    // ✅ 當 initialDocs 變化時同步更新本地狀態
    React.useEffect(() => {
        setLocalDocs(initialDocs as Source[])
    }, [initialDocs])

    // Client-side filtering
    const docs = React.useMemo(() => {
        if (!searchQuery.trim()) return localDocs;
        const query = searchQuery.toLowerCase();
        return localDocs.filter(doc =>
            doc.title.toLowerCase().includes(query) ||
            doc.type?.toLowerCase()?.includes(query)
        );
    }, [localDocs, searchQuery]);

    const router = useRouter()
    const [deletingId, setDeletingId] = React.useState<string | null>(null)
    const [docToDelete, setDocToDelete] = React.useState<Source | null>(null)
    const [editingDoc, setEditingDoc] = React.useState<Source | null>(null)
    const [editTitle, setEditTitle] = React.useState("")
    const [isEditPreviewOpen, setIsEditPreviewOpen] = React.useState(false)

    const handleDelete = (doc: Source) => {
        setDocToDelete(doc)
    }

    const handleEdit = (doc: Source) => {
        setEditingDoc(doc)
        setEditTitle(doc.title)
        setIsEditPreviewOpen(true)
    }

    const confirmEdit = async () => {
        if (!editingDoc || !editTitle.trim()) return

        const oldTitle = editingDoc.title
        const newTitle = editTitle.trim()

        // ✅ 樂觀更新：立即更新 UI
        setLocalDocs(prev => prev.map(doc =>
            doc.id === editingDoc.id ? { ...doc, title: newTitle } : doc
        ))
        setIsEditPreviewOpen(false)
        setEditingDoc(null)

        const supabase = createClient()
        try {
            const { error } = await supabase
                .from('sources')
                .update({ title: newTitle })
                .eq('id', editingDoc.id)

            if (error) throw error
            toast.success('文件標題已更新')
            // ✅ 背景同步 Server Component 數據（不阻塞 UI）
            router.refresh()
        } catch (error) {
            // ✅ 失敗時回滾
            setLocalDocs(prev => prev.map(doc =>
                doc.id === editingDoc.id ? { ...doc, title: oldTitle } : doc
            ))
            handleDbError(error, 'UpdateDocumentTitle', {
                userMessage: '無法更新標題',
                metadata: { documentId: editingDoc.id }
            })
        }
    }

    const confirmDelete = async () => {
        if (!docToDelete) return

        const doc = docToDelete

        // ✅ 樂觀更新：立即從 UI 中移除
        setLocalDocs(prev => prev.filter(d => d.id !== doc.id))
        setDocToDelete(null)

        setDeletingId(doc.id)
        const supabase = createClient()

        try {
            // 1. Delete from Storage (raw-files)
            const { error: storageError } = await supabase.storage
                .from('raw-files')
                .remove([doc.origin_url])

            if (storageError) {
                logger.warn('Storage file delete failed', 'KnowledgeList', {
                    documentId: doc.id,
                    originUrl: doc.origin_url,
                    error: storageError
                });
            }

            // 2. Delete from DB (Sources)
            const { error: dbError } = await supabase
                .from('sources')
                .delete()
                .eq('id', doc.id)

            if (dbError) throw dbError

            toast.success('Document deleted')
            logger.info('Document deleted successfully', 'KnowledgeList', {
                documentId: doc.id,
                documentTitle: doc.title
            });
            // ✅ 背景同步（不阻塞 UI）
            router.refresh()
        } catch (error) {
            // ✅ 失敗時回滾：恢復被刪除的文件
            setLocalDocs(prev => [...prev, doc].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ))
            handleDbError(error, 'DeleteDocument', {
                userMessage: 'Failed to delete document',
                metadata: { documentId: doc.id }
            });
        } finally {
            setDeletingId(null)
        }
    }

    if (isLoading) {
        return <KnowledgeListSkeleton count={6} />
    }

    if (docs.length === 0) {
        return (
            <div className="text-center py-20 border-2 border-dashed border-black/10 dark:border-white/10 rounded-none bg-black/5 dark:bg-white/5">
                <FileText className="h-12 w-12 mx-auto text-black/20 dark:text-white/20 mb-4" />
                <p className="font-mono text-sm font-black uppercase text-gray-500">
                    No matching records found.
                </p>
            </div>
        )
    }

    const gridView = (
        <div className="grid gap-4 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
                <Card
                    key={doc.id}
                    className="group relative flex flex-col overflow-visible border-[1.5px] border-black dark:border-white rounded-none bg-background transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]"
                >
                    <CardHeader className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <Badge
                                className={`
                                        rounded-none border-black dark:border-white font-mono text-[9px] uppercase font-black px-2 py-0.5
                                        ${doc.status === 'ready' ? 'bg-emerald-500 text-white' : doc.status === 'error' ? 'bg-[#FA4028] text-white' : 'bg-amber-400 text-black'}
                                    `}
                            >
                                {doc.status === 'processing' && <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin inline-block" />}
                                {doc.status.toUpperCase()}
                            </Badge>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted"
                                        disabled={deletingId === doc.id}
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-none border-black dark:border-white font-mono text-xs" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onClick={() => handleEdit(doc)}>
                                        EDIT_TITLE
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-black/10" />
                                    <DropdownMenuItem
                                        className="text-red-600 focus:bg-red-600 focus:text-white rounded-none cursor-pointer"
                                        onClick={() => handleDelete(doc)}
                                    >
                                        DELETE
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <CardTitle className="text-2xl font-black leading-[1.1] font-mono tracking-tighter uppercase group-hover:text-[#FA4028] transition-colors line-clamp-2">
                            {doc.title}
                        </CardTitle>

                        <div className="grid grid-cols-1 gap-2 pt-2">
                            <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-black dark:border-white space-y-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FA4028] uppercase tracking-[0.2em]">
                                    <FileText className="h-3.5 w-3.5" />
                                    SOURCE_ENTITY
                                </div>
                                <div className="text-xl font-black font-mono text-foreground break-words leading-tight line-clamp-1">
                                    {doc.type || "UNDEFINED_DATA"}
                                </div>
                            </div>
                            <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-[#FA4028] space-y-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FA4028] uppercase tracking-[0.2em]">
                                    <Clock className="h-3.5 w-3.5" />
                                    TEMPORAL_STAMP
                                </div>
                                <div className="text-xl font-black font-mono text-foreground leading-tight">
                                    {new Date(doc.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardFooter className="px-5 py-3 flex items-center justify-between border-t border-black/5 dark:border-white/5 mt-auto opacity-40 hover:opacity-100 transition-opacity">
                        <div className="flex gap-4 text-[9px] font-mono uppercase font-bold italic">
                            <span>Upd: {new Date(doc.created_at).toLocaleDateString()}</span>
                            <span>Cre: {new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )

    const listView = (
        <div className="border-[1.5px] border-black dark:border-white bg-white dark:bg-black overflow-hidden rounded-none">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table className="min-w-[640px]">
                    <TableHeader>
                        <TableRow className="bg-muted border-b border-black dark:border-white hover:bg-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 italic">
                            <TableHead className="text-black dark:text-white py-3">STATUS</TableHead>
                            <TableHead className="text-black dark:text-white py-3">DOCUMENT_IDENTIFIER</TableHead>
                            <TableHead className="text-black dark:text-white py-3">DATA_TYPE</TableHead>
                            <TableHead className="text-black dark:text-white py-3">CREATED_AT</TableHead>
                            <TableHead className="text-right text-black dark:text-white py-3">OPS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-black/10 dark:divide-white/10">
                        {docs.map((doc) => (
                            <TableRow key={doc.id} className="hover:bg-[#FA4028]/5 transition-colors group border-b-0">
                                <TableCell>
                                    {doc.status === 'ready' ? (
                                        <Badge className="rounded-none bg-emerald-500 text-white text-[8px] font-black uppercase px-1.5 py-0">READY</Badge>
                                    ) : doc.status === 'error' ? (
                                        <Badge className="rounded-none bg-[#FA4028] text-white text-[8px] font-black uppercase px-1.5 py-0">FAIL</Badge>
                                    ) : (
                                        <Badge className="rounded-none bg-amber-400 text-black text-[8px] font-black uppercase px-1.5 py-0">PROC</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="font-mono text-sm font-black uppercase group-hover:text-[#FA4028] transition-colors truncate max-w-[300px]">
                                    <div className="flex items-center">
                                        <FileText className="w-3.5 h-3.5 mr-3 text-[#FA4028] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {doc.title}
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-[11px] font-bold text-foreground/60 uppercase border-l border-black/5 pl-4">
                                    {doc.type}
                                </TableCell>
                                <TableCell className="font-mono text-[11px] font-bold text-foreground/60 border-l border-black/5 pl-4">
                                    {new Date(doc.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right border-l border-black/5">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-none hover:bg-black hover:text-white transition-colors"
                                                disabled={deletingId === doc.id}
                                            >
                                                <MoreVertical className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-none border-black dark:border-white font-mono text-xs" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem onClick={() => handleEdit(doc)}>
                                                EDIT_TITLE
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-black/10" />
                                            <DropdownMenuItem
                                                className="text-red-600 focus:bg-red-600 focus:text-white rounded-none cursor-pointer"
                                                onClick={() => handleDelete(doc)}
                                            >
                                                DELETE
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )

    return (
        <div className="space-y-4">
            {viewMode === 'grid' ? gridView : listView}

            <AlertDialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
                <AlertDialogContent className="rounded-none border-2 border-black dark:border-white font-mono">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-black uppercase tracking-tight">CONFIRM_DELETE</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs font-bold">
                            // This will permanently delete &quot;{docToDelete?.title}&quot;.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none border-black border-2 font-black uppercase text-xs">CANCEL</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="rounded-none bg-[#FA4028] hover:bg-black text-white font-black uppercase text-xs transition-colors"
                        >
                            DELETE_RECORD
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Dialog */}
            <Dialog open={isEditPreviewOpen} onOpenChange={setIsEditPreviewOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-none border-4 border-black p-0">
                    <div className="p-6">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">編輯文件標題</DialogTitle>
                            <DialogDescription className="font-mono text-black dark:text-gray-400 uppercase text-xs mt-1">
                                // MODIFY THE DISPLAY TITLE FOR THIS DOCUMENT.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-title" className="text-sm font-black uppercase tracking-widest">文件標題</Label>
                                <Input
                                    id="edit-title"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    placeholder="輸入新的標題..."
                                    className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                                />
                            </div>
                        </div>
                        <DialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                            <Button variant="outline" onClick={() => setIsEditPreviewOpen(false)} className="rounded-none border-black border-2 font-black uppercase tracking-widest hover:bg-gray-100">
                                取消
                            </Button>
                            <Button
                                onClick={confirmEdit}
                                className="rounded-none border-black border-2 bg-black hover:bg-zinc-800 text-white font-black uppercase tracking-widest"
                            >
                                確認更新
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
