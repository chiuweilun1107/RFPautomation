"use client"

import * as React from "react"
import { getErrorMessage } from '@/lib/errorUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { FileText, Loader2, Download, CheckCircle2 } from "lucide-react"

interface Template {
    id: string
    name: string
    description: string | null
    file_path: string
    category: string | null
}

interface Section {
    id: string
    content: string
    content_draft?: string
    title?: string
    children?: Section[]
}

interface SelectTemplateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
    sections: Section[]
}

export function SelectTemplateDialog({ open, onOpenChange, projectId, sections }: SelectTemplateDialogProps) {
    const [templates, setTemplates] = React.useState<Template[]>([])
    const [loading, setLoading] = React.useState(false)
    const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null)
    const [generating, setGenerating] = React.useState(false)
    const supabase = createClient()

    // 載入範本列表
    React.useEffect(() => {
        if (open) {
            fetchTemplates()
        }
    }, [open])

    const fetchTemplates = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setTemplates(data || [])
        } catch (error) {
            console.error('Failed to fetch templates:', error)
            toast.error('載入範本失敗')
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateDocument = async () => {
        if (!selectedTemplateId) {
            toast.error('請選擇範本')
            return
        }

        setGenerating(true)
        try {
            // 準備章節資料
            const sectionsData = sections.map(section => ({
                id: section.id,
                title: section.content || section.title,
                content: section.content_draft || ''
            }))

            // 呼叫 API 觸發 n8n 工作流
            const response = await fetch('/api/generate-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: projectId,
                    template_id: selectedTemplateId,
                    sections: sectionsData
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || '生成失敗')
            }

            toast.success('文件生成成功!', {
                description: '正在下載...'
            })

            // 下載文件
            if (data.download_url) {
                window.open(data.download_url, '_blank')
            }

            onOpenChange(false)
        } catch (error) {
            console.error('Failed to generate document:', error)
            toast.error(getErrorMessage(error) || '生成文件失敗')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">選擇範本生成文件</DialogTitle>
                    <DialogDescription>
                        選擇一個 Word 範本,系統將自動填入章節內容並生成完整文件
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#FA4028]" />
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="text-center p-12 border-2 border-dashed rounded-lg">
                            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500">尚無範本</p>
                            <p className="text-sm text-gray-400 mt-2">請先到範本庫上傳範本</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => setSelectedTemplateId(template.id)}
                                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                                        selectedTemplateId === template.id
                                            ? 'border-[#FA4028] bg-[#FA4028]/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-[#FA4028]" />
                                                <h3 className="font-semibold">{template.name}</h3>
                                                {selectedTemplateId === template.id && (
                                                    <CheckCircle2 className="w-5 h-5 text-[#FA4028]" />
                                                )}
                                            </div>
                                            {template.description && (
                                                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                                            )}
                                            {template.category && (
                                                <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 rounded">
                                                    {template.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button
                        onClick={handleGenerateDocument}
                        disabled={!selectedTemplateId || generating}
                        className="bg-[#FA4028] hover:bg-[#FA4028]/90"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                生成中...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                生成文件
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

