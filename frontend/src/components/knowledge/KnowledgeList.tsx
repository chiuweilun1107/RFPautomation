"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { FileText, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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

export function KnowledgeList({ initialDocs }: { initialDocs: any[] }) {
    const docs = initialDocs as Source[]
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

            // Note: Even if storage delete fails (file missing), we should try to delete from DB
            if (storageError) console.error("Storage delete failed", storageError)

            // 2. Delete from DB (Sources)
            const { error: dbError } = await supabase
                .from('sources')
                .delete()
                .eq('id', doc.id)

            if (dbError) throw dbError

            toast.success('Document deleted')
            router.refresh()
        } catch (error) {
            console.error('Delete failed:', error)
            toast.error('Failed to delete document')
        } finally {
            setDeletingId(null)
            setDocToDelete(null)
        }
    }

    if (docs.length === 0) {
        return (
            <div className="text-center py-12 text-sm text-gray-500">
                No documents uploaded yet.
            </div>
        )
    }

    return (
        <div className="rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-black overflow-hidden mt-6">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-zinc-900 hover:bg-gray-50">
                        <TableHead>Document Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {docs.map((doc) => (
                        <TableRow key={doc.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-blue-500" />
                                    {doc.title}
                                </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground uppercase">
                                {doc.type}
                            </TableCell>
                            <TableCell>
                                {doc.status === 'ready' ? (
                                    <div className="flex items-center text-green-600 text-xs font-medium">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Ready
                                    </div>
                                ) : doc.status === 'error' ? (
                                    <div className="flex items-center text-red-600 text-xs font-medium">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Failed
                                    </div>
                                ) : (
                                    <div className="flex items-center text-yellow-600 text-xs font-medium">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Processing
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {new Date(doc.created_at).toISOString().split('T')[0]}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(doc)}
                                    disabled={deletingId === doc.id}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                    {deletingId === doc.id ? (
                                        <Clock className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <AlertDialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete &quot;{docToDelete?.title}&quot;.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
