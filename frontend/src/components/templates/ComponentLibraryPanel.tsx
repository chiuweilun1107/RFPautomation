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

export function ComponentLibraryPanel({ template, onDragStart, onComponentClick, onToggleCollapse }: ComponentLibraryPanelProps) {
  const [activeTab, setActiveTab] = React.useState<'paragraphs' | 'tables' | 'sections'>('paragraphs')

  const getStyleIcon = (name: string) => {
    if (name.includes('Heading 1') || name.includes('標題 1')) return <Heading1 className="w-8 h-8 text-gray-700 dark:text-gray-300" />
    if (name.includes('Heading 2') || name.includes('標題 2')) return <Heading2 className="w-8 h-8 text-gray-700 dark:text-gray-300" />
    if (name.includes('Heading 3') || name.includes('標題 3')) return <Heading3 className="w-8 h-8 text-gray-700 dark:text-gray-300" />
    if (name.includes('List') || name.includes('清單')) return <List className="w-8 h-8 text-gray-700 dark:text-gray-300" />
    if (name.includes('Normal') || name.includes('內文')) return <AlignLeft className="w-8 h-8 text-gray-700 dark:text-gray-300" />
    return <FileText className="w-8 h-8 text-gray-700 dark:text-gray-300" />
  }



  return (
    <div className="flex flex-col h-full">
      {/* Header with Breadcrumb */}
      <div className="p-6 pb-4 space-y-4">


        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#00063D] dark:text-white font-serif tracking-tight">元件庫</h2>
            <p className="text-xs text-gray-400 mt-1 pl-0.5">
              拖曳元件到編輯區域
            </p>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
              title="收合側邊欄"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs - Removed Sections */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 m-2 mb-4 px-4 bg-transparent gap-2">
          <TabsTrigger
            value="paragraphs"
            className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 border border-transparent data-[state=active]:border-gray-200 rounded-md py-2"
          >
            <Type className="w-4 h-4 mr-2" />
            段落
          </TabsTrigger>
          <TabsTrigger
            value="tables"
            className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 border border-transparent data-[state=active]:border-gray-200 rounded-md py-2"
          >
            <Table className="w-4 h-4 mr-2" />
            表格
          </TabsTrigger>
        </TabsList>

        {/* Paragraphs Tab */}
        <TabsContent value="paragraphs" className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
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
                  <div className="aspect-square flex flex-col items-center justify-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10 hover:border-[#FA4028] hover:shadow-md transition-all cursor-grab active:cursor-grabbing group">
                    <div className="mb-2 group-hover:scale-110 transition-transform">
                      {getStyleIcon(para.style)}
                    </div>
                    <div className="text-[10px] text-center font-medium text-gray-600 dark:text-gray-300 w-full">
                      <div className="font-bold mb-0.5">段落 {idx + 1}</div>
                      <div className="truncate opacity-70 text-[9px] px-1">
                        {para.text || '無內容'}
                      </div>
                    </div>
                  </div>
                </DraggableComponent>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                無段落
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables" className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
            {/* ... keep existing map ... */}
            {template.parsed_tables && template.parsed_tables.length > 0 ? (
              template.parsed_tables.map((table, idx) => (
                <DraggableComponent
                  key={table.name || `table-${idx}`}
                  type="table"
                  data={{
                    id: idx, // Use array index as dragging ID
                    name: table.label || `表格 ${idx + 1}`,
                    table: table
                  }}
                  onDragStart={onDragStart}
                  onClick={() => onComponentClick?.(table.index ?? idx, 'table')}
                >
                  <div className="aspect-square flex flex-col items-center justify-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10 hover:border-[#FA4028] hover:shadow-md transition-all cursor-grab active:cursor-grabbing group">
                    <div className="mb-2 group-hover:scale-110 transition-transform">
                      <Grid3x3 className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div className="text-[10px] text-center font-medium text-gray-600 dark:text-gray-300">
                      表格 {(table.index ?? idx) + 1}
                    </div>
                  </div>
                </DraggableComponent>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                無表格
              </div>
            )}
          </div>
        </TabsContent>
        {/* Removed Sections Tab Content */}
      </Tabs>

      {/* Add New Component Button */}
      <div className="p-4 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => {
            // TODO: 實現新增元件功能
          }}
        >
          <Plus className="w-4 h-4" />
          新增元件
        </Button>
      </div>
    </div >
  )
}