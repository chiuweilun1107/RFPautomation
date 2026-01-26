import type { StatsPanelProps } from "../types"

export function StatsPanel({
    styles,
    paragraphs,
    tables,
    sections,
    pageBreaks,
    engine,
    version
}: StatsPanelProps) {
    // 計算合併儲存格數量
    const mergedCellCount = tables?.reduce((acc, t) =>
        acc + (t.cells?.filter(c => c.format?.colSpan || c.format?.vMerge === 'start').length || 0)
        , 0) || 0

    return (
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
    )
}
