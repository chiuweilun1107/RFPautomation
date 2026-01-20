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
import { HeaderSection } from "./HeaderSection"
import { FooterSection } from "./FooterSection"



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

  // 計算編號索引的輔助函數
  const calculateNumberingIndices = (components: any[]) => {
    // 追蹤每個 (numId, level) 組合的當前編號索引
    const numberingCounters = new Map<string, number>()

    return components.map(comp => {
      if (comp.data?.format?.numbering) {
        const { numId, level } = comp.data.format.numbering
        const key = `${numId}-${level}`

        // 獲取或初始化計數器
        const currentIndex = numberingCounters.get(key) || 0
        numberingCounters.set(key, currentIndex + 1)

        return {
          ...comp,
          data: {
            ...comp.data,
            numberingIndex: currentIndex
          }
        }
      }
      return comp
    })
  }

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
              id: `paragraph-${index}`
            })
          }
        } else if (item.type === 'paragraph') {
          // Look in paragraphs list first
          const paragraphs = template.paragraphs || []
          const paraData = paragraphs.find(p => p.id === item.id)

          if (paraData) {
            components.push({
              type: 'paragraph',
              data: { ...paraData, index: paraData.index ?? index },
              id: `paragraph-${paraData.index ?? index}`
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
              id: `paragraph-${index}`
            })
          }
        } else if (item.type === 'table') {
          const tables = template.parsed_tables || []
          const tableData = tables.find(t => t.name === item.id || t.id === item.id)

          if (tableData) {
            components.push({
              type: 'table',
              data: { ...tableData, index: tableData.index ?? index, defaultFontSize: template.doc_default_size },
              id: `table-${tableData.index ?? index}`
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

    // 計算編號索引後返回
    return calculateNumberingIndices(components)
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
    <div className="h-full w-full overflow-y-auto scrollbar-hide p-12 bg-muted/20 flex flex-col items-center">
      {pages.map((pageComponents, pageIdx) => (
        <div key={`page-${pageIdx}`} className="mb-8 last:mb-0 relative">
          {/* Page Label */}
          <div className="absolute -left-16 top-0 text-[10px] font-mono text-muted-foreground select-none uppercase tracking-widest [writing-mode:vertical-lr] border-l border-black dark:border-white pl-2 h-16 opacity-50">
            Page {pageIdx + 1}
          </div>

          {/* The Paper Sheet */}
          <div
            ref={pageIdx === 0 ? setNodeRef : undefined} // Only first page for drop ref for now, or simplify
            style={paperStyle}
            className={`
              bg-white dark:bg-black shadow-none border border-black dark:border-white relative
              transition-all duration-200 ease-in-out
              ${!mainSection ? 'max-w-4xl min-h-[1123px] p-16' : ''}
              ${isOver && pageIdx === 0 ? 'ring-2 ring-black dark:ring-white ring-offset-2' : ''}
            `}
          >
            <div>
              {/* 渲染頁首 */}
              {template.headers_footers && Array.isArray(template.headers_footers) && template.headers_footers[0] && (
                <HeaderSection
                  headerData={template.headers_footers[0].headers}
                  pageNumber={pageIdx + 1}
                  isFirstPage={pageIdx === 0}
                  isEvenPage={(pageIdx + 1) % 2 === 0}
                />
              )}

              {pageComponents.length > 0 ? (
                pageComponents.map((component, idx) => (
                  <div
                    key={`${component.type}-${component.id}-${idx}`}
                    id={component.id}
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
                <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
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

              {/* 渲染頁尾 */}
              {template.headers_footers && Array.isArray(template.headers_footers) && template.headers_footers[0] && (
                <FooterSection
                  footerData={template.headers_footers[0].footers}
                  pageNumber={pageIdx + 1}
                  isFirstPage={pageIdx === 0}
                  isEvenPage={(pageIdx + 1) % 2 === 0}
                />
              )}
            </div>
          </div>
        </div>
      ))}

      {allComponents.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[800px] text-muted-foreground font-mono">
          <div className="w-16 h-16 border border-dashed border-black dark:border-white mb-6 flex items-center justify-center opacity-20">
            <span className="text-2xl">+</span>
          </div>
          <p className="text-xl font-bold uppercase tracking-widest mb-2 text-foreground break-all">[ EMPTY CAN A S ]</p>
          <p className="text-xs uppercase tracking-wider">DRAG COMPONENTS FROM LIBRARY</p>
        </div>
      )}
    </div>
  )
}
