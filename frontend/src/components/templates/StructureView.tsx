"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import type {
    StyleInfo,
    ParagraphInfo,
    TableInfo,
    TableCell,
    SectionInfo,
    PageBreakInfo,
    RunFormat
} from "@/types/template-structure"

interface StructureViewProps {
    styles?: StyleInfo[]
    paragraphs?: ParagraphInfo[]
    tables?: TableInfo[]
    sections?: SectionInfo[]
    pageBreaks?: PageBreakInfo[]
    engine?: string
    version?: string
}

// 統一的字體映射函數
function getFontFamily(fontName: string): string {
    const fontMap: Record<string, string> = {
        '標楷體': 'BiauKaiTC, BiauKaiHK, DFKai-SB, KaiTi, STKaiti, serif',
        '新細明體': 'PMingLiU, MingLiU, "Apple LiSung", serif',
        '微軟正黑體': '"Microsoft JhengHei", "PingFang TC", "Heiti TC", sans-serif',
        'Times New Roman': '"Times New Roman", Times, serif',
        'Arial': 'Arial, Helvetica, sans-serif',
        'Calibri': 'Calibri, "Helvetica Neue", sans-serif',
        'Verdana': 'Verdana, Geneva, sans-serif'
    }

    return fontMap[fontName] || `"${fontName}", sans-serif`
}

export function StructureView({ styles, paragraphs, tables, sections, pageBreaks, engine, version }: StructureViewProps) {
    const hasData = styles || paragraphs || tables

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-6xl mb-4">🔄</div>
                <h3 className="text-lg font-semibold mb-2">尚未解析</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                    此範本尚未進行結構解析。<br />
                    解析功能會自動在上傳後執行,請稍後重新整理頁面。
                </p>
            </div>
        )
    }

    // 計算統計資訊
    const mergedCellCount = tables?.reduce((acc, t) =>
        acc + (t.cells?.filter(c => c.format?.colSpan || c.format?.vMerge === 'start').length || 0)
        , 0) || 0

    return (
        <div className="h-full flex flex-col">
            {/* 統計資訊 - 增強版 */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-muted-foreground">
                        範本結構分析
                    </div>
                    <div className="text-xs bg-white dark:bg-zinc-900 px-2 py-1 rounded border border-gray-300 dark:border-zinc-600">
                        {engine || 'easy-template-x'} • {version || 'v2'}
                    </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                    <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-orange-200 dark:border-orange-900">
                        <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                            {styles?.length || 0}
                        </div>
                        <div className="text-[10px] text-muted-foreground">樣式</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-blue-200 dark:border-blue-900">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {paragraphs?.length || 0}
                        </div>
                        <div className="text-[10px] text-muted-foreground">段落</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-green-200 dark:border-green-900">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                            {tables?.length || 0}
                        </div>
                        <div className="text-[10px] text-muted-foreground">表格</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-purple-200 dark:border-purple-900">
                        <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                            {sections?.length || 0}
                        </div>
                        <div className="text-[10px] text-muted-foreground">節</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-pink-200 dark:border-pink-900">
                        <div className="text-xl font-bold text-pink-600 dark:text-pink-400">
                            {pageBreaks?.length || 0}
                        </div>
                        <div className="text-[10px] text-muted-foreground">換頁</div>
                    </div>
                </div>
                {/* 額外統計 */}
                {mergedCellCount > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                        💡 偵測到 <span className="font-semibold text-blue-500">{mergedCellCount}</span> 個合併儲存格
                    </div>
                )}
            </div>

            {/* 頁籤內容 */}
            <Tabs defaultValue="paragraphs" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-5 shrink-0">
                    <TabsTrigger value="styles" className="text-xs">樣式</TabsTrigger>
                    <TabsTrigger value="paragraphs" className="text-xs">段落</TabsTrigger>
                    <TabsTrigger value="tables" className="text-xs">表格</TabsTrigger>
                    <TabsTrigger value="sections" className="text-xs">節</TabsTrigger>
                    <TabsTrigger value="json" className="text-xs">JSON</TabsTrigger>
                </TabsList>

                {/* 樣式定義 - 單一滾動條 */}
                <TabsContent value="styles" className="flex-1 mt-3 overflow-y-auto custom-scrollbar">
                    <div className="space-y-3 pr-2">
                        {styles && styles.length > 0 ? (
                            <>
                                <div className="text-sm text-muted-foreground mb-2">
                                    共 {styles.length} 個樣式定義
                                </div>
                                {styles.map((style) => (
                                    <StyleCard key={style.id} style={style} />
                                ))}
                            </>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <div className="text-4xl mb-2">🎨</div>
                                <div>無樣式資料</div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* 段落內容 - 單一滾動條 */}
                <TabsContent value="paragraphs" className="flex-1 mt-3 overflow-y-auto custom-scrollbar">
                    <div className="space-y-3 pr-2">
                        {paragraphs && paragraphs.length > 0 ? (
                            <>
                                <div className="text-sm text-muted-foreground mb-2">
                                    共 {paragraphs.length} 個段落
                                </div>
                                {paragraphs.map((para, idx) => (
                                    <ParagraphCard key={para.id || `para-${idx}`} paragraph={para} />
                                ))}
                            </>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <div className="text-4xl mb-2">📝</div>
                                <div>無段落資料</div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* 表格結構 - 單一滾動條 */}
                <TabsContent value="tables" className="flex-1 mt-3 overflow-y-auto custom-scrollbar">
                    <div className="space-y-3 pr-2">
                        {tables && tables.length > 0 ? (
                            <>
                                <div className="text-sm text-muted-foreground mb-2">
                                    共 {tables.length} 個表格
                                </div>
                                {tables.map((table, idx) => (
                                    <TableCard key={`table-${table.index}-${idx}`} table={table} />
                                ))}
                            </>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <div className="text-4xl mb-2">📊</div>
                                <div>無表格資料</div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* 節結構 */}
                <TabsContent value="sections" className="flex-1 mt-3 overflow-y-auto custom-scrollbar">
                    <div className="space-y-3 pr-2">
                        {sections && sections.length > 0 ? (
                            sections.map((section, idx) => (
                                <SectionCard key={idx} section={section} index={idx} />
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                <div className="text-4xl mb-2">📄</div>
                                <p>無節資料或僅有單一節</p>
                            </div>
                        )}

                        {/* 換頁資訊 */}
                        {pageBreaks && pageBreaks.length > 0 && (
                            <div className="mt-4 p-3 bg-pink-50 dark:bg-pink-950 rounded-lg border border-pink-200 dark:border-pink-800">
                                <div className="text-sm font-medium text-pink-700 dark:text-pink-300 mb-2">
                                    📃 換頁位置 ({pageBreaks.length})
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {pageBreaks.map((pb, idx) => (
                                        <span
                                            key={idx}
                                            className="text-xs bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 px-2 py-1 rounded"
                                        >
                                            {pb.type === 'before' ? '段落前' : '內嵌'} @ 段落 {pb.paragraphIndex + 1}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* JSON 結構 - 單一滾動條 */}
                <TabsContent value="json" className="flex-1 mt-3 overflow-y-auto custom-scrollbar">
                    <div className="pr-2">
                        <div className="text-sm text-muted-foreground mb-2">
                            原始 JSON 資料結構（完整版）
                        </div>
                        <pre className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-lg text-xs overflow-x-auto border border-gray-700">
                            {JSON.stringify({ styles, paragraphs, tables, sections, pageBreaks }, null, 2)}
                        </pre>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

// 樣式卡片元件 - 帶視覺化預覽
function StyleCard({ style }: { style: StyleInfo }) {
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

            {/* 視覺化預覽 - 移除多餘容器 */}
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

// 段落卡片元件 - WYSIWYG 渲染版本
function ParagraphCard({ paragraph }: { paragraph: ParagraphInfo }) {
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

    // 將 Run 格式轉換為 CSS 樣式
    const getRunStyle = (runFormat?: RunFormat): React.CSSProperties => {
        const style: React.CSSProperties = {}

        if (!runFormat) return style

        // 字體
        if (runFormat.font) {
            style.fontFamily = getFontFamily(runFormat.font)
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

        // 刪除線
        if (runFormat.strike) {
            style.textDecoration = style.textDecoration
                ? `${style.textDecoration} line-through`
                : 'line-through'
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

            {/* WYSIWYG 預覽區域 - 移除多餘容器 */}
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

// 表格卡片元件 - 帶實際表格渲染
function TableCard({ table }: { table: TableInfo }) {
    const totalCells = table.rows * table.cols

    // 將 Run 格式轉換為 CSS 樣式
    const getRunStyle = (runFormat?: RunFormat): React.CSSProperties => {
        const style: React.CSSProperties = {}
        if (!runFormat) return style

        if (runFormat.font) {
            style.fontFamily = getFontFamily(runFormat.font)
        }
        if (runFormat.size) style.fontSize = `${runFormat.size}pt`
        if (runFormat.color && runFormat.color !== 'auto') style.color = `#${runFormat.color}`
        if (runFormat.bold) style.fontWeight = 'bold'
        if (runFormat.italic) style.fontStyle = 'italic'
        if (runFormat.underline) style.textDecoration = 'underline'

        return style
    }

    // 建立表格矩陣（支援合併儲存格）
    const renderTableGrid = () => {
        if (!table.cells || table.cells.length === 0) {
            return (
                <div className="text-center text-muted-foreground py-4">
                    無儲存格資料
                </div>
            )
        }

        // 建立二維陣列，追蹤合併狀態
        const grid: (TableCell | null)[][] = Array(table.rows).fill(null).map(() =>
            Array(table.cols).fill(null)
        )

        // 追蹤哪些儲存格因為合併而應該跳過
        const skipCells: Set<string> = new Set()

        // 追蹤垂直合併的 rowSpan
        const vMergeSpans: Map<string, number> = new Map()

        // 第一次遍歷：填充儲存格資料並計算垂直合併
        table.cells.forEach(cell => {
            if (cell.row < table.rows && cell.col < table.cols) {
                grid[cell.row][cell.col] = cell

                // 計算 colSpan 需要跳過的儲存格
                const colSpan = cell.format?.colSpan || 1
                if (colSpan > 1) {
                    for (let i = 1; i < colSpan; i++) {
                        if (cell.col + i < table.cols) {
                            skipCells.add(`${cell.row}-${cell.col + i}`)
                        }
                    }
                }
            }
        })

        // 第二次遍歷：計算垂直合併的 rowSpan
        for (let col = 0; col < table.cols; col++) {
            let mergeStartRow = -1
            for (let row = 0; row < table.rows; row++) {
                const cell = grid[row][col]
                if (cell?.format?.vMerge === 'start') {
                    mergeStartRow = row
                } else if (cell?.format?.vMerge === 'continue' && mergeStartRow >= 0) {
                    skipCells.add(`${row}-${col}`)
                    const key = `${mergeStartRow}-${col}`
                    vMergeSpans.set(key, (vMergeSpans.get(key) || 1) + 1)
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
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border text-sm">
                    {/* 欄寬設定 */}
                    {table.columnWidths && table.columnWidths.length > 0 && (
                        <colgroup>
                            {table.columnWidths.map((width, idx) => (
                                <col key={idx} style={{ width: `${width}pt` }} />
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
                                                className="border p-2"
                                                style={{
                                                    backgroundColor: cell?.format?.backgroundColor
                                                        ? `#${cell.format.backgroundColor}`
                                                        : undefined,
                                                    verticalAlign: cell?.format?.vAlign || 'top',
                                                    textAlign: getTextAlign(cell?.format?.hAlign)
                                                }}
                                            >
                                                {cell ? (
                                                    <>
                                                        {cell.runs && cell.runs.length > 0 ? (
                                                            cell.runs.map((run, runIdx) => (
                                                                <span key={runIdx} style={getRunStyle(run.format)}>
                                                                    {run.text}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-muted-foreground">{cell.text || '(空)'}</span>
                                                        )}
                                                        {/* 顯示合併標記 */}
                                                        {(colSpan > 1 || rowSpan > 1) && (
                                                            <span className="ml-1 text-[10px] text-blue-500 opacity-50">
                                                                {colSpan > 1 && `↔${colSpan}`}
                                                                {rowSpan > 1 && `↕${rowSpan}`}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
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

    return (
        <Card className="p-4">
            {/* 表格資訊標題 */}
            <div className="flex items-start justify-between mb-3 pb-2 border-b">
                <div>
                    <div className="font-bold text-base">表格 {table.index + 1}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {String(table.rows)} 列 × {String(table.cols)} 欄
                        <span className="mx-1">•</span>
                        {totalCells} 儲存格
                        {table.format?.style && (
                            <>
                                <span className="mx-1">•</span>
                                樣式: {table.format.style}
                            </>
                        )}
                    </div>
                </div>
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded font-semibold">
                    表格
                </span>
            </div>

            {/* 表格實際渲染預覽 - 移除多餘容器 */}
            <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-2">
                    表格預覽:
                </div>
                {renderTableGrid()}
            </div>

            {/* 詳細儲存格資訊 (可摺疊) - 移除內部滾動條 */}
            {table.cells && table.cells.length > 0 && (
                <details className="mt-3">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        查看詳細儲存格資訊 ({table.cells.length} 個儲存格)
                    </summary>
                    <div className="mt-2 space-y-1">
                        {table.cells.slice(0, 10).map((cell, idx) => (
                            <div key={idx} className="text-xs bg-muted p-2 rounded">
                                <div className="font-mono text-muted-foreground mb-1">
                                    位置: [{cell.row}, {cell.col}]
                                </div>
                                <div className="mb-1">{cell.text || '(空)'}</div>
                                {cell.runs && cell.runs.length > 0 && cell.runs[0].format && (
                                    <div className="text-muted-foreground">
                                        {cell.runs[0].format.font && `字體: ${cell.runs[0].format.font} `}
                                        {cell.runs[0].format.size && `${cell.runs[0].format.size}pt `}
                                        {cell.runs[0].format.bold && '粗體 '}
                                        {cell.runs[0].format.color && cell.runs[0].format.color !== 'auto' && `顏色: #${cell.runs[0].format.color}`}
                                    </div>
                                )}
                            </div>
                        ))}
                        {table.cells.length > 10 && (
                            <div className="text-xs text-muted-foreground text-center py-2">
                                還有 {table.cells.length - 10} 個儲存格...
                            </div>
                        )}
                    </div>
                </details>
            )}
        </Card>
    )
}

// 節卡片元件 - 顯示頁面設定和節屬性
function SectionCard({ section, index }: { section: SectionInfo; index: number }) {
    const getOrientationIcon = () => {
        return section.pageSize?.orientation === 'landscape' ? '🖼️' : '📄'
    }

    const getSectionTypeLabel = (type?: string) => {
        switch (type) {
            case 'continuous': return '連續'
            case 'evenPage': return '偶數頁'
            case 'oddPage': return '奇數頁'
            case 'nextPage':
            default: return '下一頁'
        }
    }

    return (
        <Card className="p-4">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{getOrientationIcon()}</span>
                    <div>
                        <div className="font-bold text-base">
                            {section.isDocumentLevel ? '文件設定' : `節 ${index + 1}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {getSectionTypeLabel(section.type)}
                            {section.endParagraphIndex !== undefined && ` • 結束於段落 ${section.endParagraphIndex + 1}`}
                        </div>
                    </div>
                </div>
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded font-semibold">
                    {section.isDocumentLevel ? '文件' : '節'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
                {/* 頁面大小 */}
                {section.pageSize && (
                    <div className="bg-gray-50 dark:bg-zinc-800 p-2 rounded">
                        <div className="text-muted-foreground mb-1">頁面大小</div>
                        <div className="font-mono">
                            {Math.round(section.pageSize.width)} × {Math.round(section.pageSize.height)} pt
                        </div>
                        <div className="text-muted-foreground">
                            ({section.pageSize.orientation === 'landscape' ? '橫向' : '直向'})
                        </div>
                    </div>
                )}

                {/* 邊距 */}
                {section.margins && (
                    <div className="bg-gray-50 dark:bg-zinc-800 p-2 rounded">
                        <div className="text-muted-foreground mb-1">邊距</div>
                        <div className="font-mono text-[10px]">
                            上: {Math.round(section.margins.top)}pt &nbsp;
                            下: {Math.round(section.margins.bottom)}pt<br />
                            左: {Math.round(section.margins.left)}pt &nbsp;
                            右: {Math.round(section.margins.right)}pt
                        </div>
                    </div>
                )}

                {/* 欄位 */}
                {section.columns && section.columns.num > 1 && (
                    <div className="bg-gray-50 dark:bg-zinc-800 p-2 rounded">
                        <div className="text-muted-foreground mb-1">分欄</div>
                        <div className="font-mono">
                            {section.columns.num} 欄
                            {section.columns.equalWidth && ' (等寬)'}
                        </div>
                    </div>
                )}

                {/* 頁首頁尾 */}
                {(section.headers || section.footers) && (
                    <div className="bg-gray-50 dark:bg-zinc-800 p-2 rounded">
                        <div className="text-muted-foreground mb-1">頁首/頁尾</div>
                        <div className="font-mono text-[10px]">
                            {section.headers?.length || 0} 頁首 • {section.footers?.length || 0} 頁尾
                        </div>
                    </div>
                )}

                {/* 頁碼設定 */}
                {section.pageNumbers && (
                    <div className="bg-gray-50 dark:bg-zinc-800 p-2 rounded col-span-2">
                        <div className="text-muted-foreground mb-1">頁碼設定</div>
                        <div className="font-mono">
                            格式: {section.pageNumbers.format} • 起始: {section.pageNumbers.start}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}
