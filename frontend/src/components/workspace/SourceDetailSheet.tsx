"use client";

import { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Globe, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Source {
    id: string;
    title: string;
    type: string;
    status: string;
    content?: string;
    summary?: string;
    topics?: string[];
    source_type?: string;
    created_at: string;
    origin_url?: string;
}

interface SourceDetailSheetProps {
    source: Source | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGenerateSummary?: (sourceId: string) => Promise<void>;
}

export function SourceDetailSheet({
    source,
    open,
    onOpenChange,
    onGenerateSummary
}: SourceDetailSheetProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    if (!source) return null;

    const handleGenerateSummary = async () => {
        if (!onGenerateSummary) return;
        setIsGenerating(true);
        try {
            await onGenerateSummary(source.id);
        } finally {
            setIsGenerating(false);
        }
    };

    const getSourceTypeLabel = (type?: string) => {
        switch (type) {
            case 'upload': return '上傳文件';
            case 'url': return '網頁連結';
            case 'search': return '網路搜尋';
            case 'rfp': return 'RFP 原始文件';
            default: return '上傳文件';
        }
    };

    const getSourceTypeIcon = () => {
        if (source.type === 'web' || source.source_type === 'url') {
            return <Globe className="w-5 h-5 text-blue-500" />;
        }
        return <FileText className="w-5 h-5 text-orange-500" />;
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[90vw] sm:max-w-[90vw] overflow-hidden flex flex-col">
                <SheetHeader className="shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                            {getSourceTypeIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <SheetTitle className="truncate text-left">
                                {source.title}
                            </SheetTitle>
                            <SheetDescription className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                    {source.type?.toUpperCase()}
                                </Badge>
                                <span className="text-xs">
                                    {getSourceTypeLabel(source.source_type)}
                                </span>
                                <span className="text-xs">•</span>
                                <span className="text-xs">
                                    {new Date(source.created_at).toLocaleDateString('zh-TW')}
                                </span>
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 mt-4">
                    {/* AI 摘要區塊 */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-yellow-500" />
                                來源導覽
                            </h3>
                            {onGenerateSummary && (
                                <button
                                    onClick={handleGenerateSummary}
                                    disabled={isGenerating}
                                    className="text-xs text-primary hover:underline disabled:opacity-50"
                                >
                                    {isGenerating ? (
                                        <span className="flex items-center gap-1">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            生成中...
                                        </span>
                                    ) : (source.summary ? '重新生成' : '生成摘要')}
                                </button>
                            )}
                        </div>

                        {source.summary ? (
                            <div className="p-4 bg-muted/50 rounded-lg border">
                                <p className="text-sm leading-relaxed">{source.summary}</p>

                                {/* 話題標籤 */}
                                {source.topics && source.topics.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                                        {source.topics.map((topic, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                {topic}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-muted/30 rounded-lg border border-dashed text-center">
                                <p className="text-sm text-muted-foreground">
                                    尚未生成摘要
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 原始內容區塊 */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3">📖 原始內容</h3>
                        <div className="p-4 bg-background border rounded-lg">
                            {source.content ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none break-words break-all">
                                    <ReactMarkdown>{source.content}</ReactMarkdown>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    無法載入原始內容
                                </p>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

