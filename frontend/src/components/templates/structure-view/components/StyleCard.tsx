import * as React from "react"
import { Card } from "@/components/ui/card"
import type { StyleCardProps } from "../types"
import { getFontFamily } from "../utils"

export function StyleCard({ style }: StyleCardProps) {
    // 將樣式轉換為 CSS
    const getPreviewStyle = (): React.CSSProperties => {
        const cssStyle: React.CSSProperties = {}

        // 字體設定
        if (style.font) {
            if (style.font.eastAsia || style.font.ascii) {
                const fontName = (style.font.eastAsia || style.font.ascii) as string
                cssStyle.fontFamily = getFontFamily(fontName)
            }
            if (style.font.size) {
                cssStyle.fontSize = `${style.font.size}pt`
            }
            if (style.font.color && style.font.color !== 'auto') {
                cssStyle.color = `#${style.font.color}`
            }
            if (style.font.bold) {
                cssStyle.fontWeight = 'bold'
            }
            if (style.font.italic) {
                cssStyle.fontStyle = 'italic'
            }
            if (style.font.underline) {
                cssStyle.textDecoration = 'underline'
            }
        }

        // 段落設定
        if (style.paragraph) {
            if (style.paragraph.alignment) {
                const alignMap: Record<string, React.CSSProperties['textAlign']> = {
                    left: 'left',
                    center: 'center',
                    right: 'right',
                    both: 'justify'
                }
                cssStyle.textAlign = alignMap[style.paragraph.alignment] || 'left'
            }
            if (style.paragraph.indentation) {
                const ind = style.paragraph.indentation
                if (ind.firstLine > 0) cssStyle.textIndent = `${ind.firstLine}pt`
                if (ind.left > 0) cssStyle.paddingLeft = `${ind.left}pt`
            }
            if (style.paragraph.spacing) {
                const sp = style.paragraph.spacing
                if (sp.before > 0) cssStyle.marginTop = `${sp.before}pt`
                if (sp.after > 0) cssStyle.marginBottom = `${sp.after}pt`
                if (sp.line > 0) {
                    cssStyle.lineHeight = sp.lineRule === 'auto' ? `${sp.line / 240}` : `${sp.line}pt`
                }
            }
        }

        return cssStyle
    }

    const getFontDisplay = () => {
        if (!style.font) return null
        const parts = []
        if (style.font.eastAsia || style.font.ascii) {
            parts.push(style.font.eastAsia || style.font.ascii)
        }
        if (style.font.size) {
            parts.push(`${style.font.size}pt`)
        }
        if (style.font.color && style.font.color !== 'auto') {
            parts.push(`#${style.font.color}`)
        }
        const attrs = []
        if (style.font.bold) attrs.push('粗體')
        if (style.font.italic) attrs.push('斜體')
        if (attrs.length > 0) parts.push(attrs.join(', '))
        return parts.length > 0 ? parts.join(' • ') : null
    }

    const getOutlineLevel = () => {
        return style.paragraph?.outlineLevel !== undefined
            ? `標題階層 ${style.paragraph.outlineLevel + 1}`
            : null
    }

    const getAlignmentDisplay = () => {
        if (!style.paragraph?.alignment) return null
        const alignMap: Record<string, string> = {
            left: '靠左',
            center: '置中',
            right: '靠右',
            both: '左右對齊'
        }
        return alignMap[style.paragraph.alignment] || style.paragraph.alignment
    }

    return (
        <Card className="p-4">
            {/* 樣式資訊標題 */}
            <div className="flex items-start justify-between mb-3 pb-2 border-b">
                <div>
                    <div className="font-bold text-base">{style.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        ID: <code className="font-mono bg-muted px-1 rounded">{style.id}</code>
                        <span className="mx-1">•</span>
                        類型: {style.type}
                        {style.basedOn && (
                            <>
                                <span className="mx-1">•</span>
                                基於: {style.basedOn}
                            </>
                        )}
                    </div>
                </div>
                {getOutlineLevel() && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-semibold">
                        {getOutlineLevel()}
                    </span>
                )}
            </div>

            {/* 視覺化預覽 */}
            <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-2">
                    樣式預覽:
                </div>
                <div
                    style={getPreviewStyle()}
                    className="min-h-[3em] bg-muted/30 p-3 rounded border"
                >
                    這是使用「{style.name}」樣式的範例文字
                </div>
            </div>

            {/* 詳細樣式資訊 */}
            <div className="space-y-2 text-xs">
                {getFontDisplay() && (
                    <div className="flex items-start gap-2">
                        <span className="text-muted-foreground font-semibold min-w-[60px]">字體:</span>
                        <span className="text-foreground">{getFontDisplay()}</span>
                    </div>
                )}
                {getAlignmentDisplay() && (
                    <div className="flex items-start gap-2">
                        <span className="text-muted-foreground font-semibold min-w-[60px]">對齊:</span>
                        <span className="text-foreground">{getAlignmentDisplay()}</span>
                    </div>
                )}
                {style.paragraph?.indentation && (
                    <div className="flex items-start gap-2">
                        <span className="text-muted-foreground font-semibold min-w-[60px]">縮排:</span>
                        <span className="text-foreground">
                            {style.paragraph.indentation.firstLine > 0 && `首行 ${style.paragraph.indentation.firstLine}pt `}
                            {style.paragraph.indentation.left > 0 && `左 ${style.paragraph.indentation.left}pt `}
                            {style.paragraph.indentation.right > 0 && `右 ${style.paragraph.indentation.right}pt`}
                        </span>
                    </div>
                )}
                {style.paragraph?.spacing && (
                    <div className="flex items-start gap-2">
                        <span className="text-muted-foreground font-semibold min-w-[60px]">間距:</span>
                        <span className="text-foreground">
                            {style.paragraph.spacing.before > 0 && `段前 ${style.paragraph.spacing.before}pt `}
                            {style.paragraph.spacing.after > 0 && `段後 ${style.paragraph.spacing.after}pt `}
                            {style.paragraph.spacing.line > 0 && `行距 ${style.paragraph.spacing.line / 240}`}
                        </span>
                    </div>
                )}
            </div>
        </Card>
    )
}
