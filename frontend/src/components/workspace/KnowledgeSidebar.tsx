"use client"

import { useState, useEffect, useId } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronsLeft, ChevronsRight } from "lucide-react"
import { SourceManager } from "@/components/workspace/SourceManager"
import { CriteriaList } from "@/components/workspace/CriteriaList"

interface KnowledgeSidebarProps {
    projectId: string;
    onSelectSource?: (source: any) => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export function KnowledgeSidebar({
    projectId,
    onSelectSource,
    isCollapsed: externalIsCollapsed,
    onToggleCollapse
}: KnowledgeSidebarProps) {
    const [mounted, setMounted] = useState(false)
    const [internalIsCollapsed, setInternalIsCollapsed] = useState(false)

    // Use external state if provided, otherwise use internal state
    const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed
    const toggleCollapse = onToggleCollapse || (() => setInternalIsCollapsed(!internalIsCollapsed))

    // 確保只在 client 端渲染 Tabs，避免 hydration ID 不匹配
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <aside className="w-[350px] border flex flex-col bg-white dark:bg-black shrink-0 font-mono">
                {/* Loading state */}
            </aside>
        )
    }

    if (isCollapsed) {
        return (
            <aside className="w-[60px] h-[60px] border bg-white dark:bg-black shrink-0 font-mono flex items-center justify-center transition-all duration-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black cursor-pointer group"
                onClick={toggleCollapse}
                title="Expand Project Knowledge"
            >
                <div className="text-2xl font-bold">K</div>
            </aside>
        )
    }

    return (
        <aside className="w-[350px] border flex flex-col bg-white dark:bg-black shrink-0 font-mono transition-all duration-300">
            <div className="p-4 font-bold text-xs border-b flex items-center justify-between uppercase tracking-wider text-black dark:text-white h-16">
                <span>Project Knowledge</span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-none hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                    onClick={toggleCollapse}
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
            </div>
            <Tabs defaultValue="sources" className="flex-1 flex flex-col h-full">
                <div className="px-4 py-4 border-b border-black/10 dark:border-white/10">
                    <TabsList className="w-full grid grid-cols-2 bg-transparent p-0 gap-2 h-auto">
                        <TabsTrigger
                            value="sources"
                            className="rounded-none border border-black dark:border-white data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black text-[10px] uppercase tracking-wider h-8"
                        >
                            Sources
                        </TabsTrigger>
                        <TabsTrigger
                            value="criteria"
                            className="rounded-none border border-black dark:border-white data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black text-[10px] uppercase tracking-wider h-8"
                        >
                            Criteria
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="sources" className="flex-1 overflow-hidden m-0 p-4 data-[state=inactive]:hidden">
                    <SourceManager projectId={projectId} onSelectSource={onSelectSource} />
                </TabsContent>

                <TabsContent value="criteria" className="flex-1 overflow-hidden m-0 p-4 data-[state=inactive]:hidden">
                    <CriteriaList projectId={projectId} />
                </TabsContent>
            </Tabs>
        </aside>
    )
}

