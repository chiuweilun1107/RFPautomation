"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { SourceSelectionList } from "../SourceSelectionList";
import { BaseDialog } from "@/components/common";

interface Task {
    id: string;
    requirement_text: string;
}

interface Section {
    id: string;
    title: string;
}

interface ContentGenerationTarget {
    task: Task;
    section: Section;
}

interface Source {
    id: string;
    title: string;
    source_type?: string;
    origin_url?: string;
}

interface ContentGenerationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // Data
    contentGenerationTarget: ContentGenerationTarget | null;
    // Source selection
    sources: Source[];
    contentGenerationSourceIds: string[];
    setContentGenerationSourceIds: (ids: string[]) => void;
    // Actions
    onGenerate: () => void;
    onAddSource: () => void;
}

export function ContentGenerationDialog({
    open,
    onOpenChange,
    contentGenerationTarget,
    sources,
    contentGenerationSourceIds,
    setContentGenerationSourceIds,
    onGenerate,
    onAddSource,
}: ContentGenerationDialogProps) {
    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title="生成內容計畫 (Content Generation Plan)"
            maxWidth="lg"
            showFooter={true}
            footer={
                <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button
                        onClick={onGenerate}
                        disabled={contentGenerationSourceIds.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] font-bold"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        生成內容
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                {contentGenerationTarget && (
                    <div className="flex flex-col gap-2 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">Section</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{contentGenerationTarget.section.title}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs shrink-0">Task</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200 break-words line-clamp-3">
                                {contentGenerationTarget.task.requirement_text}
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">選擇撰寫參考來源</Label>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => setContentGenerationSourceIds(sources.map(s => s.id))}
                        >
                            全選
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-gray-500 hover:text-red-500 hover:bg-red-50"
                            onClick={() => setContentGenerationSourceIds([])}
                        >
                            清空
                        </Button>
                    </div>
                </div>

                <SourceSelectionList
                    sources={sources}
                    selectedSourceIds={contentGenerationSourceIds}
                    onSelectionChange={setContentGenerationSourceIds}
                    onAddSource={onAddSource}
                />
            </div>
        </BaseDialog>
    );
}
