"use client";

import { Source } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, FileText, Globe } from "lucide-react";

interface SourceListItemProps {
    source: Source;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onPreview?: () => void;
}

/**
 * 单个源文献项 - 显示源信息和操作
 */
export function SourceListItem({
    source,
    isSelected,
    onSelect,
    onDelete,
    onPreview,
}: SourceListItemProps) {
    const getIcon = () => {
        switch (source.type) {
            case "web":
            case "web_crawl":
                return <Globe className="w-5 h-5" />;
            default:
                return <FileText className="w-5 h-5" />;
        }
    };

    return (
        <div
            onClick={onSelect}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                isSelected
                    ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
        >
            <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-1 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                />

                {/* Icon and Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {getIcon()}
                        <h4 className="font-medium truncate text-gray-900 dark:text-gray-100">
                            {source.title}
                        </h4>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                        {source.type && (
                            <Badge variant="outline" className="text-xs">
                                {source.type}
                            </Badge>
                        )}
                        {source.status && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {source.status}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                    {onPreview && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPreview();
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="h-8 w-8 p-0 hover:text-red-600"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
