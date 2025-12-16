"use client"

import { useState, useEffect, useId } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SourceManager } from "@/components/workspace/SourceManager"
import { CriteriaList } from "@/components/workspace/CriteriaList"

interface KnowledgeSidebarProps {
    projectId: string;
    onSelectSource?: (source: any) => void;
}

export function KnowledgeSidebar({ projectId, onSelectSource }: KnowledgeSidebarProps) {
    const [mounted, setMounted] = useState(false)

    // 確保只在 client 端渲染 Tabs，避免 hydration ID 不匹配
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <aside className="w-[350px] border-r flex flex-col bg-muted/10 shrink-0">
                <div className="p-4 font-semibold text-sm border-b flex items-center gap-2">
                    專案知識庫
                </div>
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    載入中...
                </div>
            </aside>
        )
    }

    return (
        <aside className="w-[350px] border-r flex flex-col bg-muted/10 shrink-0">
            <div className="p-4 font-semibold text-sm border-b flex items-center gap-2">
                專案知識庫
            </div>
            <Tabs defaultValue="sources" className="flex-1 flex flex-col h-full">
                <div className="px-4 py-2 border-b">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="sources">知識來源</TabsTrigger>
                        <TabsTrigger value="criteria">評分構面</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="sources" className="flex-1 overflow-hidden m-0 p-4 data-[state=inactive]:hidden">
                    <SourceManager projectId={projectId} onSelectSource={onSelectSource} />
                </TabsContent>

                <TabsContent value="criteria" className="flex-1 overflow-hidden m-0 p-4 data-[state=inactive]:hidden">
                    <CriteriaList />
                </TabsContent>
            </Tabs>
        </aside>
    )
}

