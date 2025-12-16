
import { Evidence } from "./CitationBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface SourceDetailPanelProps {
    evidence: Evidence | null;
    onClose: () => void;
}

export function SourceDetailPanel({ evidence, onClose }: SourceDetailPanelProps) {
    if (!evidence) return null;

    return (
        <Card className="h-full border-l rounded-none border-y-0 border-r-0 shadow-xl w-[400px] flex flex-col animate-in slide-in-from-right duration-300 bg-background text-foreground">
            <CardHeader className="flex flex-row items-center justify-between py-4 border-b">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        來源詳細資料
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-1" title={evidence.source_title}>
                        {evidence.source_title} • 第 {evidence.page} 頁
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4 bg-muted/5">
                <div className="space-y-6">
                    {/* Highlighted Quote */}
                    {evidence.quote && (
                        <div className="bg-muted/40 border-l-4 border-primary p-4 rounded-r-md">
                            <p className="text-sm font-medium leading-relaxed text-foreground">
                                "{evidence.quote}"
                            </p>
                        </div>
                    )}

                    {/* Context / Segment Content */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            原始內容片段
                        </h4>
                        <div className="p-4 bg-background border rounded-md text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                            {/* In a real app, we would fetch the full chunk content here. For now, we simulate it or re-use quote */}
                            {evidence.quote
                                ? `...${evidence.quote}...\n\n(此處將顯示該頁面的完整 AI 拆解段落，方便您對照上下文。)`
                                : "(無法存取原始內容)"}
                        </div>
                    </div>

                    <Button variant="outline" className="w-full gap-2">
                        <ExternalLink className="w-4 h-4" />
                        開啟原始文件 PDF
                    </Button>
                </div>
            </ScrollArea>
        </Card>
    );
}
