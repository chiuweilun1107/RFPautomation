import { Card } from "@/components/ui/card"
import type { SectionCardProps } from "../types"

export function SectionCard({ section, index }: SectionCardProps) {
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
