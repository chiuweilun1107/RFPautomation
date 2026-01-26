import * as React from "react"
import { Card } from "@/components/ui/card"
import type { TableCell } from "@/types/template-structure"
import type { TableCardProps } from "../types"
import { getRunStyle, getTextAlign } from "../utils"

export function TableCard({ table }: TableCardProps) {
    const totalCells = table.rows * table.cols

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

            {/* 表格實際渲染預覽 */}
            <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-2">
                    表格預覽:
                </div>
                {renderTableGrid()}
            </div>

            {/* 詳細儲存格資訊 (可摺疊) */}
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
