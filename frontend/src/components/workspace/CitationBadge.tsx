
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText } from "lucide-react";

export interface Evidence {
    id: number;
    source_id: string; // UUID of the source
    page: number;
    source_title: string;
    quote?: string; // Optional excerpt
}

interface CitationBadgeProps {
    evidence: Evidence;
    onClick?: (evidence: Evidence) => void;
}

export function CitationBadge({ evidence, onClick }: CitationBadgeProps) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                    <span
                        className="inline-flex align-top ml-1 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick?.(evidence);
                        }}
                    >
                        <Badge
                            variant="secondary"
                            className="h-5 px-1.5 text-[10px] font-medium min-w-[1.25rem] justify-center hover:bg-primary hover:text-primary-foreground transition-colors rounded-sm"
                        >
                            {evidence.id}
                        </Badge>
                    </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] p-3 text-xs bg-popover text-popover-foreground border-2 border-foreground shadow-xl">
                    <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="space-y-1">
                            <p className="font-semibold text-foreground">{evidence.source_title}</p>
                            <p className="text-muted-foreground">
                                Page {evidence.page}
                                {evidence.quote && (
                                    <span className="block mt-1 pt-1 border-t border-border/50 italic text-muted-foreground/80">
                                        "{evidence.quote}"
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
