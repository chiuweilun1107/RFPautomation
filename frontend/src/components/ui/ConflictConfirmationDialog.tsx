"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/common";

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
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={typeof description === "string" ? description : undefined}
            showFooter={true}
            footer={
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={onCancel}>
                        {cancelLabel}
                    </Button>
                    <Button variant="outline" onClick={onAppend}>
                        {appendOption.label}
                    </Button>
                    <Button variant="destructive" onClick={onReplace}>
                        {replaceOption.label}
                    </Button>
                </div>
            }
        >
            {typeof description !== "string" && description && (
                <div className="mb-4">
                    {description}
                </div>
            )}
            <div className="space-y-3">
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
        </BaseDialog>
    );
}
