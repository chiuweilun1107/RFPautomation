"use client"

import * as React from "react"
import {
  Package, Table, Type, Layers, Plus,
  Heading1, Heading2, Heading3,
  AlignLeft, List, Grid3x3, Maximize,
  FileText, ChevronsLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DraggableComponent } from "./DraggableComponent"
import { getStyleNameCN } from "./styleUtils"
import type { Template } from "@/types"

interface ComponentLibraryPanelProps {
  template: Template
  onDragStart: () => void
  onComponentClick?: (id: number, type: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function ComponentLibraryPanel({ template, onDragStart, onComponentClick, isCollapsed, onToggleCollapse }: ComponentLibraryPanelProps) {
  const [activeTab, setActiveTab] = React.useState<'paragraphs' | 'tables' | 'sections'>('paragraphs')

  const getStyleIcon = (name: string) => {
    if (name.includes('Heading 1') || name.includes('標題 1')) return <Heading1 className="w-8 h-8 text-foreground" />
    if (name.includes('Heading 2') || name.includes('標題 2')) return <Heading2 className="w-8 h-8 text-foreground" />
    if (name.includes('Heading 3') || name.includes('標題 3')) return <Heading3 className="w-8 h-8 text-foreground" />
    if (name.includes('List') || name.includes('清單')) return <List className="w-8 h-8 text-foreground" />
    if (name.includes('Normal') || name.includes('內文')) return <AlignLeft className="w-8 h-8 text-foreground" />
    return <FileText className="w-8 h-8 text-foreground" />
  }

  // Collapsed State - "C" Block (Aligned with KnowledgeSidebar "K")
  if (isCollapsed) {
    return (
      <div
        className="w-16 h-16 border-2 border-black dark:border-white bg-background flex items-center justify-center transition-all duration-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black cursor-pointer group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
        onClick={onToggleCollapse}
        title="展開組件庫"
      >
        <span className="text-2xl font-black font-mono">C</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground font-mono">
      {/* Header - Aligned with KnowledgeSidebar height (h-16) */}
      <div className="flex items-center justify-between px-6 border-b-2 border-black dark:border-white shrink-0 h-16">
        <div>
          <h2 className="text-sm font-black tracking-widest uppercase leading-none min-h-[1.5rem] flex items-center">[ COMPONENT A ]</h2>
        </div>
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-6 w-6 rounded-none hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            title="收合側邊欄"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-2 p-0 bg-transparent border-b-2 border-black dark:border-white gap-0 rounded-none h-12 shrink-0">
          <TabsTrigger
            value="paragraphs"
            className="rounded-none h-full border-r-2 border-black dark:border-white data-[state=active]:bg-foreground data-[state=active]:text-background last:border-r-0 font-bold text-xs uppercase tracking-wider"
          >
            <Type className="w-4 h-4 mr-2" />
            TEXT
          </TabsTrigger>
          <TabsTrigger
            value="tables"
            className="rounded-none h-full data-[state=active]:bg-foreground data-[state=active]:text-background font-bold text-xs uppercase tracking-wider"
          >
            <Table className="w-4 h-4 mr-2" />
            TABLES
          </TabsTrigger>
        </TabsList>

        {/* Paragraphs Tab */}
        <TabsContent value="paragraphs" className="flex-1 overflow-y-auto m-0 p-0 data-[state=inactive]:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="divide-y-2 divide-black/10 dark:divide-white/10">
            {template.paragraphs && template.paragraphs.length > 0 ? (
              template.paragraphs.map((para: any, idx: number) => (
                <DraggableComponent
                  key={para.id || idx}
                  type="paragraph"
                  data={{
                    id: para.id || idx,
                    name: `段落 ${idx + 1}`,
                    text: para.text,
                    style: para.style
                  }}
                  onDragStart={onDragStart}
                  onClick={() => onComponentClick?.(idx, 'paragraph')}
                >
                  <div className="group flex items-center gap-3 p-4 border-b border-black/10 dark:border-white/10 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors font-mono cursor-pointer">
                    <div className="shrink-0 group-hover:scale-110 transition-transform">
                      {getStyleIcon(para.style)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black uppercase tracking-wider truncate mb-0.5">
                        PARA {idx + 1}
                      </div>
                      <div className="text-[10px] opacity-70 truncate font-sans group-hover:opacity-100">
                        {para.text || 'NO_CONTENT'}
                      </div>
                    </div>
                  </div>
                </DraggableComponent>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">
                NO_PARAGRAPHS_FOUND
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables" className="flex-1 overflow-y-auto m-0 p-0 data-[state=inactive]:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="divide-y-2 divide-black/10 dark:divide-white/10">
            {template.parsed_tables && template.parsed_tables.length > 0 ? (
              template.parsed_tables.map((table, idx) => (
                <DraggableComponent
                  key={table.name || `table-${idx}`}
                  type="table"
                  data={{
                    id: idx,
                    name: table.label || `表格 ${idx + 1}`,
                    table: table
                  }}
                  onDragStart={onDragStart}
                  onClick={() => onComponentClick?.(table.index ?? idx, 'table')}
                >
                  <div className="group flex items-center gap-3 p-4 border-b border-black/10 dark:border-white/10 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors font-mono cursor-pointer">
                    <div className="shrink-0 group-hover:scale-110 transition-transform">
                      <Grid3x3 className="w-8 h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black uppercase tracking-wider truncate mb-0.5">
                        TABLE {(table.index ?? idx) + 1}
                      </div>
                      <div className="text-[10px] opacity-70 truncate font-sans group-hover:opacity-100">
                        {table.label || 'SYSTEM_TABLE_CONTENT'}
                      </div>
                    </div>
                  </div>
                </DraggableComponent>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">
                NO_TABLES_FOUND
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add New Component Button */}
      <div className="p-4 border-t-2 border-black dark:border-white shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 rounded-none border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black uppercase text-xs font-bold tracking-wider h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          onClick={() => {
            // TODO: 實現新增元件功能
          }}
        >
          <Plus className="w-4 h-4" />
          [ ADD COMPONENT ]
        </Button>
      </div>
    </div >
  )
}