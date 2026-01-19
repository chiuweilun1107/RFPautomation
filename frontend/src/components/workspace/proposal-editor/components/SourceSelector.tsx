"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Zap } from "lucide-react";

interface Source {
    id: string;
    title: string;
    type?: string;
}

interface SourceSelectorProps {
    sources: Source[];
    selectedSourceIds: string[];
    onToggleSource: (sourceId: string) => void;
    onOpen?: () => void;
}

/**
 * 源文献选择器 - 快速选择用于生成的源文献
 */
export function SourceSelector({
    sources,
    selectedSourceIds,
    onToggleSource,
    onOpen,
}: SourceSelectorProps) {
    const displayedSources = sources.slice(0, 5);
    const moreCount = Math.max(0, sources.length - 5);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sources ({selectedSourceIds.length})
                </span>
                {onOpen && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onOpen}
                        className="h-7 px-2"
                    >
                        <ChevronDown className="w-3 h-3" />
                    </Button>
                )}
            </div>

            <div className="space-y-1">
                {displayedSources.map((source) => (
                    <div
                        key={source.id}
                        onClick={() => onToggleSource(source.id)}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                            selectedSourceIds.includes(source.id)
                                ? "bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700"
                                : "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                    >
                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                checked={selectedSourceIds.includes(source.id)}
                                onChange={() => {}}
                                className="mt-1 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                                    {source.title}
                                </p>
                                {source.type && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                        {source.type}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {moreCount > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 py-1 px-2">
                        + {moreCount} more sources
                    </div>
                )}
            </div>
        </div>
    );
}
