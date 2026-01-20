"use client"

import * as React from "react"
import type { ParagraphInfo, RunFormat } from "@/types/template-structure"

interface DocumentPreviewProps {
    paragraphs?: ParagraphInfo[]
}

// 統一的字體映射函數
function getFontFamily(fontName: string): string {
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

    return fontMap[fontName] || `"${fontName}", sans-serif`
}

// 將 Run 格式轉換為 CSS 樣式
function getRunStyle(runFormat?: RunFormat): React.CSSProperties {
    const style: React.CSSProperties = {}
    if (!runFormat) return style

    if (runFormat.font) {
        style.fontFamily = getFontFamily(runFormat.font)
    }
    if (runFormat.size) {
        style.fontSize = `${runFormat.size}pt`
    }
    if (runFormat.color && runFormat.color !== 'auto') {
        style.color = `#${runFormat.color}`
    }
    if (runFormat.bold) {
        style.fontWeight = 'bold'
    }
    if (runFormat.italic) {
        style.fontStyle = 'italic'
    }
    if (runFormat.underline) {
        style.textDecoration = 'underline'
    }

    return style
}

// 將段落格式轉換為 CSS 樣式
function getParagraphStyle(paragraph: ParagraphInfo): React.CSSProperties {
    const style: React.CSSProperties = {}

    if (paragraph.format?.alignment) {
        const alignMap: Record<string, string> = {
            left: 'left',
            center: 'center',
            right: 'right',
            both: 'justify'
        }
        style.textAlign = alignMap[paragraph.format.alignment] as any
    }

    if (paragraph.format?.indentation) {
        const ind = paragraph.format.indentation
        if (ind.firstLine > 0) {
            style.textIndent = `${ind.firstLine}pt`
        }
        if (ind.left > 0) {
            style.paddingLeft = `${ind.left}pt`
        }
        if (ind.right > 0) {
            style.paddingRight = `${ind.right}pt`
        }
    }

    if (paragraph.format?.spacing) {
        const sp = paragraph.format.spacing
        if (sp.before > 0) {
            style.marginTop = `${sp.before}pt`
        }
        if (sp.after > 0) {
            style.marginBottom = `${sp.after}pt`
        }
        if (sp.line) {
            style.lineHeight = sp.line
        }
    }

    return style
}

export function DocumentPreview({ paragraphs }: DocumentPreviewProps) {
    if (!paragraphs || paragraphs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-lg font-semibold mb-2">無預覽內容</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                    此範本尚未解析或無段落內容。
                </p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 p-8 shadow-sm">
            {paragraphs.map((paragraph) => (
                <div
                    key={paragraph.index}
                    style={getParagraphStyle(paragraph)}
                    className="mb-2"
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
            ))}
        </div>
    )
}

