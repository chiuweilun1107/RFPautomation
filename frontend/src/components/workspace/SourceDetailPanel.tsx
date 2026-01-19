
import { Evidence } from "./CitationBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface SourceDetailPanelProps {
    evidence: Evidence | null;
    onClose: () => void;
}

export function SourceDetailPanel({ evidence, source, onClose, onGenerateSummary }: any) {
    const data = evidence || source;
    if (!data) return null;

    const title = evidence ? evidence.source_title : source?.filename;
    const page = evidence ? `Page ${evidence.page}` : null;
    const content = evidence ? evidence.quote : source?.content;

    return (
        <div className="h-full w-full flex flex-col bg-white dark:bg-black font-mono">
            <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-black dark:border-white space-y-0 select-none">
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
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
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

                    {/* Highlighted Quote / Summary */}
                    {(evidence?.quote || source?.summary) && (
                        <div className="border-l-2 border-black dark:border-white pl-4 py-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-gray-500">
                                {evidence ? 'QUOTE' : 'SUMMARY'}
                            </h4>
                            <p className="text-xs leading-relaxed text-foreground">
                                "{evidence ? evidence.quote : source.summary}"
                            </p>
                        </div>
                    )}

                    {/* Context / Segment Content */}
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            {evidence ? 'CONTEXT' : 'CONTENT PREVIEW'}
                        </h4>
                        <div className="p-4 border border-black/10 dark:border-white/10 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                            {evidence
                                ? `...${evidence.quote}...\n\n(Full context placeholder)`
                                : (source?.content?.slice(0, 500) + '...') || "(No content available)"}
                        </div>
                    </div>

                    <Button variant="outline" className="w-full gap-2 rounded-none border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                        <ExternalLink className="w-4 h-4" />
                        OPEN ORIGINAL PDF
                    </Button>
                </div>
            </ScrollArea>
        </div>
    );
}
