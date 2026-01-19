"use client";

import { Source } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SourceDetailsProps {
    source: Source | null;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * 源文献详情面板 - 显示源的完整信息
 */
export function SourceDetails({
    source,
    isOpen,
    onClose,
}: SourceDetailsProps) {
    if (!isOpen || !source) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center">
            <div className="bg-white dark:bg-gray-950 rounded-lg w-full sm:w-96 max-h-96 overflow-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-950">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {source.title}
                    </h3>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    {/* Type */}
                    {source.type && (
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Type
                            </label>
                            <div className="mt-1">
                                <Badge>{source.type}</Badge>
                            </div>
                        </div>
                    )}

                    {/* Status */}
                    {source.status && (
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Status
                            </label>
                            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                {source.status}
                            </p>
                        </div>
                    )}

                    {/* URL */}
                    {source.origin_url && (
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                URL
                            </label>
                            <a
                                href={source.origin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block"
                            >
                                {source.origin_url}
                            </a>
                        </div>
                    )}

                    {/* Summary */}
                    {source.summary && (
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Summary
                            </label>
                            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-4">
                                {source.summary}
                            </p>
                        </div>
                    )}

                    {/* Created at */}
                    {source.created_at && (
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Added
                            </label>
                            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                {new Date(source.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
