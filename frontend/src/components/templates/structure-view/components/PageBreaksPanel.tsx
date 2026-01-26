import type { PageBreaksPanelProps } from "../types"

export function PageBreaksPanel({ pageBreaks }: PageBreaksPanelProps) {
    if (!pageBreaks || pageBreaks.length === 0) {
        return null
    }

    return (
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
    )
}
