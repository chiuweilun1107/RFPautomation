"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { StructureViewProps } from "./types"
import {
    EmptyState,
    StatsPanel,
    StyleCard,
    ParagraphCard,
    TableCard,
    SectionCard,
    PageBreaksPanel
} from "./components"

export function StructureView({
    styles,
    paragraphs,
    tables,
    sections,
    pageBreaks,
    engine,
    version
}: StructureViewProps) {
    const hasData = styles || paragraphs || tables

    if (!hasData) {
        return <EmptyState />
    }

    return (
        <div className="h-full flex flex-col">
            {/* 統計資訊 */}
            <StatsPanel
                styles={styles}
                paragraphs={paragraphs}
                tables={tables}
                sections={sections}
                pageBreaks={pageBreaks}
                engine={engine}
                version={version}
            />

            {/* 頁籤內容 */}
            <Tabs defaultValue="paragraphs" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-5 shrink-0">
                    <TabsTrigger value="styles" className="text-xs">樣式</TabsTrigger>
                    <TabsTrigger value="paragraphs" className="text-xs">段落</TabsTrigger>
                    <TabsTrigger value="tables" className="text-xs">表格</TabsTrigger>
                    <TabsTrigger value="sections" className="text-xs">節</TabsTrigger>
                    <TabsTrigger value="json" className="text-xs">JSON</TabsTrigger>
                </TabsList>

                {/* 樣式定義 */}
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

                {/* 段落內容 */}
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

                {/* 表格結構 */}
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
                        {pageBreaks && <PageBreaksPanel pageBreaks={pageBreaks} />}
                    </div>
                </TabsContent>

                {/* JSON 結構 */}
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
