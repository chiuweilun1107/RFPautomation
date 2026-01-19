"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { sourcesApi } from "@/features/sources/api/sourcesApi"

interface UploadZoneProps {
    folders?: any[];
    selectedFolderId?: string | null;
    onFolderChange?: () => void;
    onUploadComplete?: () => void;
}

export function UploadZone({
    folders,
    selectedFolderId,
    onFolderChange,
    onUploadComplete
}: UploadZoneProps = {}) {
    const router = useRouter()
    const [isDragging, setIsDragging] = React.useState(false)
    const [isUploading, setIsUploading] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await uploadFiles(Array.from(e.dataTransfer.files))
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await uploadFiles(Array.from(e.target.files))
        }
    }

    const uploadFiles = async (files: File[]) => {
        setIsUploading(true)
        const supabase = createClient()
        let successCount = 0

        for (const file of files) {
            try {
                // 1. Upload to Storage (raw-files)
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt || 'bin'}`
                const filePath = `${fileName}`

                console.log(`Attempting upload: ${filePath}, Size: ${file.size}`)

                const { error: uploadError } = await supabase.storage
                    .from('raw-files')
                    .upload(filePath, file)

                if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`)

                // 2. Create Source & Trigger n8n (via API)
                try {
                    await sourcesApi.create({
                        title: file.name,
                        origin_url: filePath,
                        type: fileExt === 'pdf' ? 'pdf' : 'docx',
                        status: 'processing',
                        project_id: '',
                    });
                } catch (apiError: any) {
                    // Clean up storage if DB/API failed
                    await supabase.storage.from('raw-files').remove([filePath])
                    throw new Error(apiError.message || 'API Error')
                }

                successCount++
            } catch (error: any) {
                console.error('Operation Failed:', error)
                toast.error(`Failed ${file.name}: ${error.message || 'Unknown error'}`)
            }
        }

        setIsUploading(false)
        if (successCount > 0) {
            toast.success(`Successfully uploaded ${successCount} files`)
            router.refresh()

            // Call onUploadComplete callback if provided
            if (onUploadComplete) {
                onUploadComplete()
            }
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div
            className={`
                relative border-2 border-dashed rounded-none p-8 text-center transition-all duration-300 ease-in-out cursor-pointer
                ${isDragging
                    ? "border-black bg-black/5 scale-[1.01]"
                    : "border-black dark:border-white hover:border-black dark:hover:border-white hover:bg-black/5"
                }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.docx,.txt,.md"
            />

            <div className="flex flex-col items-center justify-center space-y-4">
                <div className={`w-12 h-12 rounded-none border-2 border-black dark:border-white flex items-center justify-center transition-colors group-hover:bg-black group-hover:text-white ${isUploading ? 'animate-pulse bg-black/10' : 'bg-background'}`}>
                    {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <Upload className="w-6 h-6" />
                    )}
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-black font-mono uppercase tracking-tighter">
                        {isUploading ? "PROCESS_UPLOADING..." : "CLICK_OR_DRAG_TO_INGEST"}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase opacity-60">
                        FORMAT_TYPES: PDF, DOCX, TXT // MAX_SIZE: 10MB
                    </p>
                </div>

                {!isUploading && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-none border-2 border-black dark:border-white font-mono font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-black hover:text-white transition-all"
                    >
                        SELECT_FILES
                    </Button>
                )}
            </div>
        </div>
    )
}
