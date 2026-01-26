"use client"

import * as React from "react"
import { getErrorMessage } from '@/lib/errorUtils';
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X } from "lucide-react"
import { toast } from "sonner"
import { templatesApi } from "@/features/templates/api/templatesApi"
import { useRouter } from "next/navigation"

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
    const router = useRouter()

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

            // 1. 使用字體處理 API 上傳並處理文件
            console.log('[上傳] 開始處理文件:', file.name)

            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/process-and-upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || '上傳失敗')
            }

            const result = await response.json()
            console.log('[上傳] 處理完成:', result.url, result.processedPath)

            // 2. Create template record with processed file path
            const { data: templateData, error: insertError } = await supabase
                .from('templates')
                .insert({
                    name,
                    description: description || null,
                    file_path: result.processedPath, // 使用處理後的文件路徑
                    category: category || null,
                    folder_id: selectedFolderId === "all" ? null : selectedFolderId,
                    owner_id: user.id,
                })
                .select()
                .single()

            if (insertError) throw insertError

            // NEW: Trigger Template Parsing (WF04) via n8n webhook
            try {
                toast.info("正在自動解析範本結構...")

                // Call the existing webhook logic
                const parseResponse = await fetch("/api/webhook/process-proposal-template", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        projectId: templateData.id, // In this context projectId acts as templateId for the parsing logic
                        filePath: templateData.file_path,
                        fileName: name,
                        mode: 'replace' // Initial parsing should replace any empty structure
                    }),
                });

                if (parseResponse.ok) {
                    toast.success("結構解析完成！")
                } else {
                    console.warn("Auto-parsing triggered but returned status:", parseResponse.status)
                    // We don't block the user, just warn
                    toast.warning("結構解析仍在後台進行中")
                }
            } catch (parseError) {
                console.error("Auto-parse trigger failed:", parseError)
                // Don't error out the whole upload process, just log it
            }

            toast.success("範本上傳成功！正在開啟編輯器...")

            // 3. 直接跳轉到編輯器頁面
            router.push(`/dashboard/templates/${templateData.id}/design`)

            // 清空表單（可選，因為會跳轉）
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
            setUploading(false)
        }
    }

    return (
        <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="template-name" className="text-sm font-black uppercase tracking-widest">範本名稱</Label>
                    <Input
                        id="template-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="例如:標準投標書範本"
                        required
                        className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="template-category" className="text-sm font-black uppercase tracking-widest">分類（選填）</Label>
                    <Input
                        id="template-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="例如:標案投標"
                        className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="template-description" className="text-sm font-black uppercase tracking-widest">描述（選填）</Label>
                    <Input
                        id="template-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="簡短描述此範本的用途"
                        className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="template-file" className="text-sm font-black uppercase tracking-widest">Word 檔案 (.docx)</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            id="template-file"
                            type="file"
                            accept=".docx"
                            onChange={handleFileChange}
                            required
                            className="rounded-none border-2 border-black font-mono file:rounded-none file:mr-4 file:py-1 file:px-4 file:border-0 file:text-sm file:font-black file:uppercase file:bg-black file:text-white hover:file:bg-[#FA4028] cursor-pointer"
                        />
                        {file && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setFile(null)}
                                className="shrink-0 rounded-none border-2 border-black hover:bg-red-50"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    {file && (
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-black dark:text-gray-400 bg-gray-100 p-2 border border-black uppercase italic">
                            <FileText className="h-4 w-4" />
                            <span>{file.name}</span>
                        </div>
                    )}
                </div>
            </div>
            <Button
                type="submit"
                disabled={uploading}
                className="w-full rounded-none border-2 border-black bg-[#FA4028] hover:bg-black text-white font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] py-6"
            >
                {uploading ? "上傳中..." : "確認上傳"}
            </Button>
        </form>
    )
}

