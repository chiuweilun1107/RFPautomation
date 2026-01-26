
import { Evidence } from "./CitationBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ExternalLink, Loader2, Search, ChevronUp, ChevronDown } from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { TableOfContents } from "./TableOfContents";
import { PageNavigation } from "./PageNavigation";
import { useRef, useState, useEffect, useMemo } from "react";
import { PageContent } from "@/types/content";
import { createClient } from "@/lib/supabase/client";

interface Source {
    id: string;
    title?: string;
    filename?: string;
    content?: string;
    summary?: string;
    pages?: PageContent[];
    type?: string;
    origin_url?: string;
}

interface SourceDetailPanelProps {
    evidence?: Evidence | null;
    source?: Source | null;
    onClose: () => void;
    onGenerateSummary?: (sourceId: string) => void;
}

export function SourceDetailPanel({ evidence, source, onClose, onGenerateSummary }: SourceDetailPanelProps) {
    const data = evidence || source;
    const contentRef = useRef<HTMLDivElement>(null);
    const contentContainerRef = useRef<HTMLDivElement>(null);

    // Page navigation state
    const [currentPage, setCurrentPage] = useState(1);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [matches, setMatches] = useState<{ start: number, end: number }[]>([]);



    if (!data) return null;

    const title = evidence ? evidence.source_title : (source?.title || source?.filename);
    const page = evidence ? `Page ${evidence.page}` : null;

    // Determine if source has pages and should use page navigation
    const hasPages = source?.pages && Array.isArray(source.pages) && source.pages.length > 0;
    const isPDF = source?.type?.toLowerCase() === 'pdf';
    const shouldShowPageNavigation = hasPages && isPDF;

    // When evidence + source both exist, show full content with highlight
    const showFullContentWithHighlight = !!(evidence && source);

    // Helper to get original URL (handles relative Supabase paths)
    const getOriginalUrl = (url: string) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;

        // Handle Supabase relative paths (from raw-files bucket)
        const supabase = createClient();
        const { data: { publicUrl } } = supabase.storage
            .from('raw-files')
            .getPublicUrl(url);
        return publicUrl;
    };

    const originalUrl = source?.origin_url ? getOriginalUrl(source.origin_url) : null;
    const hasOriginalSource = !!originalUrl;

    // Helper to get preview URL (e.g., wrap Office files in Microsoft Office Viewer)
    const getPreviewUrl = (url: string) => {
        if (!url) return null;
        const type = source?.type?.toLowerCase();

        // List of formats supported by Microsoft Office Online Viewer
        const officeFormats = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'];

        if (type && officeFormats.includes(type)) {
            return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
        }

        return url;
    };

    const previewUrl = originalUrl ? getPreviewUrl(originalUrl) : null;

    // Determine Action Text
    const actionText = useMemo(() => {
        const type = source?.type?.toLowerCase();
        if (!type) return 'OPEN ORIGINAL SOURCE';

        const typeLabels: Record<string, string> = {
            'pdf': 'OPEN ORIGINAL PDF',
            'docx': 'OPEN ORIGINAL DOCX',
            'doc': 'OPEN ORIGINAL DOC',
            'xlsx': 'OPEN ORIGINAL EXCEL',
            'xls': 'OPEN ORIGINAL EXCEL',
            'pptx': 'OPEN ORIGINAL PPT',
            'ppt': 'OPEN ORIGINAL PPT',
            'web': 'OPEN ORIGINAL PAGE',
            'web_crawl': 'OPEN ORIGINAL PAGE'
        };

        return typeLabels[type] || `OPEN ORIGINAL ${type.toUpperCase()}`;
    }, [source?.type]);


    // Get content based on context
    const content = useMemo(() => {
        // If evidence + source exist, show full content (PDF page or full content)
        if (showFullContentWithHighlight) {
            if (shouldShowPageNavigation && source?.pages) {
                return source.pages[currentPage - 1]?.content;
            }
            return source?.content;
        }

        // Otherwise fallback to old behavior
        if (evidence) {
            return evidence.quote;
        }

        if (shouldShowPageNavigation && source?.pages) {
            return source.pages[currentPage - 1]?.content;
        }

        return source?.content;
    }, [evidence, source, showFullContentWithHighlight, shouldShowPageNavigation, currentPage]);

    // Search logic
    useEffect(() => {
        if (!data || !content || !searchQuery.trim()) {
            setMatches([]);
            setCurrentMatchIndex(0);
            return;
        }

        const query = searchQuery.toLowerCase();
        const text = content.toLowerCase();
        const newMatches: { start: number, end: number }[] = [];

        let pos = text.indexOf(query);
        while (pos !== -1) {
            newMatches.push({ start: pos, end: pos + query.length });
            pos = text.indexOf(query, pos + 1);
        }

        setMatches(newMatches);
        setCurrentMatchIndex(0);
    }, [content, searchQuery, data]);

    // Scroll to match
    useEffect(() => {
        if (matches.length > 0 && currentMatchIndex >= 0 && currentMatchIndex < matches.length) {
            const matchId = `search-match-${currentMatchIndex}`;
            const element = document.getElementById(matchId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentMatchIndex, matches.length, searchQuery]);

    // Render search highlights
    const searchHighlightedContent = useMemo(() => {
        if (!content || matches.length === 0) return null;

        const parts = [];
        let lastIndex = 0;

        matches.forEach((match, index) => {
            if (match.start > lastIndex) {
                parts.push(content.substring(lastIndex, match.start));
            }
            const isCurrent = index === currentMatchIndex;
            parts.push(
                <mark
                    key={`match-${index}`}
                    id={`search-match-${index}`}
                    className={`${isCurrent ? 'bg-orange-500 text-white' : 'bg-yellow-200 dark:bg-yellow-800/60 text-black dark:text-white'} font-semibold px-0.5 rounded-sm transition-colors duration-200`}
                >
                    {content.substring(match.start, match.end)}
                </mark>
            );
            lastIndex = match.end;
        });
        if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
        }
        return <>{parts}</>;
    }, [content, matches, currentMatchIndex]);

    const handleNextMatch = () => {
        if (matches.length === 0) return;
        setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
    };

    const handlePrevMatch = () => {
        if (matches.length === 0) return;
        setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
    };

    // Initialize page to evidence.page when badge is clicked
    useEffect(() => {
        if (evidence?.page && shouldShowPageNavigation) {
            setCurrentPage(evidence.page);
        }
    }, [evidence?.page, shouldShowPageNavigation]);

    // Auto-scroll to highlighted quote
    useEffect(() => {
        if (showFullContentWithHighlight && evidence?.quote && contentContainerRef.current) {
            // Small delay to ensure DOM is rendered
            const timer = setTimeout(() => {
                const markElement = contentContainerRef.current?.querySelector('mark');
                if (markElement) {
                    markElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showFullContentWithHighlight, evidence?.quote, currentPage, content]);

    // Helper function to highlight quote in content
    const highlightContent = useMemo(() => {
        if (!showFullContentWithHighlight || !evidence?.quote || !content) {
            return null;
        }

        const quote = evidence.quote.trim();

        // Handle ellipsis in quotes - find start and end positions
        const hasEllipsis = quote.includes('...');
        let quoteSegments: string[] = [];

        if (hasEllipsis) {
            // Split by ellipsis and filter out short segments
            quoteSegments = quote.split('...').map(s => s.trim()).filter(s => s.length > 15);
        }

        // Aggressive normalization for better matching
        const normalizeForMatching = (str: string) => {
            return str
                .replace(/\s+/g, '') // Remove ALL whitespace
                .replace(/[，。！？；：、]/g, (m) => { // Normalize Chinese punctuation
                    const map: Record<string, string> = { '，': ',', '。': '.', '！': '!', '？': '?', '；': ';', '：': ':', '、': ',' };
                    return map[m] || m;
                });
        };

        const normalizedContent = normalizeForMatching(content);

        // Helper to find position in original content from normalized index
        const findOriginalPosition = (normalizedIdx: number): number => {
            let normalizedCharCount = 0;
            for (let i = 0; i < content.length; i++) {
                if (!/\s/.test(content[i])) {
                    if (normalizedCharCount === normalizedIdx) {
                        return i;
                    }
                    normalizedCharCount++;
                }
            }
            return -1;
        };

        let startIndex = -1;
        let endIndex = -1;

        if (hasEllipsis && quoteSegments.length >= 2) {
            // Find first and last segments
            const firstSegment = quoteSegments[0];
            const lastSegment = quoteSegments[quoteSegments.length - 1];

            const normalizedFirst = normalizeForMatching(firstSegment);
            const normalizedLast = normalizeForMatching(lastSegment);

            // Find first segment position
            const firstNormalizedIdx = normalizedContent.indexOf(normalizedFirst);
            if (firstNormalizedIdx !== -1) {
                startIndex = findOriginalPosition(firstNormalizedIdx);
            }

            // Find last segment position
            const lastNormalizedIdx = normalizedContent.indexOf(normalizedLast, firstNormalizedIdx + normalizedFirst.length);
            if (lastNormalizedIdx !== -1) {
                const lastStartPos = findOriginalPosition(lastNormalizedIdx);
                // Calculate end position by counting through the last segment
                let normalizedMatched = 0;
                for (let i = lastStartPos; i < content.length && normalizedMatched < normalizedLast.length; i++) {
                    if (!/\s/.test(content[i])) {
                        normalizedMatched++;
                    }
                    if (normalizedMatched >= normalizedLast.length) {
                        endIndex = i + 1;
                        break;
                    }
                }
            }

        } else {
            // No ellipsis, find single quote
            const normalizedQuote = normalizeForMatching(quote);
            const normalizedIdx = normalizedContent.indexOf(normalizedQuote);

            if (normalizedIdx !== -1) {
                startIndex = findOriginalPosition(normalizedIdx);

                // Calculate end position
                let normalizedMatched = 0;
                for (let i = startIndex; i < content.length && normalizedMatched < normalizedQuote.length; i++) {
                    if (!/\s/.test(content[i])) {
                        normalizedMatched++;
                    }
                    if (normalizedMatched >= normalizedQuote.length) {
                        endIndex = i + 1;
                        break;
                    }
                }
            }

            // Fallback: exact match
            if (startIndex === -1) {
                startIndex = content.indexOf(quote);
                if (startIndex !== -1) {
                    endIndex = startIndex + quote.length;
                }
            }
        }

        if (startIndex === -1 || endIndex === -1) {
            console.warn('[SourceDetailPanel] Quote not found in content. Quote:', quote.substring(0, 100));
            return null;
        }

        const beforeQuote = content.substring(0, startIndex);
        const quotePart = content.substring(startIndex, endIndex);
        const afterQuote = content.substring(endIndex);

        return (
            <>
                {beforeQuote}
                <mark
                    className="bg-yellow-200 dark:bg-yellow-800/80 text-black dark:text-white font-semibold px-1 py-0.5 rounded-sm"
                    data-highlighted="true"
                >
                    {quotePart}
                </mark>
                {afterQuote}
            </>
        );
    }, [showFullContentWithHighlight, evidence?.quote, content]);

    // 處理章節導航
    const handleNavigate = (itemId: string) => {
        if (!contentRef.current || !contentContainerRef.current) return;

        const contentText = content || '';
        const lines = contentText.split('\n');

        // 解析對應的章節標題索引
        const tocItemIndex = parseInt(itemId.split('-')[1]);

        // 找到目標標題在內容中的位置
        let targetLineIndex = -1;
        let currentTocIndex = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // 檢查是否是標題行（目錄格式或 markdown 標題）
            const isTocItem = line.match(/\[(.*?)\s+\d+\]\(\.\)/) || line.match(/^#{1,3}\s+/);

            if (isTocItem) {
                if (currentTocIndex === tocItemIndex) {
                    targetLineIndex = i;
                    break;
                }
                currentTocIndex++;
            }
        }

        if (targetLineIndex !== -1) {
            // 計算目標位置
            // 使用字符計數來估算更精確的位置
            const linesBeforeTarget = lines.slice(0, targetLineIndex);
            const charCountBefore = linesBeforeTarget.join('\n').length;

            // 假設平均每個字符在渲染後約 0.15px 高度（根據字體大小調整）
            // 這是一個粗略估計，實際效果取決於字體和行高
            const estimatedPosition = Math.max(0, charCountBefore * 0.15);

            // 平滑滾動到目標位置
            contentContainerRef.current.scrollTo({
                top: estimatedPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-white dark:bg-black font-mono">
            <CardHeader className="flex flex-col space-y-3 py-4 border-b border-black dark:border-white select-none">
                <div className="flex flex-row items-center justify-between w-full">
                    <div className="space-y-1">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                            {evidence ? 'CITATION DETAILS' : 'SOURCE DETAILS'}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground line-clamp-1 truncate max-w-[280px]" title={title}>
                            {title} {page && `• ${page}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#FA4028] hover:text-white dark:hover:bg-[#FA4028] rounded-none transition-colors border border-black dark:border-white" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Search Bar - Matching Image 1 aesthetic */}
                <div className="w-full flex items-center gap-2 bg-white dark:bg-black p-2 rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                    <Search className="h-5 w-5 text-black dark:text-white ml-1 shrink-0" />
                    <Input
                        className="h-8 border-none shadow-none focus-visible:ring-0 bg-transparent px-2 text-sm font-bold placeholder:text-gray-400 placeholder:italic"
                        placeholder="Search content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {matches.length > 0 && (
                        <div className="flex items-center gap-1 pr-1">
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap min-w-[30px] text-center">
                                {currentMatchIndex + 1} / {matches.length}
                            </span>
                            <div className="flex gap-0.5">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-sm hover:bg-background"
                                    onClick={handlePrevMatch}
                                >
                                    <ChevronUp className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-sm hover:bg-background"
                                    onClick={handleNextMatch}
                                >
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </CardHeader>

            {/* Table of Contents - 僅對完整內容顯示且沒有頁面導航時 */}
            {!evidence && !shouldShowPageNavigation && source?.content && !showFullContentWithHighlight && (
                <TableOfContents
                    content={source.content}
                    onNavigate={handleNavigate}
                />
            )}

            <div
                ref={contentContainerRef}
                className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar overscroll-contain"
            >
                <div className="space-y-6 pb-6" ref={contentRef}>
                    {/* Actions for Source (Generate Summary) */}
                    {source && onGenerateSummary && (
                        <Button
                            variant="outline"
                            className="w-full gap-2 rounded-none border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                            onClick={() => onGenerateSummary(source.id)}
                        >
                            <Loader2 className="w-4 h-4" />
                            GENERATE SUMMARY
                        </Button>
                    )}

                    {/* Highlighted Quote / Summary - Only show if NOT showing full content with highlight */}
                    {!showFullContentWithHighlight && (evidence?.quote || source?.summary) && (
                        <div className="border-l-2 border-black dark:border-white pl-4 py-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-gray-500">
                                {evidence ? 'QUOTE' : 'SUMMARY'}
                            </h4>
                            <p className="text-xs leading-relaxed text-foreground">
                                &ldquo;{evidence ? evidence.quote : source?.summary}&rdquo;
                            </p>
                        </div>
                    )}

                    {/* Info banner when showing full content with highlight */}
                    {showFullContentWithHighlight && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-sm">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-800 dark:text-yellow-200">
                                📍 Showing full document with highlighted citation
                            </p>
                        </div>
                    )}

                    {/* Page Navigation - Only for PDF with pages */}
                    {shouldShowPageNavigation && source.pages && (
                        <PageNavigation
                            key={source.id}
                            currentPage={currentPage}
                            totalPages={source.pages.length}
                            onPageChange={setCurrentPage}
                        />
                    )}

                    {/* Context / Segment Content */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                {showFullContentWithHighlight
                                    ? (shouldShowPageNavigation ? `PAGE ${currentPage} CONTENT` : 'FULL CONTENT')
                                    : (evidence ? 'CONTEXT' : shouldShowPageNavigation ? `PAGE ${currentPage} CONTENT` : 'FULL CONTENT')}
                            </h4>
                            {content && (
                                <span className="text-[9px] text-gray-400 uppercase tracking-wider">
                                    {content.length.toLocaleString()} characters
                                </span>
                            )}
                        </div>
                        <div className="p-4 border border-black/10 dark:border-white/10 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap max-h-[500px] overflow-y-auto custom-scrollbar">
                            {searchQuery && matches.length > 0
                                ? searchHighlightedContent
                                : (showFullContentWithHighlight && highlightContent
                                    ? highlightContent
                                    : (evidence && !showFullContentWithHighlight
                                        ? `...${evidence.quote}...\n\n(Full context placeholder)`
                                        : content || "(No content available)"))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer containing the Open Source button - matching Part 2 of Image 1 */}
            {hasOriginalSource && (
                <div className="p-4 border-t-2 border-black dark:border-white bg-white dark:bg-black shrink-0">
                    <Button
                        variant="outline"
                        className="w-full gap-3 py-6 rounded-none border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-bold tracking-wider transition-all"
                        onClick={() => {
                            if (previewUrl) window.open(previewUrl, '_blank');
                        }}
                    >
                        <ExternalLink className="w-5 h-5 font-bold" />
                        {actionText}
                    </Button>
                </div>
            )}
        </div>
    );
}
