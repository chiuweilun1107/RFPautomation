import * as React from "react"
import { Card } from "@/components/ui/card"
import type { ParagraphCardProps } from "../types"
import { getRunStyle } from "../utils"

export function ParagraphCard({ paragraph }: ParagraphCardProps) {
    // 將 Word 樣式轉換為 CSS 樣式
    const getParagraphStyle = (): React.CSSProperties => {
        const style: React.CSSProperties = {}

        // 對齊方式
        if (paragraph.format?.alignment) {
            const alignMap: Record<string, React.CSSProperties['textAlign']> = {
                left: 'left',
                center: 'center',
                right: 'right',
                both: 'justify'
            }
            style.textAlign = alignMap[paragraph.format.alignment] || 'left'
        }

        // 縮排
        if (paragraph.format?.indentation) {
            const ind = paragraph.format.indentation
            if (ind.firstLine > 0) style.textIndent = `${ind.firstLine}pt`
            if (ind.left > 0) style.paddingLeft = `${ind.left}pt`
            if (ind.right > 0) style.paddingRight = `${ind.right}pt`
        }

        // 行距
        if (paragraph.format?.spacing) {
            const sp = paragraph.format.spacing
            if (sp.before > 0) style.marginTop = `${sp.before}pt`
            if (sp.after > 0) style.marginBottom = `${sp.after}pt`
            if (sp.line > 0) {
                // Word 的行距單位轉換
                style.lineHeight = sp.lineRule === 'auto' ? `${sp.line / 240}` : `${sp.line}pt`
            }
        }

        return style
    }

    const getStyleDisplay = () => {
        const parts = []

        if (paragraph.format?.alignment) {
            const alignMap: Record<string, string> = {
                left: '靠左',
                center: '置中',
                right: '靠右',
                both: '左右對齊'
            }
            parts.push(alignMap[paragraph.format.alignment] || paragraph.format.alignment)
        }

        if (paragraph.format?.outlineLevel !== undefined) {
            parts.push(`標題 ${paragraph.format.outlineLevel + 1}`)
        }

        if (paragraph.format?.indentation) {
            const ind = paragraph.format.indentation
            if (ind.firstLine > 0) parts.push(`首行縮排 ${ind.firstLine}pt`)
            if (ind.left > 0) parts.push(`左縮排 ${ind.left}pt`)
        }

        return parts.length > 0 ? parts.join(' • ') : null
    }

    return (
        <Card className="p-4">
            {/* 技術資訊標籤 */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    #{paragraph.index}
                </span>
                <span className="text-xs text-muted-foreground">
                    樣式: {paragraph.style || 'Normal'}
                </span>
                {getStyleDisplay() && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                        {getStyleDisplay()}
                    </span>
                )}
            </div>

            {/* WYSIWYG 預覽區域 */}
            <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-2">
                    實際渲染預覽:
                </div>
                <div
                    style={getParagraphStyle()}
                    className="min-h-[2em] bg-muted/30 p-3 rounded border"
                >
                    {paragraph.runs && paragraph.runs.length > 0 ? (
                        paragraph.runs.map((run, idx) => (
                            <span key={idx} style={getRunStyle(run.format)}>
                                {run.text}
                            </span>
                        ))
                    ) : (
                        <span>{paragraph.text}</span>
                    )}
                </div>
            </div>

            {/* 詳細格式資訊 (可摺疊) */}
            {paragraph.runs && paragraph.runs.length > 0 && (
                <details className="mt-3">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        查看詳細格式資訊 ({paragraph.runs.length} 個文字區塊)
                    </summary>
                    <div className="mt-2 space-y-1">
                        {paragraph.runs.map((run, idx) => (
                            <div key={idx} className="text-xs bg-muted p-2 rounded">
                                <div className="font-mono text-muted-foreground mb-1">
                                    {run.text.substring(0, 50)}{run.text.length > 50 ? '...' : ''}
                                </div>
                                {run.format && (
                                    <div className="text-muted-foreground">
                                        {run.format.font && `字體: ${run.format.font} `}
                                        {run.format.size && `${run.format.size}pt `}
                                        {run.format.bold && '粗體 '}
                                        {run.format.italic && '斜體 '}
                                        {run.format.color && run.format.color !== 'auto' && `顏色: #${run.format.color}`}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </Card>
    )
}
