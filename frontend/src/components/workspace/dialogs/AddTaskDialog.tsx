"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Cpu, Briefcase } from "lucide-react";
import { SourceSelectionList } from "../SourceSelectionList";
import { BaseDialog } from "@/components/common";

interface Task {
    id: string;
    requirement_text: string;
    status: string;
    section_id: string;
}

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

interface AddTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // Data
    targetSection: Section | null;
    editingTask: Task | null;
    dialogInputValue: string;
    setDialogInputValue: (value: string) => void;
    // Source selection for AI generation
    sources: Source[];
    selectedSourceIds: string[];
    setSelectedSourceIds: (ids: string[]) => void;
    showSourceSelector: boolean;
    setShowSourceSelector: (show: boolean) => void;
    // Actions
    onAddTask: () => void;
    onUpdateTask: () => void;
    onGenerateTechnical: () => void;
    onGenerateManagement: () => void;
    onAddSource: () => void;
    // State
    generating: boolean;
}

export function AddTaskDialog({
    open,
    onOpenChange,
    targetSection,
    editingTask,
    dialogInputValue,
    setDialogInputValue,
    sources,
    selectedSourceIds,
    setSelectedSourceIds,
    showSourceSelector,
    setShowSourceSelector,
    onAddTask,
    onUpdateTask,
    onGenerateTechnical,
    onGenerateManagement,
    onAddSource,
    generating,
}: AddTaskDialogProps) {
    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title={editingTask ? '編輯任務 (Edit Task)' : '新增任務 (Add Requirement Task)'}
            maxWidth="lg"
            showFooter={true}
            footer={
                <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button
                        onClick={editingTask ? onUpdateTask : onAddTask}
                        className="bg-gray-900 dark:bg-gray-100 dark:text-gray-950 text-white hover:bg-black font-bold px-6"
                    >
                        {editingTask ? '確認更新' : '手動新增任務'}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                {targetSection && (
                    <div className="flex flex-col gap-2 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Section</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{targetSection.title}</span>
                        </div>
                        {editingTask && (
                            <div className="flex items-start gap-2">
                                <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider shrink-0">Editing</span>
                                <span className="font-medium text-gray-900 dark:text-gray-200 break-words line-clamp-2">
                                    {editingTask.requirement_text}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">任務內容 (Requirement Details)</Label>
                        {!editingTask && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 text-xs gap-1.5 transition-all ${showSourceSelector ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 hover:text-blue-600'}`}
                                onClick={() => setShowSourceSelector(!showSourceSelector)}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                {showSourceSelector ? "隱藏 AI 生成器" : "使用 AI 自動生成"}
                            </Button>
                        )}
                    </div>

                    <Input
                        value={dialogInputValue}
                        onChange={(e) => setDialogInputValue(e.target.value)}
                        placeholder={editingTask ? "修改任務需求..." : "描述任務需求... (或透過下方的 AI 生成)"}
                        className="h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-blue-500/20"
                        autoFocus
                    />

                    {showSourceSelector && !editingTask && (
                        <div className="pt-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">選擇生成參考來源</Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        onClick={() => setSelectedSourceIds(sources.map(s => s.id))}
                                    >
                                        全選
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs px-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={() => setSelectedSourceIds([])}
                                    >
                                        清空
                                    </Button>
                                </div>
                            </div>

                            <SourceSelectionList
                                sources={sources}
                                selectedSourceIds={selectedSourceIds}
                                onSelectionChange={setSelectedSourceIds}
                                onAddSource={onAddSource}
                            />

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-sm transition-all active:scale-[0.98]"
                                    disabled={selectedSourceIds.length === 0 || generating}
                                    onClick={onGenerateTechnical}
                                >
                                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                                    技術規約生成
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1 h-10 bg-orange-600 hover:bg-orange-700 text-white font-bold gap-2 shadow-sm transition-all active:scale-[0.98]"
                                    disabled={selectedSourceIds.length === 0 || generating}
                                    onClick={onGenerateManagement}
                                >
                                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
                                    管理規劃生成
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </BaseDialog>
    );
}
