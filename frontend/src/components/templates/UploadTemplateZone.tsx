"use client"

import * as React from "react"
import { getErrorMessage } from '@/lib/errorUtils';
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X } from "lucide-react"
import { toast } from "sonner"

interface TemplateFolder {
    id: string
    name: string
}

interface UploadTemplateZoneProps {
    folders: TemplateFolder[]
    selectedFolderId: string | null | "all"
    onFolderChange: (folderId: string | null) => void
    onUploadComplete?: () => void
}

export function UploadTemplateZone({ folders, selectedFolderId, onFolderChange, onUploadComplete }: UploadTemplateZoneProps) {
    const [name, setName] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [category, setCategory] = React.useState("")
    const [file, setFile] = React.useState<File | null>(null)
    const [uploading, setUploading] = React.useState(false)
    const supabase = createClient()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.docx')) {
                toast.error("請選擇 .docx 檔案")
                return
            }
            setFile(selectedFile)
            // Auto-fill name from filename
            if (!name) {
                const fileName = selectedFile.name.replace('.docx', '')
                setName(fileName)
            }
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) {
            toast.error("請選擇檔案")
            return
        }

        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // 1. Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
            const filePath = `templates/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('raw-files')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Create template record
            const { data: templateData, error: insertError } = await supabase
                .from('templates')
                .insert({
                    name,
                    description: description || null,
                    file_path: filePath,
                    category: category || null,
                    folder_id: selectedFolderId === "all" ? null : selectedFolderId,
                    owner_id: user.id,
                })
                .select()
                .single()

            if (insertError) throw insertError

            // 3. Trigger n8n workflow to parse template
            fetch('/api/templates/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_id: templateData.id,
                    file_path: filePath
                })
            }).catch(err => {
                console.error("Failed to trigger template parsing:", err)
                toast.error("範本上傳成功,但解析失敗")
            })

            toast.success("範本上傳成功!正在解析...")
            setName("")
            setDescription("")
            setCategory("")
            setFile(null)

            if (onUploadComplete) {
                onUploadComplete()
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast.error(getErrorMessage(error) || "上傳失敗")
        } finally {
            setUploading(false)
        }
    }

    return (
        <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="template-name" className="font-bold">範本名稱</Label>
                    <Input
                        id="template-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="例如:標準投標書範本"
                        required
                        className="font-medium"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="template-category" className="font-bold">分類（選填）</Label>
                    <Input
                        id="template-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="例如:標案投標"
                        className="font-medium"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="template-description" className="font-bold">描述（選填）</Label>
                    <Input
                        id="template-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="簡短描述此範本的用途"
                        className="font-medium"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="template-file" className="font-bold">Word 檔案 (.docx)</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            id="template-file"
                            type="file"
                            accept=".docx"
                            onChange={handleFileChange}
                            required
                            className="font-medium"
                        />
                        {file && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setFile(null)}
                                className="shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    {file && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <FileText className="h-4 w-4" />
                            <span>{file.name}</span>
                        </div>
                    )}
                </div>
            </div>
            <Button
                type="submit"
                disabled={uploading}
                className="w-full bg-[#FA4028] hover:bg-[#D93620] text-white font-bold"
            >
                {uploading ? "上傳中..." : "確認上傳"}
            </Button>
        </form>
    )
}

