"use client"

import * as React from "react"
import type { Template, TemplateComponent } from "@/types"
import { useDroppable } from "@dnd-kit/core"
import { FileEdit } from "lucide-react"
import { EditableParagraph } from "./EditableParagraph"
import { EditableTable } from "./EditableTable"
import { EditableImage } from './EditableImage'
import { VariableRenderer } from './VariableRenderer'
import { DroppableZone } from "./DroppableZone"



interface EditorCanvasProps {
  template: Template
  selectedComponent: any
  deletedComponents: string[]
  onSelectComponent: (component: any) => void
  onComponentChange: () => void
}

export function EditorCanvas({
  template,
  selectedComponent,
  deletedComponents = [],
  onSelectComponent,
  onComponentChange
}: EditorCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'editor-canvas',
  })

  // 渲染元件邏輯：優先使用 structure，若無則降級為舊邏輯
  const renderComponents = () => {
    const components: TemplateComponent[] = []

    // 1. 如果有 structure 並且是舊格式（數組），依照 structure 順序渲染
    // Note: structure is now TemplateStructure (object), but legacy code may have array
    const structureArray = Array.isArray(template.structure) ? template.structure : null;

    if (structureArray && structureArray.length > 0) {
      structureArray.forEach((item: any, index: number) => {
        // 忽略已刪除的元件
        if (deletedComponents.includes(`${item.type}-${item.id}`)) {
          return
        }

        if (item.type === 'field') {
          const fields = template.parsed_fields || []
          const fieldData = fields.find(f => f.name === item.id || f.id === item.id)

          if (fieldData) {
            components.push({
              type: 'paragraph', // EditableParagraph 處理一般段落/欄位
              data: { ...fieldData, index: index },
              id: item.id
            })
          }
        } else if (item.type === 'paragraph') {
          // Look in paragraphs list first
          const paragraphs = template.paragraphs || []
          const paraData = paragraphs.find(p => p.id === item.id)

          if (paraData) {
            components.push({
              type: 'paragraph',
              data: { ...paraData, index: index },
              id: item.id
            })
          } else if (item.text || item.runs) {
            // Fallback: Use data directly from structure item (legacy/fallback)
            components.push({
              type: 'paragraph',
              data: {
                index: index,
                text: item.text || "",
                format: item.format || (typeof item.style === 'object' ? item.style : {}),
                style: typeof item.style === 'string' ? item.style : "Normal",
                runs: item.runs
              },
              id: item.id
            })
          }
        } else if (item.type === 'table') {
          const tables = template.parsed_tables || []
          const tableData = tables.find(t => t.name === item.id || t.id === item.id)

          if (tableData) {
            components.push({
              type: 'table',
              data: { ...tableData, index: index, defaultFontSize: template.doc_default_size },
              id: item.id
            })
          }
        } else if (item.type === 'image') {
          // 圖片直接使用 structure 中的 url 或去 parsed_images 找
          // structure 裡已經有 url 了
          components.push({
            type: 'image',
            data: {
              url: item.url,
              width: item.width,
              height: item.height,
              index: index,
              format: item.format
            },
            id: item.id
          })
        } else if (item.type === 'page_break') {
          components.push({
            type: 'pageBreak',
            id: item.id,
            data: { order_index: index }
          })
        }
      })
    } else {
      // 2. 舊邏輯：合併段落和表格，按順序顯示
      if (template.paragraphs) {
        template.paragraphs.forEach((para) => {
          if (!deletedComponents.includes(`paragraph-${para.index}`)) {
            components.push({
              type: 'paragraph',
              data: para,
              id: `paragraph-${para.index}`,
              sortIndex: para.index
            })
          }
        })
      }

      if (template.parsed_tables) {
        template.parsed_tables.forEach((table) => {
          if (!deletedComponents.includes(`table-${table.index}`)) {
            components.push({
              type: 'table',
              data: { ...table, defaultFontSize: template.doc_default_size },
              id: `table-${table.index}`,
              sortIndex: table.index
            })
          }
        })
      }

      // 按索引排序
      components.sort((a, b) => (a.sortIndex || 0) - (b.sortIndex || 0))
    }

    // 檢查是否有遺漏的圖片 (paragraph_index = -1 或未被加入 structure)
    if (template.parsed_images && template.parsed_images.length > 0) {
      const existingImageIds = new Set(
        components
          .filter(c => c.type === 'image')
          .map(c => c.id)
      )

      // 同時檢查表格內是否已經使用了這些圖片
      if (template.parsed_tables) {
        template.parsed_tables.forEach(table => {
          // Check 'cells' array directly because 'rows' may not contain detailed cell data
          if (table.cells && Array.isArray(table.cells)) {
            table.cells.forEach((cell: any) => {
              if (cell.runs && Array.isArray(cell.runs)) {
                cell.runs.forEach((run: any) => {
                  if (run.type === 'image' && run.image_data && run.image_data.id) {
                    existingImageIds.add(run.image_data.id)
                  }
                })
              }
            })
          }
        })
      }

      template.parsed_images.forEach((img, idx) => {
        if (img.id && !existingImageIds.has(img.id)) {
          // 這些通常是 index -1 的圖片，放在最後面或作為獨立區塊
          components.push({
            type: 'image',
            data: {
              url: img.url,
              width: img.width,
              height: img.height,
              index: -1,
              format: img.format
            },
            id: img.id,
            // 確保這些圖片排在最後，或者是原本應該出現的位置
            sortIndex: 9999 + idx
          })
        }
      })
    }

    return components
  }

  // 將元件按照 'page_break' 分組
  const groupComponentsByPage = (components: any[]) => {
    const pages: any[][] = [[]]
    let currentPageIndex = 0

    components.forEach((comp) => {
      if (comp.type === 'page_break') {
        pages.push([])
        currentPageIndex++
      } else {
        pages[currentPageIndex].push(comp)
      }
    })

    return pages
  }

  const allComponents = renderComponents()
  const pages = groupComponentsByPage(allComponents)

  // 獲取第一節的頁面資訊 (目前假設單節文件)
  const mainSection = template.sections && template.sections.length > 0 ? template.sections[0] : null
  const paperStyle: React.CSSProperties = mainSection ? {
    width: `${mainSection.page_width}pt`,
    minHeight: `${mainSection.page_height}pt`,
    paddingTop: `${mainSection.margin_top}pt`,
    paddingBottom: `${mainSection.margin_bottom}pt`,
    paddingLeft: `${mainSection.margin_left}pt`,
    paddingRight: `${mainSection.margin_right}pt`,
  } : {}

  return (
    <div className="h-full w-full overflow-y-auto scrollbar-hide p-12 bg-[#F9F9FB] dark:bg-gray-950/50 flex flex-col items-center">
      {pages.map((pageComponents, pageIdx) => (
        <div key={`page-${pageIdx}`} className="mb-8 last:mb-0 relative">
          {/* Page Label */}
          <div className="absolute -left-16 top-0 text-[10px] font-mono text-gray-400 select-none uppercase tracking-widest [writing-mode:vertical-lr]">
            Page {pageIdx + 1}
          </div>

          {/* The Paper Sheet */}
          <div
            ref={pageIdx === 0 ? setNodeRef : undefined} // Only first page for drop ref for now, or simplify
            style={paperStyle}
            className={`
              bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-white/5 relative
              transition-all duration-200 ease-in-out
              ${!mainSection ? 'max-w-4xl min-h-[1123px] p-16' : ''}
              ${isOver && pageIdx === 0 ? 'ring-2 ring-[#FA4028]/20 bg-blue-50/5' : ''}
            `}
          >
            <div>
              {pageComponents.length > 0 ? (
                pageComponents.map((component, idx) => (
                  <div
                    key={`${component.type}-${component.id}-${idx}`}
                    id={`${component.type}-${component.id}`}
                    className="relative group"
                  >
                    {/* Drop Zone */}
                    <DroppableZone
                      id={`drop-before-${component.id}`}
                      onDrop={() => onComponentChange()}
                    />

                    {/* Component Rendering */}
                    {component.type === 'paragraph' ? (
                      <EditableParagraph
                        paragraph={component.data}
                        isSelected={selectedComponent?.id === component.id}
                        onClick={() => {
                          onSelectComponent({
                            id: component.id,
                            type: 'paragraph',
                            data: component.data
                          })
                        }}
                        onEdit={() => onComponentChange()}
                      />
                    ) : component.type === 'table' ? (
                      <EditableTable
                        table={component.data}
                        isSelected={selectedComponent?.id === component.id}
                        onClick={() => {
                          onSelectComponent({
                            id: component.id,
                            type: 'table',
                            data: component.data
                          })
                        }}
                        onEdit={() => onComponentChange()}
                      />
                    ) : component.type === 'image' ? (
                      <EditableImage
                        image={component.data}
                        isSelected={selectedComponent?.id === component.id}
                        onClick={() => {
                          onSelectComponent({
                            id: component.id,
                            type: 'image',
                            data: component.data
                          })
                        }}
                      />
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-300">
                  {/* Empty page placeholder if needed */}
                </div>
              )}

              {/* Final Drop Zone for the page */}
              {pageIdx === pages.length - 1 && (
                <DroppableZone
                  id="drop-final"
                  onDrop={() => onComponentChange()}
                />
              )}
            </div>
          </div>
        </div>
      ))}

      {allComponents.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[800px] text-gray-300 dark:text-gray-700">
          <div className="text-7xl mb-6 opacity-20">📄</div>
          <p className="text-xl font-serif font-medium mb-2 text-gray-400">空白文件</p>
          <p className="text-sm text-gray-400">從左側拖曳元件開始設計</p>
        </div>
      )}
    </div>
  )
}
