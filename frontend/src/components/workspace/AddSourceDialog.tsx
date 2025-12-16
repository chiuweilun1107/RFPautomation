"use client";

import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

    // AI 網路搜索
    const handleAISearch = async () => {
        if (!searchQuery.trim()) {
            toast.error('請輸入搜索內容');
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch('/api/sources/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: searchQuery.trim(),
                    mode: researchMode, // fast or deep
                    source: sourceMode, // web or drive
                    project_id: projectId
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Search failed');
            }

            const data = await response.json();
            setSearchResults(data.results || []);

            if (data.results?.length > 0) {
                toast.success(`找到 ${data.results.length} 個相關來源`);
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
            const response = await fetch('/api/sources/from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: result.url,
                    title: result.title,
                    project_id: projectId
                })
            });

            if (!response.ok) throw new Error('Failed to add source');

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
            const response = await fetch('/api/sources/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: file.name,
                    origin_url: filePath,
                    type: fileExt === 'pdf' ? 'pdf' : 'docx',
                    status: 'processing',
                    project_id: projectId,
                    source_type: 'upload'
                })
            });

            if (!response.ok) throw new Error('Failed to create source');

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
            const response = await fetch('/api/sources/from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: urlInput.trim(),
                    project_id: projectId
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to fetch URL');
            }

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
            const response = await fetch('/api/sources/from-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: textTitle.trim() || `文字筆記 ${new Date().toLocaleDateString()}`,
                    content: textInput.trim(),
                    project_id: projectId
                })
            });

            if (!response.ok) throw new Error('Failed to add text');

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

    return (
        <Dialog open={open} onOpenChange={(open) => {
            if (!open) resetToMain();
            onOpenChange(open);
        }}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="text-center">
                        <span className="text-lg">用文件</span>
                        <br />
                        <span className="text-primary text-sm font-medium">{getPanelTitle()}</span>
                    </DialogTitle>
                </DialogHeader>

                {/* AI 搜索區塊 - 始終顯示在頂部 */}
                <div className="border rounded-xl p-4 bg-muted/20 shrink-0">
                    {/* 搜索輸入框 */}
                    <div className="flex items-center gap-2 mb-3">
                        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                        <Input
                            placeholder="我要來源"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                            className="border-none bg-transparent focus-visible:ring-0 text-base"
                            disabled={isSearching}
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleAISearch}
                            disabled={isSearching || !searchQuery.trim()}
                            className="shrink-0"
                        >
                            {isSearching ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <ArrowRight className="w-5 h-5" />
                            )}
                        </Button>
                    </div>

                    {/* 來源模式 + 研究模式選擇 */}
                    <div className="flex items-center gap-2">
                        {/* 來源模式：網路 / 雲端硬碟 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1">
                                    {sourceMode === "web" ? (
                                        <><Globe className="w-4 h-4" /> 網路</>
                                    ) : (
                                        <><HardDrive className="w-4 h-4" /> 雲端硬碟</>
                                    )}
                                    <ChevronDown className="w-3 h-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => setSourceMode("web")}>
                                    <Globe className="w-4 h-4 mr-2" />
                                    網路
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    setSourceMode("drive");
                                    toast.info("Google 雲端硬碟功能即將推出");
                                }}>
                                    <HardDrive className="w-4 h-4 mr-2" />
                                    雲端硬碟
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 研究模式：Fast / Deep */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1">
                                    {researchMode === "fast" ? (
                                        <><Zap className="w-4 h-4 text-yellow-500" /> Fast Research</>
                                    ) : (
                                        <><Brain className="w-4 h-4 text-purple-500" /> Deep Research</>
                                    )}
                                    <ChevronDown className="w-3 h-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => setResearchMode("fast")}>
                                    <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                                    Fast Research
                                    <span className="ml-2 text-xs text-muted-foreground">快速搜索</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setResearchMode("deep")}>
                                    <Brain className="w-4 h-4 mr-2 text-purple-500" />
                                    Deep Research
                                    <span className="ml-2 text-xs text-muted-foreground">深度分析</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* 提示文字 */}
                    <p className="text-xs text-muted-foreground text-center mt-3">
                        正在探索其他來源時，會暫時停用搜尋功能。
                    </p>
                </div>

                {/* 搜索結果顯示 */}
                {searchResults.length > 0 && (
                    <div className="border rounded-lg p-3 max-h-[200px] overflow-y-auto">
                        <p className="text-sm font-medium mb-2">搜索結果</p>
                        <div className="space-y-2">
                            {searchResults.map((result, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer"
                                    onClick={() => handleAddSearchResult(result)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{result.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">{result.url}</p>
                                    </div>
                                    <Button size="sm" variant="ghost">
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 內容區域 - 根據 activePanel 切換 */}
                <div className="flex-1 overflow-y-auto">
                    {activePanel === "main" && (
                        <div className="space-y-4">
                            {/* 拖曳上傳區 */}
                            <div
                                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <p className="text-muted-foreground mb-4">
                                    或者將檔案拖曳到這裡
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
                            <div className="flex justify-center gap-3 flex-wrap">
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    上傳檔案
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setActivePanel("url")}
                                >
                                    <Link2 className="w-4 h-4 mr-2" />
                                    <Youtube className="w-4 h-4 mr-1 text-red-500" />
                                    網站
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => toast.info("Google 雲端硬碟功能即將推出")}
                                >
                                    <HardDrive className="w-4 h-4 mr-2" />
                                    雲端硬碟
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setActivePanel("text")}
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    複製的文字
                                </Button>
                            </div>

                            {isLoading && (
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    上傳中...
                                </div>
                            )}
                        </div>
                    )}

                    {/* 網站 URL 輸入面板 */}
                    {activePanel === "url" && (
                        <div className="space-y-4 p-4">
                            <Button variant="ghost" size="sm" onClick={resetToMain}>
                                ← 返回
                            </Button>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">網頁網址</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://example.com/article 或 YouTube 網址"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    <Button onClick={handleAddUrl} disabled={isLoading || !urlInput.trim()}>
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "添加"}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    支援一般網頁和 YouTube 影片網址
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 複製文字面板 */}
                    {activePanel === "text" && (
                        <div className="space-y-4 p-4">
                            <Button variant="ghost" size="sm" onClick={resetToMain}>
                                ← 返回
                            </Button>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">標題（選填）</label>
                                <Input
                                    placeholder="為這段文字命名..."
                                    value={textTitle}
                                    onChange={(e) => setTextTitle(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">內容</label>
                                <Textarea
                                    placeholder="貼上你想要作為來源的文字內容..."
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    disabled={isLoading}
                                    rows={6}
                                />
                            </div>
                            <Button
                                onClick={handleAddText}
                                disabled={isLoading || !textInput.trim()}
                                className="w-full"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                添加文字
                            </Button>
                        </div>
                    )}
                </div>

                {/* 底部來源計數 */}
                <div className="shrink-0 border-t pt-3 mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="w-24 h-1 bg-primary/30 rounded-full">
                            <div className="w-1/3 h-full bg-primary rounded-full" />
                        </div>
                        <span>37/300</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

