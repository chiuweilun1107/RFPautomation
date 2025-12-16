"use client";

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Globe, Sparkles, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';

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

interface SourceDetailPanelProps {
    source: Source | null;
    onClose: () => void;
    onGenerateSummary?: (sourceId: string) => Promise<void>;
}

export function SourceDetailPanel({
    source,
    onClose,
    onGenerateSummary
}: SourceDetailPanelProps) {
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
        <div className="flex flex-col h-full bg-background rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between gap-3 shrink-0 bg-muted/5">
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="p-2 bg-background rounded-lg border shadow-sm shrink-0">
                        {getSourceTypeIcon()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold truncate leading-none">
                            {source.title}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs font-normal">
                                {source.type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {getSourceTypeLabel(source.source_type)}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                                {new Date(source.created_at).toLocaleDateString('zh-TW')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions Area */}
                <div className="flex items-center gap-2 shrink-0">
                    {onGenerateSummary && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateSummary}
                            disabled={isGenerating}
                            className="h-9 gap-2"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className="hidden sm:inline">
                                {isGenerating ? '生成中...' : (source.summary ? '重新生成摘要' : '生成摘要')}
                            </span>
                        </Button>
                    )}

                    <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1">
                <div className="p-6 max-w-5xl mx-auto w-full space-y-8">
                    {/* 1. AI Summary Section */}
                    <section>
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-primary">
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                            來源導覽 (AI Summary)
                        </h3>

                        {source.summary ? (
                            <div className="bg-muted/30 rounded-xl p-5 border">
                                <p className="text-sm leading-7 text-foreground/90">{source.summary}</p>
                                {/* Topics */}
                                {source.topics && source.topics.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dashed">
                                        {source.topics.map((topic, idx) => (
                                            <Badge key={idx} variant="secondary" className="px-2 py-0.5 text-xs font-normal bg-background/50 hover:bg-background">
                                                #{topic}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-8 bg-muted/20 rounded-xl border border-dashed flex flex-col items-center justify-center text-muted-foreground">
                                <Sparkles className="w-8 h-8 opacity-20 mb-2" />
                                <p className="text-sm">尚未生成 AI 摘要</p>
                                <p className="text-xs opacity-70 mt-1">點擊右上方按鈕開始分析</p>
                            </div>
                        )}
                    </section>

                    {/* 2. Original Content Section */}
                    <section>
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-primary">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            原始內容 (Original Content)
                        </h3>
                        <div className="bg-background border rounded-xl overflow-hidden w-full">
                            {source.content ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none p-8 break-words break-all">
                                    <ReactMarkdown>{source.content}</ReactMarkdown>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-muted-foreground">
                                    無法載入原始內容
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </ScrollArea>
        </div>
    );
}
