"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { FileText, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useErrorHandler } from "@/hooks/useErrorHandler"
import { logger } from "@/lib/errors/logger"
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

interface Source {
    id: string
    title: string
    origin_url: string
    type: string
    status: 'processing' | 'ready' | 'error'
    created_at: string
}

import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreVertical, LayoutGrid, ArrowRight, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { KnowledgeListSkeleton } from "@/components/ui/skeletons/KnowledgeListSkeleton"

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
    const rawDocs = initialDocs as Source[]

    // Client-side filtering
    const docs = React.useMemo(() => {
        if (!searchQuery.trim()) return rawDocs;
        const query = searchQuery.toLowerCase();
        return rawDocs.filter(doc =>
            doc.title.toLowerCase().includes(query) ||
            doc.type?.toLowerCase()?.includes(query)
        );
    }, [rawDocs, searchQuery]);

    const router = useRouter()
    const [deletingId, setDeletingId] = React.useState<string | null>(null)
    const [docToDelete, setDocToDelete] = React.useState<Source | null>(null)

    const handleDelete = (doc: Source) => {
        setDocToDelete(doc)
    }

    const confirmDelete = async () => {
        if (!docToDelete) return

        const doc = docToDelete
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
            router.refresh()
        } catch (error) {
            handleDbError(error, 'DeleteDocument', {
                userMessage: 'Failed to delete document',
                metadata: { documentId: doc.id }
            });
        } finally {
            setDeletingId(null)
            setDocToDelete(null)
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

    if (viewMode === 'grid') {
        return (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted"
                                    onClick={() => handleDelete(doc)}
                                    disabled={deletingId === doc.id}
                                >
                                    {deletingId === doc.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                </Button>
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

                {/* Delete Dialog (Same as before) */}
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
            </div>
        )
    }

    return (
        <div className="border-[1.5px] border-black dark:border-white bg-white dark:bg-black overflow-hidden rounded-none">
            <Table>
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
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-none hover:bg-black hover:text-white transition-colors"
                                    onClick={() => handleDelete(doc)}
                                    disabled={deletingId === doc.id}
                                >
                                    {deletingId === doc.id ? (
                                        <Clock className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

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
        </div>
    )
}
