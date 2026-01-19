"use client";

import { Source } from "../types";
import { SourceListItem } from "./SourceListItem";
import { Skeleton } from "@/components/ui/skeleton";

interface SourceListProps {
    sources: Source[];
    loading?: boolean;
    selectedSourceIds: string[];
    onSelect: (sourceId: string) => void;
    onDelete: (sourceId: string) => void;
    onPreview?: (source: Source) => void;
}

/**
 * 源文献列表 - 显示所有源并支持选择操作
 */
export function SourceList({
    sources,
    loading = false,
    selectedSourceIds,
    onSelect,
    onDelete,
    onPreview,
}: SourceListProps) {
    if (loading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        );
    }

    if (sources.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>No sources added yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {sources.map((source) => (
                <SourceListItem
                    key={source.id}
                    source={source}
                    isSelected={selectedSourceIds.includes(source.id)}
                    onSelect={() => onSelect(source.id)}
                    onDelete={() => onDelete(source.id)}
                    onPreview={() => onPreview?.(source)}
                />
            ))}
        </div>
    );
}
