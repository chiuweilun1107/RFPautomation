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
            <SheetContent side="right" className="w-[60vw] sm:max-w-[60vw] overflow-hidden flex flex-col">
                <SheetHeader className="shrink-0 space-y-4">
                    {/* Title and Metadata */}
                    <div className="space-y-1">
                        <SheetTitle className="text-2xl font-bold">
                            {template.name}
                        </SheetTitle>
                        <div className="space-y-0.5">
                            <SheetDescription className="flex items-center gap-2 text-sm">
                                {template.category && (
                                    <>
                                        <span>{template.category}</span>
                                        <span>•</span>
                                    </>
                                )}
                                <span>{formatDate(template.created_at)}</span>
                            </SheetDescription>
                            {template.description && (
                                <p className="text-sm text-muted-foreground">
                                    {template.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {onEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onEdit(template)
                                    onOpenChange(false)
                                }}
                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
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
                                className="bg-[#FA4028] hover:bg-[#D93620] text-white font-bold"
                            >
                                下載範本
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                {/* Template Content Preview - 優化版 */}
                <div className="flex-1 mt-4 overflow-hidden">
                    <Tabs defaultValue="preview" className="h-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-2 shrink-0">
                            <TabsTrigger value="preview">文件預覽</TabsTrigger>
                            <TabsTrigger value="structure">文件結構</TabsTrigger>
                        </TabsList>

                        {/* 文件預覽頁籤 - 使用 docx-preview (保留字體) */}
                        <TabsContent value="preview" className="flex-1 mt-4 overflow-hidden">
                            <div className="h-full border rounded-lg overflow-hidden">
                                {publicUrl ? (
                                    <DocxPreview
                                        fileUrl={publicUrl}
                                        className="h-full"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* 文件結構頁籤 - 移除多餘容器和滾動條 */}
                        <TabsContent value="structure" className="flex-1 mt-4 overflow-hidden">
                            <StructureView
                                styles={template.styles}
                                paragraphs={template.paragraphs}
                                tables={template.parsed_tables}
                                sections={template.sections}
                                pageBreaks={template.page_breaks}
                                engine={template.engine}
                                version={template.template_version}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    )
}

