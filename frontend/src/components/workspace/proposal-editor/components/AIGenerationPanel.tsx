"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, X, Loader2 } from "lucide-react";

interface AIGenerationPanelProps {
    generating: boolean;
    progress: { current: number; total: number } | null;
    selectedSourceIds: string[];
    onGenerate: () => void;
    onCancel: () => void;
    sourceCount?: number;
}

/**
 * AI 生成控制面板 - 管理 AI 生成进度和操作
 */
export function AIGenerationPanel({
    generating,
    progress,
    selectedSourceIds,
    onGenerate,
    onCancel,
    sourceCount = 0,
}: AIGenerationPanelProps) {
    const progressPercentage = progress
        ? (progress.current / progress.total) * 100
        : 0;

    return (
        <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg border border-blue-200 dark:border-blue-800">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                        AI Generation
                    </span>
                </div>
                {generating && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onCancel}
                        className="h-8"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                    </Button>
                )}
            </div>

            {/* Generation status */}
            {generating && progress ? (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Generating content...</span>
                        <span>
                            {progress.current}/{progress.total}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Source info */}
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedSourceIds.length > 0 ? (
                            <span>
                                Using {selectedSourceIds.length} source{selectedSourceIds.length !== 1 ? "s" : ""}
                            </span>
                        ) : (
                            <span className="text-amber-600 dark:text-amber-400">
                                No sources selected
                            </span>
                        )}
                    </div>

                    {/* Generate button */}
                    <Button
                        onClick={onGenerate}
                        disabled={selectedSourceIds.length === 0}
                        className="w-full"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Structure
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
