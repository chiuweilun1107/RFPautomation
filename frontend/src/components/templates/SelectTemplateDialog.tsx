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
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-none border-4 border-black p-0">
                <div className="p-8">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-black uppercase tracking-tight">選擇範本生成文件 // GENERATE_DOC</DialogTitle>
                        <DialogDescription className="font-mono text-black dark:text-gray-400 uppercase text-xs mt-2 italic font-bold">
                            // SELECT WORD TEMPLATE TO AUTO-FILL CHAPTERS.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {loading ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="w-12 h-12 animate-spin text-[#FA4028]" />
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="text-center p-12 border-4 border-dashed border-black rounded-none bg-gray-50">
                                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                <p className="font-mono font-black uppercase">尚無範本 // NO_TEMPLATES</p>
                                <p className="text-sm font-mono text-gray-400 mt-2 uppercase">請先到範本庫上傳範本</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {templates.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => setSelectedTemplateId(template.id)}
                                        className={`p-4 border-2 transition-all rounded-none ${selectedTemplateId === template.id
                                                ? 'border-black bg-[#FA4028] text-white shadow-[4px_4px_0_0_#000]'
                                                : 'border-black bg-white hover:bg-gray-100 text-black'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <FileText className={`w-5 h-5 ${selectedTemplateId === template.id ? 'text-white' : 'text-[#FA4028]'}`} />
                                                    <h3 className="font-black uppercase tracking-widest">{template.name}</h3>
                                                    {selectedTemplateId === template.id && (
                                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                                    )}
                                                </div>
                                                {template.description && (
                                                    <p className={`text-xs font-mono mt-2 uppercase ${selectedTemplateId === template.id ? 'text-white/80' : 'text-gray-500'}`}>
                                                        {template.description}
                                                    </p>
                                                )}
                                                {template.category && (
                                                    <span className={`inline-block mt-3 px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter italic border ${selectedTemplateId === template.id
                                                            ? 'bg-white text-black border-white'
                                                            : 'bg-black text-white border-black'
                                                        }`}>
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

                    <div className="flex justify-end gap-4 mt-10 pt-6 border-t-2 border-black flex-col sm:flex-row">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-none border-2 border-black font-black uppercase tracking-widest flex-1 sm:flex-none"
                        >
                            CANCEL
                        </Button>
                        <Button
                            onClick={handleGenerateDocument}
                            disabled={!selectedTemplateId || generating}
                            className="rounded-none border-2 border-black bg-[#FA4028] hover:bg-black text-white font-black uppercase tracking-widest flex-1 sm:flex-none shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    GENERATING...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    GENERATE_DOCUMENT
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

