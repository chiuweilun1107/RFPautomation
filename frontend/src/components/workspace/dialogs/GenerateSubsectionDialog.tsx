"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { SourceSelectionList } from "../SourceSelectionList";

interface Section {
    id: string;
    title: string;
}

interface Source {
    id: string;
    title: string;
    source_type?: string;
    origin_url?: string;
}

interface GenerateSubsectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetSection: Section | null;
    sources: Source[];
    selectedSourceIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onAddSource: () => void;
    onGenerate: () => void;
    isGenerating: boolean;
}

export function GenerateSubsectionDialog({
    open,
    onOpenChange,
    targetSection,
    sources,
    selectedSourceIds,
    onSelectionChange,
    onAddSource,
    onGenerate,
    isGenerating,
}: GenerateSubsectionDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[80vh] !flex !flex-col p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle className="text-xl">生成子章節計畫</DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-2 pb-6 custom-scrollbar">
                    <div className="space-y-4">
                        {targetSection && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">Target</span>
                                <span className="font-medium text-gray-900 dark:text-gray-200">{targetSection.title}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-base font-semibold">選擇撰寫參考來源</Label>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => onSelectionChange(sources.map(s => s.id))}
                                >
                                    全選
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs px-2 text-gray-500 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => onSelectionChange([])}
                                >
                                    清空
                                </Button>
                            </div>
                        </div>

                        <SourceSelectionList
                            sources={sources}
                            selectedSourceIds={selectedSourceIds}
                            onSelectionChange={onSelectionChange}
                            onAddSource={onAddSource}
                        />
                    </div>
                </div>
                <DialogFooter className="p-4 border-t bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isGenerating}>取消</Button>
                    <Button
                        onClick={onGenerate}
                        disabled={selectedSourceIds.length === 0 || isGenerating}
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {isGenerating ? '生成中...' : '生成子章節計畫'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
