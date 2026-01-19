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
            <SheetContent side="right" className="w-[90vw] sm:max-w-[45vw] overflow-hidden flex flex-col border-l border-black dark:border-white p-0 rounded-none bg-white dark:bg-black">
                <SheetHeader className="shrink-0 p-6 border-b border-black dark:border-white bg-white dark:bg-black text-black dark:text-white">
                    <div className="flex items-start gap-4">
                        <div className="p-2 border border-black dark:border-white shrink-0">
                            {getSourceTypeIcon()}
                        </div>
                        <div className="flex-1 min-w-0 font-mono">
                            <SheetTitle className="text-lg font-bold uppercase tracking-wider text-left break-words">
                                {source.title}
                            </SheetTitle>
                            <SheetDescription className="flex flex-wrap items-center gap-2 mt-2 font-mono text-xs uppercase text-gray-500">
                                <Badge variant="outline" className="rounded-none border-black dark:border-white uppercase text-[10px] px-1 py-0 h-5">
                                    {source.type}
                                </Badge>
                                <span className="text-[10px]">
                                    {getSourceTypeLabel(source.source_type)}
                                </span>
                                <span>/</span>
                                <span className="text-[10px]">
                                    {new Date(source.created_at).toLocaleDateString('zh-TW')}
                                </span>
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 bg-white dark:bg-black">
                    <div className="p-6 space-y-8 font-mono">
                        {/* AI 摘要區塊 */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-black dark:border-white pb-2">
                                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Source Summary
                                </h3>
                                {onGenerateSummary && (
                                    <button
                                        onClick={handleGenerateSummary}
                                        disabled={isGenerating}
                                        className="text-[10px] uppercase font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black px-2 py-1 border border-transparent hover:border-black dark:hover:border-white transition-colors disabled:opacity-50"
                                    >
                                        {isGenerating ? (
                                            <span className="flex items-center gap-1">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Generating...
                                            </span>
                                        ) : (source.summary ? 'Regenerate' : 'Generate Summary')}
                                    </button>
                                )}
                            </div>

                            {source.summary ? (
                                <div className="space-y-4">
                                    <p className="text-sm leading-relaxed text-justify opacity-90">{source.summary}</p>

                                    {/* 話題標籤 */}
                                    {source.topics && source.topics.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {source.topics.map((topic, idx) => (
                                                <Badge key={idx} variant="outline" className="rounded-none border-black dark:border-white text-[10px] uppercase px-1.5 py-0.5 font-normal">
                                                    #{topic}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
                                    <p className="text-xs uppercase tracking-wider text-gray-400">
                                        No summary generated yet
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 原始內容區塊 */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-black dark:border-white pb-2">
                                Original Content
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-900 border border-black/10 dark:border-white/10 p-4 min-h-[200px]">
                                {source.content ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none break-words break-all font-sans text-xs leading-relaxed opacity-80">
                                        <ReactMarkdown>{source.content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="text-xs uppercase text-gray-400 text-center py-8 tracking-wider">
                                        Content not available
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

