"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export interface ConflictOption {
    label: string;
    description: string;
    showWarning?: boolean;
}

export interface ConflictConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string | React.ReactNode;
    appendOption: ConflictOption;
    replaceOption: ConflictOption;
    onCancel: () => void;
    onAppend: () => void;
    onReplace: () => void;
    cancelLabel?: string;
}

/**
 * 通用衝突確認對話框
 * 用於處理「保留並新增 (Append)」vs「全部取代 (Replace)」的常見情境
 */
export function ConflictConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    appendOption,
    replaceOption,
    onCancel,
    onAppend,
    onReplace,
    cancelLabel = "取消 (Cancel)",
}: ConflictConfirmationDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>
                            {typeof description === "string" ? description : description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <div className="space-y-3 py-4">
                    {/* Append Option */}
                    <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                        <div>
                            <p className="font-medium text-sm">{appendOption.label}</p>
                            <p className="text-xs text-gray-500">
                                {appendOption.description}
                            </p>
                        </div>
                    </div>
                    {/* Replace Option */}
                    <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                        <div>
                            <p className="font-medium text-sm flex items-center gap-1">
                                {replaceOption.label}
                                {replaceOption.showWarning && (
                                    <span className="text-red-600">⚠️</span>
                                )}
                            </p>
                            <p className="text-xs text-gray-500">
                                {replaceOption.description}
                            </p>
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex gap-2 sm:gap-2 flex-wrap justify-end">
                    <Button variant="outline" onClick={onCancel}>
                        {cancelLabel}
                    </Button>
                    <Button variant="outline" onClick={onAppend}>
                        {appendOption.label}
                    </Button>
                    <Button variant="destructive" onClick={onReplace}>
                        {replaceOption.label}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
