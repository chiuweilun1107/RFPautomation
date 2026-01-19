"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface Section {
    id: string;
    title: string;
}

interface AddSubsectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetSection: Section | null;
    dialogInputValue: string;
    setDialogInputValue: (value: string) => void;
    onSwitchToAI: () => void;
    onAdd: () => void;
    onCancel: () => void;
}

export function AddSubsectionDialog({
    open,
    onOpenChange,
    targetSection,
    dialogInputValue,
    setDialogInputValue,
    onSwitchToAI,
    onAdd,
    onCancel,
}: AddSubsectionDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>新增次章節</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <Label>次章節標題</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-blue-600 hover:text-blue-700"
                                onClick={onSwitchToAI}
                            >
                                <Sparkles className="w-3 h-3 mr-1" />
                                使用 AI 生成
                            </Button>
                        </div>
                        <Input
                            value={dialogInputValue}
                            onChange={(e) => setDialogInputValue(e.target.value)}
                            placeholder="例如：1.1 專案背景"
                            autoFocus
                        />
                        {targetSection && (
                            <p className="text-xs text-gray-500 mt-2">
                                新增至：<span className="font-medium">{targetSection.title}</span>
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>取消</Button>
                    <Button onClick={onAdd}>新增子章節</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
