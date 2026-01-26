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
  numberingIndex?: number // 在清單層級中的編號索引
}

interface EditableParagraphProps {
  paragraph: ParagraphInfo
  isSelected: boolean
  onClick: () => void
  onEdit: () => void
}

// 生成中文編號文字
function getChineseNumbering(level: number, index: number): string {
  // 正式大寫中文數字（用於第一層：壹、貳、參...）
  const formal = ['壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖', '拾']
  // 一般中文數字（用於第二層：一、二、三...）
  const informal = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

  if (level === 0) {
    // 第一層：壹、貳、參...
    if (index < formal.length) {
      return formal[index] + '、'
    }
    return `${index + 1}、` // 超過10個就用阿拉伯數字
  } else if (level === 1) {
    // 第二層：一、二、三...
    if (index < informal.length) {
      return informal[index] + '、'
    }
    return `${index + 1}、` // 超過10個就用阿拉伯數字
  } else if (level === 2) {
    // 第三層：(1) (2) (3)...
    return `(${index + 1})`
  } else {
    // 其他層級：使用阿拉伯數字
    return `${index + 1}.`
  }
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

  // 1. 如果有指定的字體，優先處理
  // 如果是 CJK 字體，我們通常希望它能覆蓋中文
  // 如果是 西文字體，它會自動只影響英數
  const families = []

  if (fontName) {
    families.push(fontMap[fontName] || `"${fontName}"`)
  }

  if (cjkFontName) {
    families.push(fontMap[cjkFontName] || `"${cjkFontName}"`)
  }

  // 預設後備 (移除未定義的 CSS 變量)
  families.push('serif')

  return families.join(', ')
}

export function EditableParagraph({ paragraph, isSelected, onClick, onEdit }: EditableParagraphProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [content, setContent] = React.useState(paragraph.text)

  // 檢查是否有 Tab Leader 配置
  const hasTabLeader = paragraph.format?.tab_stops &&
    Array.isArray(paragraph.format.tab_stops) &&
    paragraph.format.tab_stops.length > 0 &&
    paragraph.format.tab_stops.some((ts: any) => ts.leader && ts.leader !== 'none')

  // 處理帶有 Tab Leader 的文本
  const renderTextWithTabLeader = (text: string, runFormat?: any) => {
    if (!hasTabLeader || !text.includes('\t')) {
      // 沒有 Tab Leader 或沒有 Tab 字符，直接返回普通渲染
      return <VariableRenderer text={text} />
    }

    // 分割文本，處理 Tab 字符
    const parts = text.split('\t')
    const tabStop = paragraph.format.tab_stops.find((ts: any) => ts.leader && ts.leader !== 'none')

    // 獲取 leader 樣式
    const leaderChar = tabStop?.leader === 'dot' ? '.' :
                       tabStop?.leader === 'hyphen' ? '-' :
                       tabStop?.leader === 'underscore' ? '_' : '.'

    return (
      <>
        {parts.map((part, idx) => (
          <React.Fragment key={idx}>
            <VariableRenderer text={part} />
            {idx < parts.length - 1 && (
              <span
                className="tab-leader"
                style={{
                  display: 'inline-block',
                  flex: 1,
                  borderBottom: leaderChar === '.' ? '1px dotted currentColor' :
                               leaderChar === '-' ? '1px dashed currentColor' :
                               '1px solid currentColor',
                  marginLeft: '0.5em',
                  marginRight: '0.5em',
                  marginBottom: '0.3em',
                  opacity: 0.4,
                  minWidth: '50px'
                }}
              />
            )}
          </React.Fragment>
        ))}
      </>
    )
  }

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

    // 縮排 (支持 camelCase 和 snake_case)
    if (paragraph.format?.indentation) {
      const ind = paragraph.format.indentation
      const firstLine = ind.firstLine || ind.first_line || 0
      const left = ind.left || 0
      const right = ind.right || 0

      if (firstLine > 0) style.textIndent = `${firstLine}pt`
      if (left > 0) style.paddingLeft = `${left}pt`
      if (right > 0) style.paddingRight = `${right}pt`
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

    // 字體處理 (優先使用 Run 內部的指定字體，否則繼承段落字體)
    if (runFormat?.font || runFormat?.fontCJK) {
      style.fontFamily = getFontFamily(runFormat.font, runFormat.fontCJK)
    } else if (paragraph.format?.font_name || paragraph.format?.font_name_cjk) {
      // 繼承段落字體
      style.fontFamily = getFontFamily(paragraph.format.font_name, paragraph.format.font_name_cjk)
    }

    // 字體大小 (優先使用 Run 的大小，否則繼承段落大小)
    if (runFormat?.size) {
      style.fontSize = `${runFormat.size}pt`
    } else if (paragraph.format?.font_size) {
      style.fontSize = `${paragraph.format.font_size}pt`
    }

    // 顏色
    if (runFormat?.color && runFormat.color !== 'auto') {
      style.color = `#${runFormat.color}`
    }

    // 粗體 (Run 或段落級別)
    if (runFormat?.bold || paragraph.format?.bold) {
      style.fontWeight = 'bold'
    }

    // 斜體 (Run 或段落級別)
    if (runFormat?.italic || paragraph.format?.italic) {
      style.fontStyle = 'italic'
    }

    // 底線 (Run 或段落級別)
    if (runFormat?.underline || paragraph.format?.underline) {
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
          style={{
            ...getParagraphStyle(),
            display: hasTabLeader ? 'flex' : 'block',
            alignItems: 'baseline'
          }}
          className="min-h-[1.15em] text-gray-900 dark:text-gray-100"
          onDoubleClick={() => setIsEditing(true)}
        >
          {/* 渲染編號（如果有） */}
          {paragraph.format?.numbering && typeof paragraph.numberingIndex === 'number' && (
            <span
              style={getRunStyle(undefined)}
              className="numbering-prefix"
            >
              {getChineseNumbering(paragraph.format.numbering.level, paragraph.numberingIndex)}
            </span>
          )}

          {/* 渲染段落文字 */}
          {paragraph.runs && paragraph.runs.length > 0 ? (
            paragraph.runs.map((run, idx) => (
              <span key={idx} style={getRunStyle(run.format)} className="template-text-run">
                {renderTextWithTabLeader(run.text, run.format)}
              </span>
            ))
          ) : (
            <span style={getRunStyle(undefined)} className="template-text-run">
              {renderTextWithTabLeader(paragraph.text)}
            </span>
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