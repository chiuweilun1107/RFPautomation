"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
    Upload, FileText, Loader2, Link2,
    ArrowRight, HardDrive
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { sourcesApi } from "@/features/sources/api/sourcesApi";
import { useGoogleDrivePicker } from "@/hooks/useGoogleDrivePicker";

interface AddSourceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    onSourceAdded?: () => void;
}


type ActivePanel = "main" | "url" | "text";

export function AddSourceDialog({ open, onOpenChange, projectId, onSourceAdded }: AddSourceDialogProps) {


    // 其他狀態
    const [activePanel, setActivePanel] = useState<ActivePanel>("main");
    const [isLoading, setIsLoading] = useState(false);
    const [urlInput, setUrlInput] = useState("");
    const [textInput, setTextInput] = useState("");
    const [textTitle, setTextTitle] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // Google Drive integration
    const { isConnecting, isImporting, openPicker } = useGoogleDrivePicker({
        projectId: projectId,
        onSuccess: (source) => {
            toast.success(`Successfully imported ${source.title} from Google Drive`);
            onSourceAdded?.();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(error);
        }
    });





    // 上傳檔案
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            // 1. 上傳到 Storage
            const filePath = `${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('raw-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. 創建 Source 記錄
            const fileExt = file.name.split('.').pop();
            await sourcesApi.create({
                title: file.name,
                origin_url: filePath,
                type: fileExt === 'pdf' ? 'pdf' : 'docx',
                status: 'processing',
                project_id: projectId,
                source_type: 'upload',
            });

            toast.success('文件上傳成功，正在處理中...');
            onSourceAdded?.();
            onOpenChange(false);
        } catch (error: unknown) {
            console.error('Upload failed:', error);
            toast.error('上傳失敗');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // 添加網址
    const handleAddUrl = async () => {
        if (!urlInput.trim()) {
            toast.error('請輸入網址');
            return;
        }

        setIsLoading(true);
        try {
            await sourcesApi.fromUrl(urlInput.trim(), projectId);
            toast.success('網頁內容已添加');
            setUrlInput("");
            onSourceAdded?.();
            onOpenChange(false);
        } catch (error: unknown) {
            console.error('Add URL failed:', error);
            const message = error instanceof Error ? error.message : '添加網址失敗';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    // 添加複製的文字
    const handleAddText = async () => {
        if (!textInput.trim()) {
            toast.error('請輸入文字內容');
            return;
        }

        setIsLoading(true);
        try {
            await sourcesApi.fromText(
                textTitle.trim() || `文字筆記 ${new Date().toLocaleDateString()}`,
                textInput.trim(),
                projectId
            );
            toast.success('文字已添加');
            setTextInput("");
            setTextTitle("");
            onSourceAdded?.();
            onOpenChange(false);
        } catch (error: unknown) {
            console.error('Add text failed:', error);
            toast.error('添加文字失敗');
        } finally {
            setIsLoading(false);
        }
    };

    // 重置狀態
    const resetToMain = () => {
        setActivePanel("main");
        setUrlInput("");
        setTextInput("");
        setTextTitle("");
    };

    // 主面板標題
    const getPanelTitle = () => {
        switch (activePanel) {
            case "url": return "網站";
            case "text": return "複製的文字";
            default: return "自己的文件";
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) resetToMain();
        onOpenChange(newOpen);
    };

    return (
        <BaseDialog
            open={open}
            onOpenChange={handleOpenChange}
            title={
                <div className="text-center space-y-2">
                    <span className="text-xl font-bold uppercase tracking-widest block">Add Source</span>
                    <span className="text-xs font-normal uppercase tracking-wider text-gray-500 block">
                        {getPanelTitle() === "自己的文件" ? "Upload Files" :
                            getPanelTitle() === "網站" ? "Web Link" :
                                "Paste Text"}
                    </span>
                </div>
            }
            maxWidth="2xl"
            showFooter={false}
        >



            {/* 內容區域 - 2欄佈局 */}
            <div className="p-6">
                {activePanel === "main" && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-stretch h-[320px]">
                        {/* Left Column: Stylized Upload Zone */}
                        <div className="md:col-span-3 h-full">
                            <div
                                className="h-full border-2 border-dashed border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white hover:bg-muted transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center relative rounded-none"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <div className="p-4 rounded-none text-muted-foreground group-hover:text-foreground transition-colors">
                                        <Upload className="w-10 h-10" />
                                    </div>

                                    <div className="text-center space-y-1">
                                        <p className="text-sm text-foreground">
                                            <span className="font-bold">CLICK_TO_UPLOAD</span> or drag file
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wide">
                                            SUPPORTED: PDF, DOCX (MAX 50MB)
                                        </p>
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.docx"
                                        onChange={handleFileUpload}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Inverted Action Buttons */}
                        {/* Right Column: Inverted Action Buttons */}
                        <div className="md:col-span-2 flex flex-col justify-between h-full gap-4">
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className="flex-1 justify-between px-6 rounded-none border-2 border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white hover:bg-transparent uppercase text-xs font-bold tracking-widest transition-all group"
                            >
                                <span className="text-foreground group-hover:text-foreground">UPLOAD FILE</span>
                                <Upload className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setActivePanel("url")}
                                className="flex-1 justify-between px-6 rounded-none border-2 border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white hover:bg-transparent uppercase text-xs font-bold tracking-widest transition-all group"
                            >
                                <span className="text-foreground group-hover:text-foreground">WEB URL</span>
                                <Link2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    handleOpenChange(false);
                                    openPicker();
                                }}
                                disabled={isLoading || isConnecting || isImporting}
                                className="flex-1 justify-between px-6 rounded-none border-2 border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white hover:bg-transparent uppercase text-xs font-bold tracking-widest transition-all group"
                            >
                                <span className="text-foreground group-hover:text-foreground">
                                    {isConnecting ? 'CONNECTING...' : isImporting ? 'IMPORTING...' : 'GOOGLE DRIVE'}
                                </span>
                                {(isConnecting || isImporting) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <HardDrive className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setActivePanel("text")}
                                className="flex-1 justify-between px-6 rounded-none border-2 border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white hover:bg-transparent uppercase text-xs font-bold tracking-widest transition-all group"
                            >
                                <span className="text-foreground group-hover:text-foreground">PASTE TEXT</span>
                                <FileText className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                            </Button>

                            {isLoading && (
                                <div className="absolute bottom-0 right-0 left-0 bg-white/80 dark:bg-black/80 flex items-center justify-center gap-2 text-xs uppercase tracking-wider h-full z-10 backdrop-blur-sm font-bold">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    PROCESSING...
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 網站 URL 輸入面板 - 保持原樣但調整樣式 */}
                {
                    activePanel === "url" && (
                        <div className="space-y-6">
                            <Button variant="ghost" size="sm" onClick={resetToMain} className="rounded-none -ml-2 text-xs uppercase hover:bg-transparent hover:text-gray-500 pl-0">
                                ← Back
                            </Button>
                            <div className="space-y-4">
                                <label className="text-xs font-bold uppercase tracking-wider block">URL Address</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://..."
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        disabled={isLoading}
                                        className="rounded-none border-2 border-black dark:border-white font-mono text-sm h-10 focus-visible:ring-0"
                                    />
                                    <Button onClick={handleAddUrl} disabled={isLoading || !urlInput.trim()} className="rounded-none bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black h-10 w-20 uppercase font-bold text-xs">
                                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "ADD"}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                                    Supports Web Articles and YouTube Links
                                </p>
                            </div>
                        </div>
                    )
                }

                {/* 複製文字面板 - 保持原樣但調整樣式 */}
                {
                    activePanel === "text" && (
                        <div className="space-y-6 h-full flex flex-col">
                            <Button variant="ghost" size="sm" onClick={resetToMain} className="rounded-none -ml-2 text-xs uppercase hover:bg-transparent hover:text-gray-500 pl-0 w-fit shrink-0">
                                ← Back
                            </Button>
                            <div className="space-y-4 flex-1 flex flex-col">
                                <div className="space-y-2 shrink-0">
                                    <label className="text-xs font-bold uppercase tracking-wider block">Title (Optional)</label>
                                    <Input
                                        placeholder="UNTITLED NOTE..."
                                        value={textTitle}
                                        onChange={(e) => setTextTitle(e.target.value)}
                                        disabled={isLoading}
                                        className="rounded-none border-2 border-black dark:border-white font-mono text-sm h-10 focus-visible:ring-0 uppercase placeholder:normal-case"
                                    />
                                </div>
                                <div className="space-y-2 flex-1 flex flex-col">
                                    <label className="text-xs font-bold uppercase tracking-wider block">Content</label>
                                    <Textarea
                                        placeholder="Type or paste content here..."
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        disabled={isLoading}
                                        className="rounded-none border-2 border-black dark:border-white font-mono text-sm p-4 focus-visible:ring-0 flex-1 min-h-[200px] resize-none"
                                    />
                                </div>
                                <Button
                                    onClick={handleAddText}
                                    disabled={isLoading || !textInput.trim()}
                                    className="w-full rounded-none bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black h-12 uppercase font-bold text-xs tracking-widest shrink-0"
                                >
                                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                    SAVE TEXT NOTE
                                </Button>
                            </div>
                        </div>
                    )
                }
            </div >
            {/* Removed Capacity Usage Footer */}
        </BaseDialog >
    );
}

