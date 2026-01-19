"use client";

import { useState } from "react";
import { getErrorMessage } from '@/lib/errorUtils';
import { BaseDialog } from "@/components/common";
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
        <BaseDialog
            open={open}
            onOpenChange={onClose}
            title="上傳標書範本"
            description="// NO STRUCTURE DETECTED. UPLOAD DOCX TO AUTO-GENERATE CHAPTERS."
            maxWidth="lg"
            loading={isUploading}
            showFooter={true}
            footer={
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isUploading} className="rounded-none border-2 border-black font-black uppercase tracking-widest flex-1">
                        CANCEL
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className="rounded-none border-2 border-black bg-[#FA4028] hover:bg-black text-white font-black uppercase tracking-widest flex-1 shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ANALYZING...
                            </>
                        ) : (
                            "START_GENERATION"
                        )}
                    </Button>
                </div>
            }
        >
            <div className="grid gap-8">
                        <div className="grid w-full items-center gap-3">
                            <Label htmlFor="template-file" className="text-sm font-black uppercase tracking-widest text-[#FA4028]">選擇檔案 (.DOCX)</Label>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-mono font-bold rounded-none border-2 border-black hover:bg-gray-100 uppercase"
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
                                            CLICK TO SELECT FILE
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
                                <p className="text-[10px] font-mono font-black text-emerald-600 flex items-center mt-1 uppercase italic bg-emerald-50 p-1 border border-emerald-200">
                                    <FileText className="h-3 w-3 mr-1" />
                                    {file.name} ({(file.size / 1024).toFixed(0)} KB) // READY_FOR_UPLOAD
                                </p>
                            )}
                        </div>

                        <div className="grid gap-4 bg-gray-50 dark:bg-zinc-900 p-4 border-2 border-dashed border-black">
                            <Label className="text-sm font-black uppercase tracking-widest">生成模式 // MODE</Label>
                            <RadioGroup defaultValue="replace" onValueChange={(v) => setMode(v as any)} className="gap-4">
                                <div className="flex items-center space-x-3 cursor-pointer group">
                                    <RadioGroupItem value="replace" id="r1" className="rounded-none border-2 border-black data-[state=checked]:bg-[#FA4028] data-[state=checked]:text-white" />
                                    <Label htmlFor="r1" className="font-mono text-xs font-bold cursor-pointer group-hover:text-[#FA4028] uppercase">覆蓋現有章節 (REPLACE_ALL)</Label>
                                </div>
                                <div className="flex items-center space-x-3 cursor-pointer group">
                                    <RadioGroupItem value="append" id="r2" className="rounded-none border-2 border-black data-[state=checked]:bg-[#FA4028] data-[state=checked]:text-white" />
                                    <Label htmlFor="r2" className="font-mono text-xs font-bold cursor-pointer group-hover:text-[#FA4028] uppercase">加在現有章節後 (APPEND_ONLY)</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
            </BaseDialog>
    );
}
