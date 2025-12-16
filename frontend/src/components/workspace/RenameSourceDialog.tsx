"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

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
    const supabase = createClient();

    useEffect(() => {
        setTitle(initialTitle);
    }, [initialTitle, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sourceId || !title.trim()) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from("sources")
                .update({ title: title.trim() })
                .eq("id", sourceId);

            if (error) throw error;

            toast.success("重新命名成功");
            onSuccess(title.trim());
            onOpenChange(false);
        } catch (error: any) {
            console.error("Rename error:", error);
            toast.error("重新命名失敗", {
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>重新命名來源</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">來源名稱</Label>
                        <Input
                            id="name"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="輸入新的來源名稱"
                            disabled={isSubmitting}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            取消
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !title.trim()}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    儲存中
                                </>
                            ) : (
                                "儲存"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
