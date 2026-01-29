"use client"

import * as React from "react"
import { VariableRenderer } from "./VariableRenderer"
import type { HeaderFooterContent } from "@/types/template-advanced"

// Use the imported type directly
type HeaderData = HeaderFooterContent

interface HeaderSectionProps {
  headerData?: {
    default?: HeaderData
    first_page?: HeaderData
    even_page?: HeaderData
  }
  pageNumber?: number
  isFirstPage?: boolean
  isEvenPage?: boolean
}

// 統一的字體映射函數（與 EditableParagraph 保持一致）
function getFontFamily(fontName?: string, cjkFontName?: string): string {
  const fontMap: Record<string, string> = {
    '標楷體': '"BiauKai TC", "BiauKai HK", "標楷體-繁", "標楷體-港澳", "Kaiti TC", STKaiti, DFKai-SB, KaiTi, serif',
    'DFKai-SB': 'DFKai-SB, "BiauKai TC", "BiauKai HK", "標楷體-繁", "Kaiti TC", STKaiti, KaiTi, serif',
    'BiauKai': '"BiauKai TC", "BiauKai HK", "標楷體-繁", DFKai-SB, STKaiti, serif',
    '新細明體': 'PMingLiU, MingLiU, "Apple LiSung", "PingFang TC", serif',
    '微軟正黑體': '"Microsoft JhengHei", "PingFang TC", "Heiti TC", "Noto Sans TC", sans-serif',
    'Times New Roman': '"Times New Roman", Times, Georgia, serif',
    'Arial': 'Arial, Helvetica, "PingFang TC", sans-serif',
    'Calibri': 'Calibri, "Helvetica Neue", Arial, sans-serif'
  }

  const families = []
  if (fontName) families.push(fontMap[fontName] || `"${fontName}"`)
  if (cjkFontName) families.push(fontMap[cjkFontName] || `"${cjkFontName}"`)
  families.push('serif')

  return families.join(', ')
}

export function HeaderSection({ headerData, pageNumber = 1, isFirstPage = false, isEvenPage = false }: HeaderSectionProps) {
  if (!headerData) return null

  // 根據頁面類型選擇對應的頁首數據
  let activeHeader: HeaderData | undefined
  if (isFirstPage && headerData.first_page) {
    activeHeader = headerData.first_page
  } else if (isEvenPage && headerData.even_page) {
    activeHeader = headerData.even_page
  } else {
    activeHeader = headerData.default
  }

  if (!activeHeader || (!activeHeader.paragraphs?.length && !activeHeader.images?.length && !activeHeader.tables?.length)) {
    return null
  }

  const getParagraphStyle = (format?: any): React.CSSProperties => {
    const style: React.CSSProperties = {}

    if (format?.alignment) {
      const alignMap: Record<string, React.CSSProperties['textAlign']> = {
        left: 'left', center: 'center', right: 'right', both: 'justify', distribute: 'justify',
        LEFT: 'left', CENTER: 'center', RIGHT: 'right', BOTH: 'justify', DISTRIBUTE: 'justify'
      }
      style.textAlign = alignMap[format.alignment] || alignMap[format.alignment?.toLowerCase()] || 'left'
    }

    // 縮排 (支持 camelCase 和 snake_case)
    if (format?.indentation) {
      const ind = format.indentation
      const firstLine = ind.firstLine || ind.first_line || 0
      const left = ind.left || 0
      const right = ind.right || 0

      if (firstLine > 0) style.textIndent = `${firstLine}pt`
      if (left > 0) style.paddingLeft = `${left}pt`
      if (right > 0) style.paddingRight = `${right}pt`
    }

    if (format?.font_name || format?.font_name_cjk) {
      style.fontFamily = getFontFamily(format.font_name, format.font_name_cjk)
    }

    if (format?.font_size) {
      style.fontSize = `${format.font_size}pt`
    }

    if (format?.bold) style.fontWeight = 'bold'
    if (format?.italic) style.fontStyle = 'italic'
    if (format?.underline) style.textDecoration = 'underline'

    return style
  }

  const getRunStyle = (runFormat?: any, paragraphFormat?: any): React.CSSProperties => {
    const style: React.CSSProperties = {}

    if (runFormat?.font || runFormat?.fontCJK) {
      style.fontFamily = getFontFamily(runFormat.font, runFormat.fontCJK)
    } else if (paragraphFormat?.font_name || paragraphFormat?.font_name_cjk) {
      style.fontFamily = getFontFamily(paragraphFormat.font_name, paragraphFormat.font_name_cjk)
    }

    if (runFormat?.size) {
      style.fontSize = `${runFormat.size}pt`
    } else if (paragraphFormat?.font_size) {
      style.fontSize = `${paragraphFormat.font_size}pt`
    }

    if (runFormat?.color && runFormat.color !== 'auto') {
      style.color = `#${runFormat.color}`
    }

    if (runFormat?.bold || paragraphFormat?.bold) style.fontWeight = 'bold'
    if (runFormat?.italic || paragraphFormat?.italic) style.fontStyle = 'italic'
    if (runFormat?.underline || paragraphFormat?.underline) style.textDecoration = 'underline'

    return style
  }

  return (
    <div className="header-section border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
      {/* 渲染圖片 */}
      {activeHeader.images && activeHeader.images.length > 0 && (
        <div className="header-images flex flex-wrap gap-2 mb-2">
          {activeHeader.images.map((img, idx) => (
            <img
              key={idx}
              src={img.url}
              alt="Header Logo"
              style={{
                width: img.width ? `${img.width}px` : 'auto',
                height: img.height ? `${img.height}px` : 'auto',
                maxWidth: '100px',
                maxHeight: '50px',
                objectFit: 'contain'
              }}
            />
          ))}
        </div>
      )}

      {/* 渲染表格 */}
      {activeHeader.tables && activeHeader.tables.length > 0 && (
        <div className="header-tables mb-2">
          {activeHeader.tables.map((table, tableIdx) => (
            <table key={tableIdx} className="w-full text-sm border-collapse">
              <tbody>
                {table.rows_data?.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.cells.map((cell, cellIdx) => (
                      <td key={cellIdx} className="py-1">
                        {/* 渲染儲存格中的圖片 */}
                        {cell.images && cell.images.length > 0 && (
                          <div className="space-y-1">
                            {cell.images.map((img: any, imgIdx: number) => {
                              // 根據圖片的 alignment 設置對齊方式
                              const alignment = img.format?.alignment || 'left'
                              const justifyContent =
                                alignment === 'right' ? 'flex-end' :
                                alignment === 'center' ? 'center' :
                                'flex-start'

                              return (
                                <div
                                  key={imgIdx}
                                  className="flex"
                                  style={{ justifyContent }}
                                >
                                  <img
                                    src={img.url}
                                    alt="Logo"
                                    style={{
                                      width: img.width ? `${img.width}px` : 'auto',
                                      height: img.height ? `${img.height}px` : 'auto',
                                      maxWidth: '120px',
                                      maxHeight: '60px',
                                      objectFit: 'contain'
                                    }}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {/* 渲染儲存格文字 */}
                        {cell.text && (
                          <div className="text-gray-700 dark:text-gray-300">
                            {cell.text.split('\n').map((line, lineIdx) => (
                              <div key={lineIdx}>{line}</div>
                            ))}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      )}

      {/* 渲染段落 */}
      {activeHeader.paragraphs && activeHeader.paragraphs.length > 0 && (
        <div className="header-paragraphs text-sm text-gray-700 dark:text-gray-300">
          {activeHeader.paragraphs.map((para, idx) => (
            <div key={idx} style={getParagraphStyle(para.format)} className="mb-1">
              {para.runs && para.runs.length > 0 ? (
                para.runs.map((run, runIdx) => (
                  <span key={runIdx} style={getRunStyle(run.format, para.format)}>
                    <VariableRenderer text={run.text} />
                  </span>
                ))
              ) : (
                <span style={getRunStyle(undefined, para.format)}>
                  <VariableRenderer text={para.text} />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
