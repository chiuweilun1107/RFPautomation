"use client"

import * as React from "react"
import type { Template } from "@/types"
import { createClient } from "@/lib/supabase/client"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, FileText } from "lucide-react"
import { StructureView } from "./StructureView"
import { DocxPreview } from "./DocxPreview"
import "./docx-preview.css"



interface TemplatePreviewSheetProps {
    template: Template | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit?: (template: Template) => void
    onDownload?: (template: Template) => void
}

export function TemplatePreviewSheet({
    template,
    open,
    onOpenChange,
    onEdit,
    onDownload,
}: TemplatePreviewSheetProps) {
    const [publicUrl, setPublicUrl] = React.useState<string>("")
    const supabase = createClient()

    React.useEffect(() => {
        if (template && open) {
            getPublicUrl()
        }
    }, [template, open])

    const getPublicUrl = async () => {
        if (!template || !template.file_path) return

        try {
            const { data } = supabase.storage
                .from('raw-files')
                .getPublicUrl(template.file_path)

            setPublicUrl(data.publicUrl)
        } catch (error) {
            console.error('Failed to get public URL:', error)
        }
    }



    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    }

    if (!template) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[60vw] sm:max-w-[60vw] overflow-hidden flex flex-col rounded-none border-l-4 border-black p-0">
                <div className="flex flex-col h-full">
                    <SheetHeader className="shrink-0 space-y-6 p-8 bg-black text-white">
                        {/* Title and Metadata */}
                        <div className="space-y-3">
                            <SheetTitle className="text-4xl font-black uppercase tracking-tighter text-white">
                                {template.name}
                            </SheetTitle>
                            <div className="space-y-2">
                                <SheetDescription className="flex items-center gap-3 text-xs font-mono font-bold text-[#FA4028] uppercase italic">
                                    {template.category && (
                                        <>
                                            <span className="bg-white text-black px-1">{template.category}</span>
                                            <span className="text-white">//</span>
                                        </>
                                    )}
                                    <span>{formatDate(template.created_at)} CREATED</span>
                                </SheetDescription>
                                {template.description && (
                                    <p className="text-sm font-mono text-gray-400 uppercase leading-tight">
                                        {template.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {onEdit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onEdit(template)
                                        onOpenChange(false)
                                    }}
                                    className="rounded-none border-2 border-white bg-transparent text-white hover:bg-white hover:text-black font-black uppercase tracking-widest text-xs"
                                >
                                    編輯資訊
                                </Button>
                            )}
                            {onDownload && (
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        onDownload(template)
                                    }}
                                    className="rounded-none border-2 border-[#FA4028] bg-[#FA4028] hover:bg-white hover:text-black hover:border-white text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] active:shadow-none"
                                >
                                    下載範本
                                </Button>
                            )}
                        </div>
                    </SheetHeader>

                    {/* Template Content Preview */}
                    <div className="flex-1 overflow-hidden p-8 bg-white dark:bg-black">
                        <Tabs defaultValue="preview" className="h-full flex flex-col">
                            <TabsList className="flex w-full bg-gray-100 dark:bg-zinc-900 rounded-none p-1 border-2 border-black mb-8">
                                <TabsTrigger
                                    value="preview"
                                    className="flex-1 rounded-none font-black uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-black"
                                >
                                    文件預覽
                                </TabsTrigger>
                                <TabsTrigger
                                    value="structure"
                                    className="flex-1 rounded-none font-black uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-black"
                                >
                                    文件結構
                                </TabsTrigger>
                            </TabsList>

                            {/* 文件預覽頁籤 */}
                            <TabsContent value="preview" className="flex-1 mt-0 overflow-hidden">
                                <div className="h-full border-4 border-black rounded-none overflow-hidden bg-gray-50 dark:bg-zinc-950">
                                    {publicUrl ? (
                                        <DocxPreview
                                            fileUrl={publicUrl}
                                            className="h-full"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="w-12 h-12 animate-spin text-black dark:text-white" />
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* 文件結構頁籤 */}
                            <TabsContent value="structure" className="flex-1 mt-0 overflow-hidden border-4 border-black bg-gray-50 dark:bg-zinc-950 p-4">
                                <StructureView
                                    styles={template.styles as any}
                                    paragraphs={template.paragraphs as any}
                                    tables={template.parsed_tables as any}
                                    sections={template.sections as any}
                                    pageBreaks={template.page_breaks as any}
                                    engine={template.engine}
                                    version={template.template_version}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

