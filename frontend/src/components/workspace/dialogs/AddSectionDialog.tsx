"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingSection ? 'Edit Chapter' : 'Add New Chapter'}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Label>Chapter Title</Label>
                    <Input
                        value={dialogInputValue}
                        onChange={(e) => setDialogInputValue(e.target.value)}
                        placeholder="e.g., 1. 專案概述"
                        className="mt-2"
                        autoFocus
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={editingSection ? onUpdate : onAdd}>
                        {editingSection ? 'Save Changes' : 'Create Chapter'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
