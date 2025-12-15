"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Upload, X, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function UploadZone() {
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
                // 1. Upload to Storage
                const fileExt = file.name.split('.').pop()
                // Sanitize filename to strict alphanumeric + underscore
                const sanitizedName = file.name.replace(/[^a-zA-Z0-9]/g, '_')
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt || 'bin'}`
                const filePath = `${fileName}`

                console.log(`Attempting upload: ${filePath}, Size: ${file.size}`)

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, file, {
                        upsert: false
                    })

                if (uploadError) {
                    console.error('Storage Upload Error Raw:', uploadError)
                    throw new Error(`Storage Error: ${uploadError.message} (Status: ${(uploadError as any).statusCode})`)
                }

                console.log('Upload success, inserting into DB...')

                // 2. Insert into DB
                const { error: dbError } = await supabase
                    .from('knowledge_docs')
                    .insert({
                        filename: file.name,
                        file_path: filePath,
                        size_bytes: file.size,
                        content_type: file.type,
                        embedding_status: 'pending'
                    })

                if (dbError) {
                    console.error('DB Insert Error Raw:', dbError)
                    // Clean up storage if DB failed
                    await supabase.storage.from('documents').remove([filePath])
                    throw new Error(`Database Error: ${dbError.message} (Code: ${dbError.code})`)
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
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div
            className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ease-in-out
                ${isDragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600"
                }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
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
                <div className={`p-4 rounded-full bg-gray-100 dark:bg-zinc-800 ${isUploading ? 'animate-pulse' : ''}`}>
                    {isUploading ? (
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    ) : (
                        <Upload className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                    )}
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {isUploading ? "Uploading..." : "Click or drag files to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground text-gray-500">
                        PDF, DOCX, TXT (Max 10MB)
                    </p>
                </div>

                {!isUploading && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Select Files
                    </Button>
                )}
            </div>
        </div>
    )
}
