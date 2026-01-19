"use client"

import * as React from "react"
import { VariableRenderer } from "./VariableRenderer"
import { getStyleNameCN } from "./styleUtils"

interface ParagraphInfo {
  index: number
  text: string
  style?: string
  format?: any
  runs?: any[]
}

interface EditableParagraphProps {
  paragraph: ParagraphInfo
  isSelected: boolean
  onClick: () => void
  onEdit: () => void
}

// 統一的字體映射函數
function getFontFamily(fontName?: string, cjkFontName?: string): string {
  const fontMap: Record<string, string> = {
    '標楷體': 'BiauKaiTC, BiauKaiHK, DFKai-SB, KaiTi, STKaiti, serif',
    'DFKai-SB': 'DFKai-SB, BiauKaiTC, BiauKaiHK, KaiTi, STKaiti, serif',
    '新細明體': 'PMingLiU, MingLiU, "Apple LiSung", serif',
    '微軟正黑體': '"Microsoft JhengHei", "PingFang TC", "Heiti TC", sans-serif',
    'Times New Roman': '"Times New Roman", Times, serif',
    'Arial': 'Arial, Helvetica, sans-serif',
    'Calibri': 'Calibri, "Helvetica Neue", sans-serif',
    'Verdana': 'Verdana, Geneva, sans-serif'
  }

  // 1. 如果有指定的字體，優先處理
  // 如果是 CJK 字體，我們通常希望它能覆蓋中文
  // 如果是 西文字體，它會自動只影響英數
  let families = []

  if (fontName) {
    families.push(fontMap[fontName] || `"${fontName}"`)
  }

  if (cjkFontName) {
    families.push(fontMap[cjkFontName] || `"${cjkFontName}"`)
  }

  // 預設後備
  families.push('var(--font-noto-serif)', 'serif')

  return families.join(', ')
}

export function EditableParagraph({ paragraph, isSelected, onClick, onEdit }: EditableParagraphProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [content, setContent] = React.useState(paragraph.text)

  // 將 Word 樣式轉換為 CSS 樣式
  const getParagraphStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {}

    // 對齊方式
    if (paragraph.format?.alignment) {
      const alignMap: Record<string, React.CSSProperties['textAlign']> = {
        left: 'left',
        center: 'center',
        right: 'right',
        both: 'justify',
        LEFT: 'left',
        CENTER: 'center',
        RIGHT: 'right',
        BOTH: 'justify',
        DISTRIBUTE: 'justify'
      }
      style.textAlign = alignMap[paragraph.format.alignment] || alignMap[paragraph.format.alignment.toLowerCase()] || 'left'
    }

    // 縮排
    if (paragraph.format?.indentation) {
      const ind = paragraph.format.indentation
      if (ind.firstLine > 0) style.textIndent = `${ind.firstLine}pt`
      if (ind.left > 0) style.paddingLeft = `${ind.left}pt`
      if (ind.right > 0) style.paddingRight = `${ind.right}pt`
    }

    // 行距與段間距
    if (paragraph.format?.spacing) {
      const sp = paragraph.format.spacing
      // 段前段後
      if (sp.before > 0) style.marginTop = `${sp.before}pt`
      else style.marginTop = '0'

      if (sp.after > 0) style.marginBottom = `${sp.after}pt`
      else style.marginBottom = '0'

      // 行高處理 (標準化後的欄位名稱)
      const line = sp.line_spacing || sp.line
      const rule = sp.line_spacing_rule || sp.lineRule || 'SINGLE'

      if (line > 0) {
        if (rule === 'SINGLE') style.lineHeight = '1.15' // Word 預設接近 1.15
        else if (rule === '1.5') style.lineHeight = '1.5'
        else if (rule === 'DOUBLE') style.lineHeight = '2.0'
        else if (rule === 'AT_LEAST' || rule === 'EXACTLY') {
          style.lineHeight = `${line}pt`
        } else {
          // AUTO 或其他比例
          style.lineHeight = `${line}`
        }
      } else {
        style.lineHeight = '1.15' // 預設 Word 風格
      }
    } else {
      style.marginTop = '0'
      style.marginBottom = '0'
      style.lineHeight = '1.15'
    }

    return style
  }

  // 將 Run 格式轉換為 CSS 樣式
  const getRunStyle = (runFormat?: any): React.CSSProperties => {
    const style: React.CSSProperties = {}

    if (!runFormat) return style

    // 字體處理 (優先使用 Run 內部的指定字體)
    if (runFormat.font || runFormat.fontCJK) {
      style.fontFamily = getFontFamily(runFormat.font, runFormat.fontCJK)
    } else if (paragraph.format?.font_name || paragraph.format?.font_name_cjk) {
      // 繼承段落字體
      style.fontFamily = getFontFamily(paragraph.format.font_name, paragraph.format.font_name_cjk)
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

  const handleSave = () => {
    setIsEditing(false)
    onEdit()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setContent(paragraph.text)
      setIsEditing(false)
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative transition-all cursor-pointer group
        ${isSelected
          ? 'ring-1 ring-[#FA4028] bg-orange-50/30 shadow-sm'
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

      {/* 段落內容 */}
      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          style={getParagraphStyle()}
          className="w-full min-h-[60px] p-2 border border-gray-300 dark:border-white/20 rounded bg-white dark:bg-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-[#FA4028]"
          autoFocus
        />
      ) : (
        <div
          style={getParagraphStyle()}
          className="min-h-[1.15em] text-gray-900 dark:text-gray-100"
          onDoubleClick={() => setIsEditing(true)}
        >
          {paragraph.runs && paragraph.runs.length > 0 ? (
            paragraph.runs.map((run, idx) => (
              <span key={idx} style={getRunStyle(run.format)}>
                <VariableRenderer text={run.text} />
              </span>
            ))
          ) : (
            <VariableRenderer text={paragraph.text} />
          )}
        </div>
      )}

      {/* 段落資訊 (已隱藏) */}
      {/* 
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
        <span className="font-mono">#{paragraph.index}</span>
        {paragraph.style && (
          <>
            <span>•</span>
            <span>樣式: {getStyleNameCN(paragraph.style)}</span>
          </>
        )}
        {isEditing && (
          <>
            <span>•</span>
            <span className="text-[#FA4028]">按 Enter 儲存，Esc 取消</span>
          </>
        )}
      </div> 
      */}
    </div>
  )
}