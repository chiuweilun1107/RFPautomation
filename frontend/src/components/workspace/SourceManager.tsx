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
    Brain, Zap, ExternalLink, ThumbsUp, ThumbsDown, RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { SourceDetailSheet } from './SourceDetailSheet';
import { AddSourceDialog } from './AddSourceDialog';
import { RenameSourceDialog } from './RenameSourceDialog';
import { sourcesApi } from '@/features/sources/api/sourcesApi';
import { n8nApi } from '@/features/n8n/api/n8nApi';
import { createPortal } from "react-dom";
import { SourceDetailPanel } from "./SourceDetailPanel";

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
    pages?: Array<{ page: number; content: string; tokens?: number }>;
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
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({}); // Fixed: Moved state up
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // State for Draggable Dialog
    const [position, setPosition] = useState({ x: 40, y: 150 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const toggleSection = (key: string) => {
        setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // AI Search Function
    const handleAISearch = async () => {
        if (!aiSearchQuery.trim()) return;

        setSearchState('searching');
        try {
            const result = await sourcesApi.aiSearch(aiSearchQuery.trim(), projectId);
            const data = result as any; // API response might have different structure

            setAiResults(data.results || data.sources || []);
            setAiSearchKeywords(data.searchQueries || []); // Store keywords
            // Default select all
            const results = data.results || data.sources || [];
            setSelectedResults(results ? new Set(results.map((_: any, i: number) => i)) : new Set());
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
                await sourcesApi.fromUrl(result.url, projectId);
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
            // setIsDetailOpen(true); // Disable Sheet
        }
    };

    const handleGenerateSummary = async (sourceId: string) => {
        try {
            const data = await sourcesApi.summarize(sourceId);

            setSources(prev => prev.map(s =>
                s.id === sourceId
                    ? { ...s, summary: data.summary, topics: (data as any).topics }
                    : s
            ));

            if (selectedSource?.id === sourceId) {
                setSelectedSource(prev => prev ? { ...prev, summary: data.summary, topics: (data as any).topics } : null);
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
            .select('*, pages')
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

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const dialogWidth = 580;
            const handleHeight = 24;

            let newX = e.clientX - dragOffset.x;
            let newY = e.clientY - dragOffset.y;

            // Clamp positions
            newX = Math.max(0, Math.min(newX, window.innerWidth - dialogWidth));
            newY = Math.max(0, Math.min(newY, window.innerHeight - handleHeight));

            setPosition({
                x: newX,
                y: newY
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

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
            await sourcesApi.create({
                title: file.name,
                origin_url: filePath,
                type: fileExt === 'pdf' ? 'pdf' : 'docx',
                status: 'processing',
                project_id: projectId,
                source_type: 'upload',
            });

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

    const handleRefreshSource = async (source: Source, e: React.MouseEvent) => {
        e.stopPropagation();
        if (loading) return;

        toast.info("Triggering refresh...");
        try {
            await n8nApi.ingest(source.id, projectId);
            toast.success("Refresh triggered successfully");
        } catch (error) {
            console.error("Refresh error:", error);
            toast.error("Failed to refresh source");
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

    // Group Sources Logic
    const sourceSections = {
        tender: { label: 'TENDER DOCUMENTS', items: [] as Source[] },
        internal: { label: 'INTERNAL KNOWLEDGE', items: [] as Source[] },
        external: { label: 'EXTERNAL SOURCES', items: [] as Source[] },
    };

    filteredSources.forEach(s => {
        const type = s.type?.toLowerCase();
        const sourceType = s.source_type?.toLowerCase();

        if (type === 'web' || type === 'web_crawl' || sourceType === 'web' || sourceType === 'url') {
            sourceSections.external.items.push(s);
        } else if (sourceType === 'rfp' || sourceType === 'tender') {
            sourceSections.tender.items.push(s);
        } else {
            sourceSections.internal.items.push(s);
        }
    });

    return (
        <TooltipProvider>
            <Card className="h-full border-none shadow-none flex flex-col bg-transparent">
                <CardHeader className="px-0 pt-0 pb-3 shrink-0 space-y-4">
                    {/* 1. Header Removed to fix duplication */}

                    {/* 2. AI Search / Status / Results Area */}

                    {/* STATE: Idle - Show Search Input */}
                    {searchState === 'idle' && (
                        <div className="space-y-3">
                            {/* Search Widget */}
                            <div className="relative group font-mono text-sm">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-black dark:text-white" />
                                </div>
                                <Input
                                    placeholder="SEARCH SOURCES..."
                                    value={aiSearchQuery}
                                    onChange={(e) => setAiSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                                    className="pl-9 pr-12 h-10 rounded-none border border-black dark:border-white focus:bg-transparent placeholder:text-gray-400 uppercase tracking-wider"
                                />
                                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                                                {researchMode === 'fast' ?
                                                    <Zap className="h-3 w-3" /> :
                                                    <Brain className="h-3 w-3" />
                                                }
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-none border border-black dark:border-white font-mono uppercase tracking-wider">
                                            <DropdownMenuItem onClick={() => setResearchMode('fast')} className="rounded-none focus:bg-black focus:text-white dark:focus:bg-white dark:focus:text-black">
                                                <Zap className="mr-2 h-4 w-4" /> Fast Research
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setResearchMode('deep')} className="rounded-none focus:bg-black focus:text-white dark:focus:bg-white dark:focus:text-black">
                                                <Brain className="mr-2 h-4 w-4" /> Deep Research
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-none hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                                        onClick={handleAISearch}
                                        disabled={!aiSearchQuery.trim()}
                                    >
                                        <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            {/* Original Add/Filter Actions */}
                            <div className="flex items-center gap-2 font-mono text-xs">
                                <Button
                                    variant="outline"
                                    className="flex-1 justify-center border-black dark:border-white h-8 rounded-none hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black uppercase tracking-wider"
                                    onClick={() => setIsAddDialogOpen(true)}
                                >
                                    <Plus className="w-3 h-3 mr-2" />
                                    Add Source
                                </Button>
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                                    <Input
                                        placeholder="FILTER..."
                                        value={filterQuery}
                                        onChange={(e) => setFilterQuery(e.target.value)}
                                        className="pl-8 h-8 rounded-none border-black dark:border-white uppercase tracking-wider text-[10px]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STATE: Searching - Show Banner */}
                    {searchState === 'searching' && (
                        <div className="border border-black dark:border-white p-4 flex items-center gap-3 font-mono bg-white dark:bg-black animate-pulse">
                            <div className="relative">
                                <Sparkles className="relative w-4 h-4 text-black dark:text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-xs uppercase tracking-wider text-black dark:text-white">{loadingText}</p>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase truncate max-w-[200px]">{aiSearchQuery}</p>
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
                <CardContent className="px-0 space-y-6 flex-1 overflow-y-auto">
                    {filteredSources.length === 0 && sources.length === 0 && searchState === 'idle' && (
                        <div className="text-center py-16 border-2 border-dashed border-black/10 dark:border-white/10 rounded-none bg-black/5 dark:bg-white/5 m-1">
                            <Globe className="h-14 w-14 mx-auto text-black/20 dark:text-white/20 mb-5" strokeWidth={1.5} />
                            <h3 className="font-black uppercase tracking-tight text-foreground mb-2 text-base">
                                NO SOURCES FOUND
                            </h3>
                            <p className="text-[10px] text-muted-foreground max-w-xs mx-auto leading-relaxed uppercase tracking-wider font-bold">
                                Upload files or use AI Search above to build your knowledge base.
                            </p>
                        </div>
                    )}
                    {filteredSources.length === 0 && sources.length > 0 && filterQuery && (
                        <div className="text-center py-12">
                            <Search className="h-12 w-12 mx-auto text-black/30 dark:text-white/30 mb-4" strokeWidth={1.5} />
                            <h3 className="font-black uppercase tracking-tight text-foreground mb-2 text-sm">
                                NO MATCHES FOR &quot;{filterQuery}&quot;
                            </h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                                Try adjusting your search query
                            </p>
                        </div>
                    )}

                    {(Object.entries(sourceSections) as [keyof typeof sourceSections, typeof sourceSections.tender][]).map(([key, section]) => {
                        if (section.items.length === 0) return null;
                        const isCollapsed = collapsedSections[key];

                        return (
                            <div key={key} className="space-y-1">
                                <div
                                    className="px-3 py-2 bg-black/5 dark:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-black/80 dark:text-white/80 flex items-center justify-between cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors group select-none"
                                    onClick={() => toggleSection(key)}
                                >
                                    <span>{section.label}</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                                </div>

                                {!isCollapsed && (
                                    <div className="border-t border-black/10 dark:border-white/10">
                                        {section.items.map(source => {
                                            const isLinked = linkedSourceIds.has(source.id);
                                            return (
                                                <div
                                                    key={source.id}
                                                    className={`group flex items-center gap-3 p-3 border-b border-black/10 dark:border-white/10 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors font-mono ${isLinked
                                                        ? 'bg-black/5 dark:bg-white/5'
                                                        : 'bg-transparent'
                                                        }`}
                                                >
                                                    <div
                                                        className="cursor-pointer"
                                                        onClick={() => toggleSourceLink(source.id)}
                                                    >
                                                        <Checkbox
                                                            checked={isLinked}
                                                            disabled={saving || source.status !== 'ready'}
                                                            className="pointer-events-none rounded-none border-black dark:border-white data-[state=checked]:bg-black data-[state=checked]:text-white dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black"
                                                        />
                                                    </div>

                                                    <div
                                                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                                        onClick={() => handleViewSource(source)}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <h4 className="text-xs font-bold uppercase tracking-wider truncate max-w-[180px]">
                                                                        {source.title}
                                                                    </h4>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="bg-black text-white border-0 text-xs px-2 py-1 max-w-sm break-all rounded-none font-mono">
                                                                    {source.title}
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 group-hover:text-gray-300 dark:group-hover:text-gray-600 uppercase">
                                                                <span>{source.type}</span>
                                                                <span>•</span>
                                                                {source.created_at && <span>{new Date(source.created_at).toLocaleDateString()}</span>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 flex items-center gap-1 transition-opacity">
                                                        {source.status === 'processing' && (
                                                            <span className="text-[10px] uppercase font-bold text-yellow-600 border border-yellow-600 px-1 mr-2 group-hover:text-yellow-300 group-hover:border-yellow-300">
                                                                Processing
                                                            </span>
                                                        )}
                                                        {source.status === 'error' && (
                                                            <span className="text-[10px] uppercase font-bold text-red-600 border border-red-600 px-1 mr-2 group-hover:text-red-300 group-hover:border-red-300">
                                                                Error
                                                            </span>
                                                        )}

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="w-6 h-6 hover:bg-transparent hover:text-white dark:hover:text-black">
                                                                    <MoreVertical className="w-3 h-3" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="rounded-none border border-black dark:border-white font-mono uppercase tracking-wider">
                                                                <DropdownMenuItem onClick={(e) => handleRefreshSource(source, e)} className="rounded-none focus:bg-black focus:text-white">
                                                                    <RefreshCw className="w-3 h-3 mr-2" />
                                                                    Refresh
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={(e) => handleRenameClick(source, e)} className="rounded-none focus:bg-black focus:text-white">
                                                                    <Pencil className="w-3 h-3 mr-2" />
                                                                    Rename
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => handleDeleteSource(source, e)}
                                                                    className="text-red-600 focus:text-red-600 rounded-none focus:bg-red-50"
                                                                >
                                                                    <Trash2 className="w-3 h-3 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
            {/* Draggable Non-modal Dialog for Source Details */}
            {selectedSource && !isDetailOpen && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        transition: isDragging ? 'none' : 'all 0.2s ease-out'
                    }}
                >
                    <div className="pointer-events-auto border-2 border-black dark:border-white rounded-none bg-white dark:bg-black font-mono shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] dark:shadow-[24px_24px_0px_0px_rgba(255,255,255,0.2)] w-[580px] h-[80vh] flex flex-col shadow-xl">
                        <div
                            className="bg-[#FA4028] h-4 cursor-move hover:h-6 transition-all flex items-center justify-center border-b-2 border-black dark:border-white shrink-0"
                            onMouseDown={handleMouseDown}
                        >
                            <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <SourceDetailPanel
                                source={selectedSource}
                                onClose={() => setSelectedSource(null)}
                                onGenerateSummary={handleGenerateSummary}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </TooltipProvider>
    );
}
