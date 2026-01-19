"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BaseDialog } from "@/components/common";

interface Section {
    id: string;
    title: string;
}

interface AddSectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingSection: Section | null;
    dialogInputValue: string;
    setDialogInputValue: (value: string) => void;
    onAdd: () => void;
    onUpdate: () => void;
    onCancel: () => void;
}

export function AddSectionDialog({
    open,
    onOpenChange,
    editingSection,
    dialogInputValue,
    setDialogInputValue,
    onAdd,
    onUpdate,
    onCancel,
}: AddSectionDialogProps) {
    const isEditing = !!editingSection;
    const handleConfirm = () => {
        if (isEditing) {
            onUpdate();
        } else {
            onAdd();
        }
    };

    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? 'Edit Chapter' : 'Add New Chapter'}
            confirmText={isEditing ? 'Save Changes' : 'Create Chapter'}
            cancelText="Cancel"
            onConfirm={handleConfirm}
            onCancel={onCancel}
            disableConfirm={!dialogInputValue.trim()}
        >
            <div className="grid gap-2">
                <Label>Chapter Title</Label>
                <Input
                    value={dialogInputValue}
                    onChange={(e) => setDialogInputValue(e.target.value)}
                    placeholder="e.g., 1. 專案概述"
                    autoFocus
                />
            </div>
        </BaseDialog>
    );
}
