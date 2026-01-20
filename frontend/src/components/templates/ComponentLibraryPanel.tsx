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

  // Collapsed State - "C" Block
  if (isCollapsed) {
    return (
      <div
        className="flex flex-col h-full bg-background border-r-2 border-black dark:border-white items-center cursor-pointer hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all group"
        onClick={onToggleCollapse}
        title="Expand Component Library"
      >
        <div className="h-[60px] w-full flex items-center justify-center border-b-2 border-black dark:border-white group-hover:border-white dark:group-hover:border-black">
          <span className="text-2xl font-bold font-mono">C</span>
        </div>
        {/* Decorative pattern for the empty strip? Or just blank. Blank matches KnowledgeSidebar style. */}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground font-mono">
      {/* Header */}
      <div className="p-6 pb-4 space-y-4 border-b-2 border-black dark:border-white shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tighter uppercase leading-none min-h-[1.5rem] flex items-center">[ COMPONENT A ]</h2>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
              DRAG TO EDIT
            </p>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-2 hover:bg-muted rounded-none transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-black dark:hover:border-white"
              title="收合側邊欄"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
          )}
        </div>
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
        <TabsContent value="paragraphs" className="flex-1 overflow-y-auto px-4 py-4 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="grid grid-cols-2 gap-0 border-t-2 border-l-2 border-black dark:border-white">
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
                  <div className="aspect-square flex flex-col items-center justify-center p-2 bg-background border-r-2 border-b-2 border-black dark:border-white hover:bg-muted hover:text-foreground transition-all cursor-grab active:cursor-grabbing group rounded-none relative">
                    {/* Hover Indicator */}
                    <div className="absolute top-1 right-1 w-2 h-2 bg-black dark:bg-white opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="mb-2 group-hover:scale-105 transition-transform">
                      {getStyleIcon(para.style)}
                    </div>
                    <div className="text-[10px] text-center font-medium w-full">
                      <div className="font-bold mb-0.5 uppercase">PARA {idx + 1}</div>
                      <div className="truncate opacity-70 text-[9px] px-1 font-sans">
                        {para.text || 'No Content'}
                      </div>
                    </div>
                  </div>
                </DraggableComponent>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-muted-foreground text-xs uppercase border-b-2 border-r-2 border-black dark:border-white">
                NO PARAGRAPHS
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables" className="flex-1 overflow-y-auto px-4 py-4 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="grid grid-cols-2 gap-0 border-t-2 border-l-2 border-black dark:border-white">
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
                  <div className="aspect-square flex flex-col items-center justify-center p-2 bg-background border-r-2 border-b-2 border-black dark:border-white hover:bg-muted hover:text-foreground transition-all cursor-grab active:cursor-grabbing group rounded-none relative">
                    <div className="absolute top-1 right-1 w-2 h-2 bg-black dark:bg-white opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="mb-2 group-hover:scale-105 transition-transform">
                      <Grid3x3 className="w-8 h-8 text-foreground" />
                    </div>
                    <div className="text-[10px] text-center font-medium">
                      TABLE {(table.index ?? idx) + 1}
                    </div>
                  </div>
                </DraggableComponent>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-muted-foreground text-xs uppercase border-b-2 border-r-2 border-black dark:border-white">
                NO TABLES
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