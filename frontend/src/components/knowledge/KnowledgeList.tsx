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

interface KnowledgeDoc {
    id: string
    filename: string
    file_path: string
    size_bytes: number
    content_type: string
    embedding_status: 'pending' | 'embedded' | 'failed'
    created_at: string
}

export function KnowledgeList({ initialDocs }: { initialDocs: KnowledgeDoc[] }) {
    const router = useRouter()
    const [deletingId, setDeletingId] = React.useState<string | null>(null)

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const handleDelete = async (doc: KnowledgeDoc) => {
        if (!confirm('Are you sure you want to delete this document?')) return

        setDeletingId(doc.id)
        const supabase = createClient()

        try {
            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('documents')
                .remove([doc.file_path])

            if (storageError) throw storageError

            // 2. Delete from DB
            const { error: dbError } = await supabase
                .from('knowledge_docs')
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
        }
    }

    if (initialDocs.length === 0) {
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
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialDocs.map((doc) => (
                        <TableRow key={doc.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-blue-500" />
                                    {doc.filename}
                                </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {formatBytes(doc.size_bytes)}
                            </TableCell>
                            <TableCell>
                                {doc.embedding_status === 'embedded' ? (
                                    <div className="flex items-center text-green-600 text-xs font-medium">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Ready
                                    </div>
                                ) : doc.embedding_status === 'failed' ? (
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
        </div>
    )
}
