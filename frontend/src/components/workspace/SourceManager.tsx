import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Plus, FileText, Globe, Loader2, Trash2, Check, Eye, Search,
    MoreVertical, Pencil, Sparkles, X, ChevronDown, ArrowRight,
    Brain, Zap, ExternalLink, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { SourceDetailSheet } from './SourceDetailSheet';
import { AddSourceDialog } from './AddSourceDialog';
import { RenameSourceDialog } from './RenameSourceDialog';

interface Source {
    id: string;
    title: string;
    type: 'pdf' | 'docx' | 'web' | 'markdown' | 'web_crawl';
    status: 'processing' | 'ready' | 'error';
    created_at: string;
    content?: string;
    summary?: string;
    topics?: string[];
    source_type?: string;
    origin_url?: string;
    isLinked?: boolean;
}

interface SourceManagerProps {
    projectId: string;
    onSelectSource?: (source: Source) => void;
}

type SearchState = 'idle' | 'searching' | 'results';

export function SourceManager({ projectId, onSelectSource }: SourceManagerProps) {
    const [sources, setSources] = useState<Source[]>([]);
    const [linkedSourceIds, setLinkedSourceIds] = useState<Set<string>>(new Set());

    // AI Search States
    const [searchState, setSearchState] = useState<SearchState>('idle');
    const [aiSearchQuery, setAiSearchQuery] = useState('');
    const [aiResults, setAiResults] = useState<any[]>([]);
    const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set());
    const [researchMode, setResearchMode] = useState<'fast' | 'deep'>('fast');
    const [aiSearchKeywords, setAiSearchKeywords] = useState<string[]>([]); // New state for keywords

    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("正在研究網站..."); // New state for loading text
    const [saving, setSaving] = useState(false);
    const [selectedSource, setSelectedSource] = useState<Source | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [sourceToRename, setSourceToRename] = useState<Source | null>(null);
    const [sourceToDelete, setSourceToDelete] = useState<Source | null>(null); // New state for delete confirmation
    const [filterQuery, setFilterQuery] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // AI Search Function
    const handleAISearch = async () => {
        if (!aiSearchQuery.trim()) return;

        setSearchState('searching');
        try {
            const response = await fetch('/api/sources/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: aiSearchQuery.trim(),
                    mode: researchMode,
                    source: 'web',
                    project_id: projectId
                })
            });

            if (!response.ok) throw new Error('Search failed');
            const data = await response.json();

            setAiResults(data.results || []);
            setAiSearchKeywords(data.searchQueries || []); // Store keywords
            // Default select all
            setSelectedResults(data.results ? new Set(data.results.map((_: any, i: number) => i)) : new Set());
            setSearchState('results');
        } catch (error) {
            console.error('AI search error:', error);
            toast.error('搜尋失敗');
            setSearchState('idle');
        } finally {
            // Reset loading text when done
            setLoadingText("正在研究網站...");
        }
    };

    const handleImportResults = async () => {
        setLoading(true);
        const resultsToImport = aiResults.filter((_, i) => selectedResults.has(i));

        try {
            for (const result of resultsToImport) {
                await fetch('/api/sources/from-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: result.url,
                        title: result.title,
                        project_id: projectId
                    })
                });
            }
            toast.success(`成功匯入 ${resultsToImport.length} 個來源`);
            setSearchState('idle');
            setAiSearchQuery('');
            fetchSources();
        } catch (error) {
            console.error('Import failed:', error);
            toast.error('匯入失敗');
        } finally {
            setLoading(false);
        }
    };

    const handleViewSource = (source: Source) => {
        if (onSelectSource) {
            onSelectSource(source);
        } else {
            setSelectedSource(source);
            setIsDetailOpen(true);
        }
    };

    const handleGenerateSummary = async (sourceId: string) => {
        try {
            const response = await fetch('/api/sources/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source_id: sourceId })
            });

            if (!response.ok) throw new Error('Failed to generate summary');
            const data = await response.json();

            setSources(prev => prev.map(s =>
                s.id === sourceId
                    ? { ...s, summary: data.summary, topics: data.topics }
                    : s
            ));

            if (selectedSource?.id === sourceId) {
                setSelectedSource(prev => prev ? { ...prev, summary: data.summary, topics: data.topics } : null);
            }
            toast.success('摘要已生成');
        } catch (error) {
            console.error('Generate summary failed:', error);
            toast.error('生成摘要失敗');
        }
    };

    const fetchSources = async () => {
        const { data: relevantSources } = await supabase
            .from('sources')
            .select('*')
            .or(`project_id.is.null,project_id.eq.${projectId}`)
            .order('created_at', { ascending: false });

        const { data: projectSources } = await supabase
            .from('project_sources')
            .select('source_id')
            .eq('project_id', projectId);

        if (relevantSources) {
            setSources(relevantSources as any[]);
        }

        if (projectSources) {
            const linkedIds = new Set(projectSources.map(ps => ps.source_id));
            setLinkedSourceIds(linkedIds);
        }
    };

    useEffect(() => {
        fetchSources();
        const channel = supabase
            .channel('sources_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sources' }, fetchSources)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'project_sources' }, fetchSources)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId]);

    // Cycling Loading Text Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (searchState === 'searching') {
            const messages = [
                "正在分析您的需求...",
                "正在生成最佳搜尋關鍵字...",
                "正在搜尋相關來源...",
                "正在整理搜尋結果..."
            ];
            let index = 0;
            interval = setInterval(() => {
                index = (index + 1) % messages.length;
                setLoadingText(messages[index]);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [searchState]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const filePath = `${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('raw-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

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

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to create source');
            }
            toast.success('文件上傳成功，正在處理中...');
            fetchSources();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. See console for details.');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm('確認要永久刪除此來源嗎？')) return;

        const { error } = await supabase.from('sources').delete().eq('id', id);
        if (error) {
            console.error('Delete failed:', error);
            toast.error('刪除失敗');
        } else {
            toast.success('來源已刪除');
            fetchSources();
        }
    };

    const handleRenameClick = (source: Source, e: React.MouseEvent) => {
        e.stopPropagation();
        setSourceToRename(source);
        setIsRenameDialogOpen(true);
    };

    const handleDeleteSource = (source: Source, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        setSourceToDelete(source);
    };

    const confirmDelete = async () => {
        if (!sourceToDelete) return;

        try {
            // Unlink first
            const { error: unlinkError } = await supabase
                .from('project_sources')
                .delete()
                .eq('project_id', projectId)
                .eq('source_id', sourceToDelete.id);

            if (unlinkError) throw unlinkError;

            // Then delete source
            const { error: deleteError } = await supabase
                .from('sources')
                .delete()
                .eq('id', sourceToDelete.id);

            if (deleteError) throw deleteError;

            fetchSources();
            toast.success('來源已刪除');
        } catch (error) {
            console.error('Error deleting source:', error);
            toast.error('刪除失敗');
        } finally {
            setSourceToDelete(null);
        }
    };

    const toggleSourceLink = async (sourceId: string) => {
        setSaving(true);
        const isCurrentlyLinked = linkedSourceIds.has(sourceId);

        try {
            if (isCurrentlyLinked) {
                const { error } = await supabase
                    .from('project_sources')
                    .delete()
                    .eq('project_id', projectId)
                    .eq('source_id', sourceId);
                if (error) throw error;
                setLinkedSourceIds(prev => {
                    const next = new Set(prev);
                    next.delete(sourceId);
                    return next;
                });
                toast.success('已從專案知識庫移除');
            } else {
                const { error } = await supabase
                    .from('project_sources')
                    .insert({ project_id: projectId, source_id: sourceId });
                if (error) throw error;
                setLinkedSourceIds(prev => new Set([...prev, sourceId]));
                toast.success('已加入專案知識庫');
            }
        } catch (error) {
            console.error('Toggle link failed:', error);
            toast.error('操作失敗');
        } finally {
            setSaving(false);
        }
    };

    const linkedCount = linkedSourceIds.size;
    const filteredSources = filterQuery.trim()
        ? sources.filter(s =>
            s.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
            s.content?.toLowerCase().includes(filterQuery.toLowerCase())
        )
        : sources;

    return (
        <TooltipProvider>
            <Card className="h-full border-none shadow-none flex flex-col bg-transparent">
                <CardHeader className="px-0 pt-0 pb-3 shrink-0 space-y-4">

                    {/* 1. Header Area */}
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">知識來源</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            已選擇 {linkedCount} 個來源用於此專案
                        </p>
                    </div>

                    {/* 2. AI Search / Status / Results Area */}

                    {/* STATE: Idle - Show Search Input */}
                    {searchState === 'idle' && (
                        <div className="space-y-3">
                            {/* Search Widget */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <Input
                                    placeholder="搜索來源.."
                                    value={aiSearchQuery}
                                    onChange={(e) => setAiSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                                    className="pl-9 pr-12 h-12 rounded-xl bg-muted/30 border-transparent hover:bg-muted/50 focus:bg-background transition-all"
                                />
                                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                {researchMode === 'fast' ?
                                                    <Zap className="h-4 w-4 text-yellow-500" /> :
                                                    <Brain className="h-4 w-4 text-purple-500" />
                                                }
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setResearchMode('fast')}>
                                                <Zap className="mr-2 h-4 w-4 text-yellow-500" /> Fast Research
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setResearchMode('deep')}>
                                                <Brain className="mr-2 h-4 w-4 text-purple-500" /> Deep Research
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        onClick={handleAISearch}
                                        disabled={!aiSearchQuery.trim()}
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Original Add/Filter Actions */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 justify-center border-dashed h-9"
                                    onClick={() => setIsAddDialogOpen(true)}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    新增來源
                                </Button>
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="搜尋來源..."
                                        value={filterQuery}
                                        onChange={(e) => setFilterQuery(e.target.value)}
                                        className="pl-8 h-9 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STATE: Searching - Show Banner */}
                    {searchState === 'searching' && (
                        <div className="bg-primary/5 rounded-xl p-4 flex items-center gap-3 animate-source-pulse">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                                <Sparkles className="relative w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-primary">{loadingText}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">正在分析: {aiSearchQuery}</p>
                            </div>
                        </div>
                    )}

                    {/* STATE: Results - Show Import Panel */}
                    {searchState === 'results' && (
                        <div className="bg-muted/30 rounded-xl p-4 border space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span className="font-medium">快速研究完畢！</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSearchState('idle')}>查看</Button>
                            </div>

                            {/* Show Used Keywords */}
                            {aiSearchKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-2 px-1">
                                    <span className="text-xs text-muted-foreground flex items-center">
                                        <Search className="w-3 h-3 mr-1" />
                                        已使用關鍵字:
                                    </span>
                                    {aiSearchKeywords.map((kw, i) => (
                                        <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="bg-background rounded-lg border divide-y max-h-[300px] overflow-y-auto">
                                {aiResults.map((result, idx) => (
                                    <div key={idx} className="p-3 flex gap-3 hover:bg-muted/50 transition-colors">
                                        <div className="mt-1">
                                            <Checkbox
                                                checked={selectedResults.has(idx)}
                                                onCheckedChange={(checked) => {
                                                    const next = new Set(selectedResults);
                                                    if (checked) next.add(idx);
                                                    else next.delete(idx);
                                                    setSelectedResults(next);
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <p className="text-sm font-medium leading-tight line-clamp-2">{result.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">{result.content || result.snippet || result.url}</p>
                                            <a href={result.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-blue-500 hover:underline">
                                                <ExternalLink className="w-3 h-3 mr-1" />
                                                開啟連結
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8"><ThumbsUp className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8"><ThumbsDown className="w-4 h-4" /></Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => {
                                            setSearchState('idle');
                                            setAiSearchQuery('');
                                        }}
                                    >
                                        刪除
                                    </Button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground">已選取 {selectedResults.size} 個來源</span>
                                    <Button size="sm" onClick={handleImportResults} disabled={loading || selectedResults.size === 0}>
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                        匯入
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                    />
                </CardHeader>

                {/* 3. Source List Area (Only show if not in results mode, or push down?) */}
                {/* NotebookLM shows list below results panel, so we keep it */}
                <CardContent className="px-0 space-y-2 flex-1 overflow-y-auto">
                    {filteredSources.length === 0 && sources.length === 0 && searchState === 'idle' && (
                        <div className="text-center text-muted-foreground py-8 text-sm">
                            尚無知識來源
                            <br />
                            <span className="text-xs">點擊「新增來源」上傳文件或使用上方 AI 搜尋</span>
                        </div>
                    )}
                    {filteredSources.length === 0 && sources.length > 0 && filterQuery && (
                        <div className="text-center text-muted-foreground py-8 text-sm">
                            找不到符合「{filterQuery}」的來源
                        </div>
                    )}
                    {filteredSources.map(source => {
                        const isLinked = linkedSourceIds.has(source.id);
                        return (
                            <div
                                key={source.id}
                                className={`group flex items-center gap-3 p-3 border rounded-lg transition-colors ${isLinked
                                    ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                                    : 'bg-muted/30 hover:bg-muted/50'
                                    }`}
                            >
                                <div
                                    className="cursor-pointer"
                                    onClick={() => toggleSourceLink(source.id)}
                                >
                                    <Checkbox
                                        checked={isLinked}
                                        disabled={saving || source.status !== 'ready'}
                                        className="pointer-events-none"
                                    />
                                </div>

                                <div
                                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                    onClick={() => handleViewSource(source)}
                                >
                                    <div className="p-2 bg-background rounded-md border shrink-0">
                                        {source.type === 'web' ? (
                                            <Globe className="w-4 h-4 text-blue-500" />
                                        ) : (
                                            <FileText className="w-4 h-4 text-orange-500" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <h4 className="text-sm font-medium truncate max-w-[180px]">
                                                    {source.title}
                                                </h4>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-black text-white border-0 text-base px-3 py-2 max-w-sm break-all">
                                                {source.title}
                                            </TooltipContent>
                                        </Tooltip>

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="capitalize">{source.type}</span>
                                            <span>•</span>
                                            <span>{new Date(source.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {source.status === 'processing' && (
                                        <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full mr-2">
                                            處理中
                                        </span>
                                    )}
                                    {source.status === 'error' && (
                                        <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full mr-2">
                                            錯誤
                                        </span>
                                    )}

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="w-8 h-8">
                                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => handleRenameClick(source, e)}>
                                                <Pencil className="w-4 h-4 mr-2" />
                                                重新命名來源
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => handleDeleteSource(source, e)}
                                                className="text-red-600 focus:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                移除來源
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>

                <SourceDetailSheet
                    source={selectedSource}
                    open={isDetailOpen}
                    onOpenChange={setIsDetailOpen}
                    onGenerateSummary={handleGenerateSummary}
                />

                <AddSourceDialog
                    open={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                    projectId={projectId}
                    onSourceAdded={fetchSources}
                />

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={!!sourceToDelete} onOpenChange={(open) => !open && setSourceToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>確認刪除來源？</AlertDialogTitle>
                            <AlertDialogDescription>
                                您確定要永久刪除「{sourceToDelete?.title}」嗎？此動作無法復原。
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
                            >
                                確認刪除
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {sourceToRename && (
                    <RenameSourceDialog
                        sourceId={sourceToRename.id}
                        initialTitle={sourceToRename.title}
                        open={isRenameDialogOpen}
                        onOpenChange={setIsRenameDialogOpen}
                        onSuccess={(newTitle) => {
                            setSources(prev => prev.map(s =>
                                s.id === sourceToRename.id ? { ...s, title: newTitle } : s
                            ));
                        }}
                    />
                )}
            </Card>
        </TooltipProvider>
    );
}
