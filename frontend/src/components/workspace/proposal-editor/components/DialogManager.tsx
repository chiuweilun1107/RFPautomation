"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DialogType = "addSection" | "editSection" | "addTask" | "editTask" | null;

interface DialogManagerProps {
    open: boolean;
    type: DialogType;
    title?: string;
    defaultValue?: string;
    onClose: () => void;
    onConfirm: (value: string) => Promise<void>;
}

/**
 * 统一的 Dialog 管理器 - 处理所有编辑对话框
 */
export function DialogManager({
    open,
    type,
    title,
    defaultValue = "",
    onClose,
    onConfirm,
}: DialogManagerProps) {
    const [value, setValue] = useState(defaultValue);
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm(value);
            setValue("");
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const dialogTitles = {
        addSection: "Add New Chapter",
        editSection: "Edit Chapter",
        addTask: "Add New Task",
        editTask: "Edit Task",
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {type ? dialogTitles[type] : "Edit"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={type?.includes("Section") ? "Chapter title" : "Task requirement"}
                        autoFocus
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={loading || !value.trim()}>
                        {loading ? "Saving..." : "Confirm"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
