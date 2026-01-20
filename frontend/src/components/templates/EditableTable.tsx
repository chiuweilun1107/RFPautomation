"use client"

import * as React from "react"
import { VariableRenderer } from "./VariableRenderer"

interface TableInfo {
  index: number
  rows: number | any[]
  cols?: number
  columns?: any[]
  cells?: any[]
  columnWidths?: (number | string)[]
  rowFormats?: any[]
  format?: any
  style?: any
  defaultFontSize?: number
}

interface EditableTableProps {
  table: TableInfo
  isSelected: boolean
  onClick: () => void
  onEdit: () => void
}

// 統一的字體映射函數
function getFontFamily(fontName?: string, cjkFontName?: string): string {
  const fontMap: Record<string, string> = {
    '標楷體': '"BiauKai TC", "BiauKai HK", "標楷體-繁", "標楷體-港澳", "Kaiti TC", STKaiti, DFKai-SB, KaiTi, serif',
    'DFKai-SB': 'DFKai-SB, "BiauKai TC", "BiauKai HK", "標楷體-繁", "Kaiti TC", STKaiti, KaiTi, serif',
    'BiauKai': '"BiauKai TC", "BiauKai HK", "標楷體-繁", DFKai-SB, STKaiti, serif',
    'BiauKaiTC': '"BiauKai TC", BiauKaiTC, "標楷體-繁", DFKai-SB, STKaiti, serif',
    'BiauKaiHK': '"BiauKai HK", BiauKaiHK, "標楷體-港澳", DFKai-SB, STKaiti, serif',
    '楷體': '"Kaiti TC", "Kaiti SC", STKaiti, KaiTi, "楷體-繁", DFKai-SB, serif',
    'KaiTi': '"Kaiti TC", "Kaiti SC", STKaiti, KaiTi, "楷體-繁", DFKai-SB, serif',
    '新細明體': 'PMingLiU, MingLiU, "Apple LiSung", "PingFang TC", serif',
    '微軟正黑體': '"Microsoft JhengHei", "PingFang TC", "Heiti TC", "Noto Sans TC", sans-serif',
    'Times New Roman': '"Times New Roman", Times, Georgia, serif',
    'Arial': 'Arial, Helvetica, "PingFang TC", sans-serif',
    'Calibri': 'Calibri, "Helvetica Neue", Arial, sans-serif',
    'Verdana': 'Verdana, Geneva, Arial, sans-serif'
  }

  let families = []
  if (fontName) families.push(fontMap[fontName] || `"${fontName}"`)
  if (cjkFontName) families.push(fontMap[cjkFontName] || `"${cjkFontName}"`)

  families.push('serif')
  return families.join(', ')
}

export function EditableTable({ table, isSelected, onClick, onEdit }: EditableTableProps) {
  const [isEditing, setIsEditing] = React.useState(false)

  // 將 Run 格式轉換為 CSS 樣式
  const getRunStyle = (runFormat?: any): React.CSSProperties => {
    const style: React.CSSProperties = {}

    if (!runFormat) return style

    // 字體處理 (優先使用 Run 內部的指定字體)
    if (runFormat.font || runFormat.fontCJK) {
      style.fontFamily = getFontFamily(runFormat.font, runFormat.fontCJK)
    } else if (table.format?.font_name || table.format?.font_name_cjk) {
      // 繼承表格字體
      style.fontFamily = getFontFamily(table.format.font_name, table.format.font_name_cjk)
    }

    // 字體大小
    if (runFormat.size) {
      style.fontSize = `${runFormat.size}pt`
    }

    // 顏色
    if (runFormat.color && runFormat.color !== 'auto') {
      style.color = `#${runFormat.color}`
    }

    // 粗體
    if (runFormat.bold) {
      style.fontWeight = 'bold'
    }

    // 斜體
    if (runFormat.italic) {
      style.fontStyle = 'italic'
    }

    // 底線
    if (runFormat.underline) {
      style.textDecoration = 'underline'
    }

    return style
  }

  // 建立表格矩陣（支援合併儲存格）
  const renderTableGrid = () => {
    if (!table.cells || table.cells.length === 0) {
      return (
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          無儲存格資料
        </div>
      )
    }

    // 建立二維陣列，追蹤合併狀態
    // 建立二維陣列，追蹤合併狀態
    const rowCount = Array.isArray(table.rows) ? table.rows.length : table.rows
    const colCount = (table.columns && Array.isArray(table.columns)) ? table.columns.length : (table.cols || 0)

    const grid: (any | null)[][] = Array(rowCount).fill(null).map(() =>
      Array(colCount).fill(null)
    )

    // 追蹤哪些儲存格因為合併而應該跳過
    const skipCells: Set<string> = new Set()

    // 追蹤垂直合併的 rowSpan
    const vMergeSpans: Map<string, number> = new Map()

    // 第一次遍歷：填充儲存格資料並計算垂直合併
    if (table.cells) {
      table.cells.forEach(cell => {
        if (cell.row < rowCount && cell.col < colCount) {
          grid[cell.row][cell.col] = cell

          // 計算 colSpan 需要跳過的儲存格
          const colSpan = cell.format?.colSpan || 1
          if (colSpan > 1) {
            for (let i = 1; i < colSpan; i++) {
              if (cell.col + i < colCount) {
                skipCells.add(`${cell.row}-${cell.col + i}`)
              }
            }
          }
        }
      })

      // 第二次遍歷：計算垂直合併的 rowSpan
      for (let col = 0; col < colCount; col++) {
        let mergeStartRow = -1
        for (let row = 0; row < rowCount; row++) {
          const cell = grid[row][col]
          if (cell?.format?.vMerge === 'start' || cell?.format?.vMerge === 'restart') {
            mergeStartRow = row
          } else if (cell?.format?.vMerge === 'continue') {
            if (mergeStartRow >= 0) {
              skipCells.add(`${row}-${col}`)
              const key = `${mergeStartRow}-${col}`
              vMergeSpans.set(key, (vMergeSpans.get(key) || 1) + 1)
            } else if (row > 0) {
              // Handle Implicit Start (Word sometimes omits 'restart' on the first cell)
              mergeStartRow = row - 1
              skipCells.add(`${row}-${col}`)
              const key = `${mergeStartRow}-${col}`
              vMergeSpans.set(key, (vMergeSpans.get(key) || 1) + 1)
            }
          } else {
            mergeStartRow = -1
          }
        }
      }

      // 對齊值轉換
      const getTextAlign = (align?: string): 'left' | 'center' | 'right' | 'justify' => {
        switch (align) {
          case 'center': return 'center'
          case 'right': return 'right'
          case 'both': return 'justify'
          default: return 'left'
        }
      }

      return (
        <div className="">
          <table
            className={`border-collapse border ${table.defaultFontSize ? '' : 'text-sm'}`}
            style={{
              fontSize: table.defaultFontSize ? `${table.defaultFontSize}pt` : undefined,
              width: table.style?.width
                ? (typeof table.style.width === 'string' ? table.style.width : `${table.style.width}pt`)
                : (table.style?.marginLeft && table.style.marginLeft < 0)
                  ? `calc(100% + ${Math.abs(table.style.marginLeft)}pt)`
                  : '100%',
              minWidth: table.style?.width
                ? (typeof table.style.width === 'string' ? table.style.width : `${table.style.width}pt`)
                : undefined,
              marginLeft: table.style?.marginLeft ? `${table.style.marginLeft}pt` : undefined,
              tableLayout: table.style?.width ? 'fixed' : 'auto'
            }}
          >
            {/* 欄寬設定 */}
            {table.columnWidths && table.columnWidths.length > 0 && (
              <colgroup>
                {table.columnWidths.map((width, idx) => (
                  <col
                    key={idx}
                    style={
                      typeof width === 'string'
                        ? { width }
                        : (typeof width === 'number' && width > 0 ? { width: `${width}pt` } : undefined)
                    }
                  />
                ))}
              </colgroup>
            )}
            <tbody>
              {grid.map((row, rowIdx) => {
                const rowFormat = table.rowFormats?.[rowIdx]
                return (
                  <tr
                    key={rowIdx}
                    className={rowFormat?.isHeader ? 'bg-gray-100 dark:bg-zinc-800 font-semibold' : ''}
                    style={{
                      height: rowFormat?.height?.value
                        ? `${rowFormat.height.value}pt`
                        : undefined
                    }}
                  >
                    {row.map((cell, colIdx) => {
                      // 跳過被合併的儲存格
                      if (skipCells.has(`${rowIdx}-${colIdx}`)) {
                        return null
                      }

                      const colSpan = cell?.format?.colSpan || 1
                      const rowSpan = vMergeSpans.get(`${rowIdx}-${colIdx}`) || 1

                      return (
                        <td
                          key={colIdx}
                          colSpan={colSpan > 1 ? colSpan : undefined}
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                          className="border"
                          style={{
                            padding: '0 4px',
                            whiteSpace: 'pre-wrap',
                            backgroundColor: cell?.format?.backgroundColor
                              ? `#${cell.format.backgroundColor}`
                              : undefined,
                            verticalAlign: cell?.format?.vAlign || 'top',
                            textAlign: getTextAlign(cell?.format?.hAlign),
                            writingMode: cell?.format?.writingMode, // vertical-rl
                            textOrientation: cell?.format?.writingMode ? 'upright' : undefined,
                            width: table.columnWidths?.[colIdx] ? `${table.columnWidths[colIdx]}pt` : undefined,
                            ...cell?.format?.borders // Apply custom borders (overrides className="border")
                          }}
                        >
                          {cell ? (
                            <>
                              {cell.runs && cell.runs.length > 0 ? (
                                cell.runs.map((run: any, runIdx: number) => {
                                  if (run.type === 'image' && run.image_data) {
                                    return (
                                      <img
                                        key={runIdx}
                                        src={run.image_data.url}
                                        alt="Embedded"
                                        className="max-w-full h-auto my-1"
                                        style={{
                                          width: run.image_data.width > 0 ? `${run.image_data.width}pt` : undefined
                                        }}
                                      />
                                    )
                                  }
                                  return (
                                    <span key={runIdx} style={getRunStyle(run.format)}>
                                      <VariableRenderer text={run.text} />
                                    </span>
                                  )
                                })
                              ) : (
                                <VariableRenderer text={cell.text || '(空)'} />
                              )}
                            </>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative transition-all cursor-pointer group
        ${isSelected
          ? 'ring-1 ring-[#FA4028] bg-orange-50/10 shadow-sm'
          : 'hover:bg-gray-50/50'
        }
      `}
    >
      {/* 選中標記 */}
      {isSelected && (
        <div className="absolute -top-3 right-0 bg-[#FA4028] text-white text-[10px] px-2 py-0.5 rounded-t font-semibold z-10">
          已選中
        </div>
      )}

      {/* 表格內容 */}
      <div className="w-full">
        {renderTableGrid()}
      </div>

      {/* 表格資訊 (僅選取時顯示，且更小) */}
      {isSelected && (
        <div className="mt-1 text-[9px] text-gray-400 font-mono flex items-center gap-2">
          <span>#{table.index}</span>
          <span>•</span>
          <span>{Array.isArray(table.rows) ? table.rows.length : table.rows}R × {(table.columns && Array.isArray(table.columns)) ? table.columns.length : (table.cols || 0)}C</span>
        </div>
      )}
    </div>
  )
}