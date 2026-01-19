"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Upload, Globe, FileText, Loader2, Search, Link2,
    ChevronDown, ArrowRight, Sparkles, HardDrive, Youtube,
    Zap, Brain
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

type SourceMode = "web" | "drive";
type ResearchMode = "fast" | "deep";
type ActivePanel = "main" | "url" | "text";

export function AddSourceDialog({ open, onOpenChange, projectId, onSourceAdded }: AddSourceDialogProps) {
    // AI 搜索相關
    const [searchQuery, setSearchQuery] = useState("");
    const [sourceMode, setSourceMode] = useState<SourceMode>("web");
    const [researchMode, setResearchMode] = useState<ResearchMode>("fast");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

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

    // AI 網路搜索
    const handleAISearch = async () => {
        if (!searchQuery.trim()) {
            toast.error('請輸入搜索內容');
            return;
        }

        setIsSearching(true);
        try {
            const result = await sourcesApi.aiSearch(searchQuery.trim(), projectId);
            setSearchResults((result as any).results || result.sources || []);

            const resultCount = (result as any).results?.length || result.sources?.length || 0;
            if (resultCount > 0) {
                toast.success(`找到 ${resultCount} 個相關來源`);
            } else {
                toast.info('沒有找到相關來源');
            }
        } catch (error: any) {
            console.error('AI search failed:', error);
            toast.error(error.message || 'AI 搜索失敗');
        } finally {
            setIsSearching(false);
        }
    };

    // 添加搜索結果到來源
    const handleAddSearchResult = async (result: any) => {
        setIsLoading(true);
        try {
            await sourcesApi.fromUrl(result.url, projectId);
            toast.success('來源已添加');
            onSourceAdded?.();
        } catch (error) {
            console.error('Add search result failed:', error);
            toast.error('添加失敗');
        } finally {
            setIsLoading(false);
        }
    };

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
        } catch (error) {
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
        } catch (error: any) {
            console.error('Add URL failed:', error);
            toast.error(error.message || '添加網址失敗');
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
        } catch (error) {
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
            maxWidth="lg"
            showFooter={false}
        >

                {/* AI 搜索區塊 - 始終顯示在頂部 */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-black dark:border-white shrink-0">
                    {/* 搜索輸入框 */}
                    <div className="flex items-center gap-2 mb-3 border border-black dark:border-white bg-white dark:bg-black p-1">
                        <Search className="w-4 h-4 ml-2 shrink-0" />
                        <Input
                            placeholder="SEARCH FOR SOURCES..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                            className="border-none bg-transparent focus-visible:ring-0 text-sm h-8 rounded-none uppercase placeholder:text-gray-400"
                            disabled={isSearching}
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleAISearch}
                            disabled={isSearching || !searchQuery.trim()}
                            className="shrink-0 h-8 w-8 rounded-none hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                        >
                            {isSearching ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ArrowRight className="w-4 h-4" />
                            )}
                        </Button>
                    </div>

                    {/* 來源模式 + 研究模式選擇 */}
                    <div className="flex items-center gap-2">
                        {/* 來源模式：網路 / 雲端硬碟 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 rounded-none border-black dark:border-white h-7 text-xs uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                                    {sourceMode === "web" ? (
                                        <><Globe className="w-3 h-3" /> Web</>
                                    ) : (
                                        <><HardDrive className="w-3 h-3" /> Drive</>
                                    )}
                                    <ChevronDown className="w-3 h-3 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="rounded-none border border-black dark:border-white p-0">
                                <DropdownMenuItem onClick={() => setSourceMode("web")} className="rounded-none font-mono text-xs uppercase focus:bg-black focus:text-white">
                                    <Globe className="w-3 h-3 mr-2" />
                                    Web
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    setSourceMode("drive");
                                    toast.info("Coming Soon");
                                }} className="rounded-none font-mono text-xs uppercase focus:bg-black focus:text-white">
                                    <HardDrive className="w-3 h-3 mr-2" />
                                    Drive
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 研究模式：Fast / Deep */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 rounded-none border-black dark:border-white h-7 text-xs uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                                    {researchMode === "fast" ? (
                                        <><Zap className="w-3 h-3" /> Fast</>
                                    ) : (
                                        <><Brain className="w-3 h-3" /> Deep</>
                                    )}
                                    <ChevronDown className="w-3 h-3 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="rounded-none border border-black dark:border-white p-0 w-[200px]">
                                <DropdownMenuItem onClick={() => setResearchMode("fast")} className="rounded-none font-mono text-xs uppercase focus:bg-black focus:text-white flex flex-col items-start gap-1 p-2">
                                    <span className="flex items-center font-bold"><Zap className="w-3 h-3 mr-2" /> Fast Research</span>
                                    <span className="text-[10px] opacity-70">Quick scan</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setResearchMode("deep")} className="rounded-none font-mono text-xs uppercase focus:bg-black focus:text-white flex flex-col items-start gap-1 p-2">
                                    <span className="flex items-center font-bold"><Brain className="w-3 h-3 mr-2" /> Deep Research</span>
                                    <span className="text-[10px] opacity-70">In-depth analysis</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* 提示文字 */}
                    <p className="text-[10px] text-gray-400 text-center mt-3 uppercase tracking-wider">
                        Search disabled while browsing locally
                    </p>
                </div>

                {/* 搜索結果顯示 */}
                {searchResults.length > 0 && (
                    <div className="border-b border-black dark:border-white p-0 max-h-[200px] overflow-y-auto">
                        <div className="p-2 bg-black text-white text-xs font-bold uppercase tracking-wider sticky top-0">
                            Search Results
                        </div>
                        <div className="divide-y divide-black/10 dark:divide-white/10">
                            {searchResults.map((result, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer group transition-colors"
                                    onClick={() => handleAddSearchResult(result)}
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <p className="text-xs font-bold truncate uppercase">{result.title}</p>
                                        <p className="text-[10px] text-gray-500 truncate font-sans">{result.url}</p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 rounded-none p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black hover:text-white">
                                        <ArrowRight className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 內容區域 - 根據 activePanel 切換 */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activePanel === "main" && (
                        <div className="space-y-6">
                            {/* 拖曳上傳區 */}
                            <div
                                className="border border-dashed border-gray-400 dark:border-gray-600 p-12 text-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-8 h-8 mx-auto mb-4 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">
                                    Drag & Drop Files Here
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.docx"
                                    onChange={handleFileUpload}
                                    disabled={isLoading}
                                />
                            </div>

                            {/* 底部按鈕組 */}
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                    className="rounded-none border-black dark:border-white h-10 uppercase text-xs font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                                >
                                    <Upload className="w-3 h-3 mr-2" />
                                    Upload File
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setActivePanel("url")}
                                    className="rounded-none border-black dark:border-white h-10 uppercase text-xs font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                                >
                                    <Link2 className="w-3 h-3 mr-2" />
                                    Web URL
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => openPicker()}
                                    disabled={isLoading || isConnecting || isImporting}
                                    className="rounded-none border-black dark:border-white h-10 uppercase text-xs font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                                >
                                    <HardDrive className="w-3 h-3 mr-2" />
                                    {isConnecting ? 'Connecting...' : isImporting ? 'Importing...' : 'Google Drive'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setActivePanel("text")}
                                    className="rounded-none border-black dark:border-white h-10 uppercase text-xs font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                                >
                                    <FileText className="w-3 h-3 mr-2" />
                                    Paste Text
                                </Button>
                            </div>

                            {isLoading && (
                                <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider animate-pulse">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Uploading...
                                </div>
                            )}
                        </div>
                    )}

                    {/* 網站 URL 輸入面板 */}
                    {activePanel === "url" && (
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
                                        className="rounded-none border-black dark:border-white font-mono text-sm h-10 focus-visible:ring-0"
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
                    )}

                    {/* 複製文字面板 */}
                    {activePanel === "text" && (
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
                                        className="rounded-none border-black dark:border-white font-mono text-sm h-10 focus-visible:ring-0 uppercase placeholder:normal-case"
                                    />
                                </div>
                                <div className="space-y-2 flex-1 flex flex-col">
                                    <label className="text-xs font-bold uppercase tracking-wider block">Content</label>
                                    <Textarea
                                        placeholder="Type or paste content here..."
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        disabled={isLoading}
                                        className="rounded-none border-black dark:border-white font-mono text-sm p-4 focus-visible:ring-0 flex-1 min-h-[200px] resize-none"
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
                    )}
                </div>

                {/* 底部來源計數 */}
                <div className="shrink-0 border-t border-black dark:border-white p-3 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700">
                                <div className="w-1/3 h-full bg-black dark:bg-white" />
                            </div>
                            <span>Capacity Usage</span>
                        </div>
                        <span>37 / 300 Sources</span>
                    </div>
                </div>
        </BaseDialog>
    );
}

