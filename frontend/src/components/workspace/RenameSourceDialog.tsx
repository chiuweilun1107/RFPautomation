"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { BaseDialog } from "@/components/common";

interface RenameSourceDialogProps {
    sourceId: string | null;
    initialTitle: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (newTitle: string) => void;
}

export function RenameSourceDialog({
    sourceId,
    initialTitle,
    open,
    onOpenChange,
    onSuccess,
}: RenameSourceDialogProps) {
    const [title, setTitle] = useState(initialTitle);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        setTitle(initialTitle);
        setError(null);
    }, [initialTitle, open]);

    const handleSubmit = async () => {
        if (!sourceId || !title.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const { error: dbError } = await supabase
                .from("sources")
                .update({ title: title.trim() })
                .eq("id", sourceId);

            if (dbError) throw dbError;

            toast.success("重新命名成功");
            onSuccess(title.trim());
            onOpenChange(false);
        } catch (err: any) {
            const errorMsg = err.message || "重新命名失敗";
            setError(errorMsg);
            toast.error("重新命名失敗", {
                description: errorMsg,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title="重新命名來源"
            confirmText="儲存"
            cancelText="取消"
            loading={isSubmitting}
            error={error}
            onConfirm={handleSubmit}
            disableConfirm={!title.trim() || isSubmitting}
            maxWidth="sm"
        >
            <div className="grid gap-2">
                <Label htmlFor="name">來源名稱</Label>
                <Input
                    id="name"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="輸入新的來源名稱"
                    disabled={isSubmitting}
                    autoFocus
                />
            </div>
        </BaseDialog>
    );
}
