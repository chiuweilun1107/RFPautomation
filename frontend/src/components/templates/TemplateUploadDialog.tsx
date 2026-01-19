"use client";

import { useState } from "react";
import { getErrorMessage } from '@/lib/errorUtils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface TemplateUploadDialogProps {
    open: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess: () => void;
}

export function TemplateUploadDialog({
    open,
    onClose,
    projectId,
    onSuccess,
}: TemplateUploadDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [mode, setMode] = useState<"replace" | "append">("replace");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            // 1. Upload to Supabase Storage directly
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${projectId}_${Date.now()}_template.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('raw-files')
                .upload(filePath, file);

            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

            // 2. Call n8n Webhook with file path
            const response = await fetch("/webhook/process-proposal-template", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    projectId,
                    filePath,
                    fileName: file.name,
                    mode
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || "Failed to process template workflow");
            }

            const result = await response.json();
            toast.success(`成功從範本生成 ${result.count || 0} 個章節`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(getErrorMessage(error) || "上傳失敗");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>上傳標書範本</DialogTitle>
                    <DialogDescription>
                        系統未偵測到評分標準或必要章節。您可以上傳一份既有的標書 Word (.docx) 檔，系統將自動分析其目錄結構並為您建立章節。
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="template-file">選擇檔案 (.docx)</Label>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                                onClick={() => document.getElementById("template-file")?.click()}
                            >
                                {file ? (
                                    <>
                                        <FileText className="mr-2 h-4 w-4" />
                                        {file.name}
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        選擇檔案
                                    </>
                                )}
                            </Button>
                            <input
                                id="template-file"
                                type="file"
                                accept=".docx"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                        {file && (
                            <p className="text-xs text-green-600 flex items-center mt-1">
                                <FileText className="h-3 w-3 mr-1" />
                                {file.name} ({(file.size / 1024).toFixed(0)} KB)
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label>生成模式</Label>
                        <RadioGroup defaultValue="replace" onValueChange={(v) => setMode(v as any)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="replace" id="r1" />
                                <Label htmlFor="r1">覆蓋現有章節 (Replace)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="append" id="r2" />
                                <Label htmlFor="r2">加在現有章節後 (Append)</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isUploading}>
                        取消
                    </Button>
                    <Button onClick={handleUpload} disabled={!file || isUploading}>
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                分析中...
                            </>
                        ) : (
                            "開始生成"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
