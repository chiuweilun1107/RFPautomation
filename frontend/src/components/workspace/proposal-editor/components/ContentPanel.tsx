"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ContentPanelProps {
    taskId: string;
    taskTitle: string;
    content?: string;
    isLoading?: boolean;
    onClose: () => void;
}

/**
 * 内容展示面板 - 显示任务生成的内容
 */
export function ContentPanel({
    taskId,
    taskTitle,
    content,
    isLoading = false,
    onClose,
}: ContentPanelProps) {
    const handleCopy = () => {
        if (content) {
            navigator.clipboard.writeText(content);
            toast.success("Content copied to clipboard");
        }
    };

    return (
        <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white dark:bg-gray-950 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">
                        {taskTitle}
                    </h3>
                </div>
                <div className="flex gap-1 ml-2">
                    {content && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCopy}
                            className="h-7 w-7 p-0"
                        >
                            <Copy className="w-4 h-4" />
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClose}
                        className="h-7 w-7 p-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin">⌛</div>
                    </div>
                ) : content ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No content yet
                    </p>
                )}
            </div>
        </div>
    );
}
