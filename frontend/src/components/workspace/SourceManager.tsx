import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  Plus, Globe, Loader2, Trash2, Search,
  MoreVertical, Pencil, Sparkles, Zap, ChevronDown, ArrowRight,
  Brain, ExternalLink, ThumbsUp, ThumbsDown, RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { createPortal } from "react-dom";

// Components
import { SourceDetailSheet } from './SourceDetailSheet';
import { AddSourceDialog } from './AddSourceDialog';
import { RenameSourceDialog } from './RenameSourceDialog';
import { SourceDetailPanel } from "./SourceDetailPanel";

// Hooks
import { useDraggableDialog } from '@/hooks';
import { useAISearch, useSourceList, type Source } from './hooks';

// API
import { sourcesApi } from '@/features/sources/api/sourcesApi';

interface SourceManagerProps {
  projectId: string;
  onSelectSource?: (source: Source) => void;
}

export function SourceManager({ projectId, onSelectSource }: SourceManagerProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog states (UI-specific, kept in component)
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [_isUploading, setIsUploading] = useState(false);

  // Use custom hooks
  const sourceList = useSourceList({
    projectId,
    onSelectSource,
  });

  const aiSearch = useAISearch({
    projectId,
    onImportSuccess: sourceList.fetchSources,
  });

  const draggableDialog = useDraggableDialog({
    initialPosition: { x: 40, y: 150 },
    dialogWidth: 580,
    handleHeight: 24,
  });

  // File upload handler (kept for potential future use via file input)
  const _handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
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
      sourceList.fetchSources();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. See console for details.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Render helpers
  const renderIdleState = () => (
    <div className="space-y-3">
      {/* Search Widget */}
      <div className="relative group font-mono text-sm">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-black dark:text-white" />
        </div>
        <Input
          placeholder="SEARCH SOURCES..."
          value={aiSearch.aiSearchQuery}
          onChange={(e) => aiSearch.setAiSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && aiSearch.handleAISearch()}
          className="pl-9 pr-12 h-10 rounded-none border border-black dark:border-white focus:bg-transparent placeholder:text-gray-400 uppercase tracking-wider"
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                {aiSearch.researchMode === 'fast' ?
                  <Zap className="h-3 w-3" /> :
                  <Brain className="h-3 w-3" />
                }
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none border border-black dark:border-white font-mono uppercase tracking-wider">
              <DropdownMenuItem onClick={() => aiSearch.setResearchMode('fast')} className="rounded-none focus:bg-black focus:text-white dark:focus:bg-white dark:focus:text-black">
                <Zap className="mr-2 h-4 w-4" /> Fast Research
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => aiSearch.setResearchMode('deep')} className="rounded-none focus:bg-black focus:text-white dark:focus:bg-white dark:focus:text-black">
                <Brain className="mr-2 h-4 w-4" /> Deep Research
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-none hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
            onClick={aiSearch.handleAISearch}
            disabled={!aiSearch.aiSearchQuery.trim()}
          >
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Original Add/Filter Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 font-mono text-xs">
        <Button
          variant="outline"
          className="w-full sm:flex-1 justify-center border-black dark:border-white h-8 rounded-none hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black uppercase tracking-wider"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="w-3 h-3 mr-2" />
          Add Source
        </Button>
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="FILTER..."
            value={sourceList.filterQuery}
            onChange={(e) => sourceList.setFilterQuery(e.target.value)}
            className="w-full pl-8 h-8 rounded-none border-black dark:border-white uppercase tracking-wider text-[10px]"
          />
        </div>
      </div>
    </div>
  );

  const renderSearchingState = () => (
    <div className="border border-black dark:border-white p-4 flex items-center gap-3 font-mono bg-white dark:bg-black animate-pulse">
      <div className="relative">
        <Sparkles className="relative w-4 h-4 text-black dark:text-white" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-xs uppercase tracking-wider text-black dark:text-white">{aiSearch.loadingText}</p>
        <p className="text-[10px] text-gray-500 mt-1 uppercase truncate max-w-[200px]">{aiSearch.aiSearchQuery}</p>
      </div>
    </div>
  );

  const renderResultsState = () => (
    <div className="bg-muted/30 rounded-xl p-4 border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium">快速研究完畢！</span>
        </div>
        <Button variant="ghost" size="sm" onClick={aiSearch.resetSearch}>查看</Button>
      </div>

      {/* Show Used Keywords */}
      {aiSearch.aiSearchKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          <span className="text-xs text-muted-foreground flex items-center">
            <Search className="w-3 h-3 mr-1" />
            已使用關鍵字:
          </span>
          {aiSearch.aiSearchKeywords.map((kw, i) => (
            <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      )}

      <div className="bg-background rounded-lg border divide-y max-h-[300px] overflow-y-auto">
        {aiSearch.aiResults.map((result, idx) => (
          <div key={idx} className="p-3 flex gap-3 hover:bg-muted/50 transition-colors">
            <div className="mt-1">
              <Checkbox
                checked={aiSearch.selectedResults.has(idx)}
                onCheckedChange={(checked) => aiSearch.toggleResultSelection(idx, !!checked)}
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
            onClick={aiSearch.clearSearch}
          >
            刪除
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">已選取 {aiSearch.selectedResults.size} 個來源</span>
          <Button size="sm" onClick={aiSearch.handleImportResults} disabled={aiSearch.isImporting || aiSearch.selectedResults.size === 0}>
            {aiSearch.isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            匯入
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSourceItem = (source: Source) => {
    const isLinked = sourceList.linkedSourceIds.has(source.id);

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
          onClick={() => sourceList.toggleSourceLink(source.id)}
        >
          <Checkbox
            checked={isLinked}
            disabled={sourceList.saving || source.status !== 'ready'}
            className="pointer-events-none rounded-none border-black dark:border-white data-[state=checked]:bg-black data-[state=checked]:text-white dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black group-hover:border-white dark:group-hover:border-black"
          />
        </div>

        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => sourceList.handleViewSource(source)}
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
              <span>-</span>
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
              <DropdownMenuItem onClick={(e) => sourceList.handleRefreshSource(source, e)} className="rounded-none focus:bg-black focus:text-white">
                <RefreshCw className="w-3 h-3 mr-2" />
                Refresh
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                sourceList.handleRenameClick(source, e);
                setIsRenameDialogOpen(true);
              }} className="rounded-none focus:bg-black focus:text-white">
                <Pencil className="w-3 h-3 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => sourceList.handleDeleteSource(source, e)}
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
  };

  const renderSourceSections = () => {
    const sections = sourceList.sourceSections;
    const sectionKeys = ['tender', 'internal', 'external'] as const;

    return sectionKeys.map((key) => {
      const section = sections[key];
      if (section.items.length === 0) return null;
      const isCollapsed = sourceList.collapsedSections[key];

      return (
        <div key={key} className="space-y-1">
          <div
            className="px-3 py-2 bg-black/5 dark:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-black/80 dark:text-white/80 flex items-center justify-between cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors group select-none"
            onClick={() => sourceList.toggleSection(key)}
          >
            <span>{section.label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
          </div>

          {!isCollapsed && (
            <div className="border-t border-black/10 dark:border-white/10">
              {section.items.map(renderSourceItem)}
            </div>
          )}
        </div>
      );
    });
  };

  const renderEmptyState = () => (
    <div className="text-center py-16 border-2 border-dashed border-black/10 dark:border-white/10 rounded-none bg-black/5 dark:bg-white/5 m-1">
      <Globe className="h-14 w-14 mx-auto text-black/20 dark:text-white/20 mb-5" strokeWidth={1.5} />
      <h3 className="font-black uppercase tracking-tight text-foreground mb-2 text-base">
        NO SOURCES FOUND
      </h3>
      <p className="text-[10px] text-muted-foreground max-w-xs mx-auto leading-relaxed uppercase tracking-wider font-bold">
        Upload files or use AI Search above to build your knowledge base.
      </p>
    </div>
  );

  const renderNoMatchesState = () => (
    <div className="text-center py-12">
      <Search className="h-12 w-12 mx-auto text-black/30 dark:text-white/30 mb-4" strokeWidth={1.5} />
      <h3 className="font-black uppercase tracking-tight text-foreground mb-2 text-sm">
        NO MATCHES FOR &quot;{sourceList.filterQuery}&quot;
      </h3>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
        Try adjusting your search query
      </p>
    </div>
  );

  return (
    <TooltipProvider>
      <Card className="h-full border-none shadow-none flex flex-col bg-transparent">
        <CardHeader className="px-0 pt-0 pb-3 shrink-0 space-y-4">
          {/* AI Search / Status / Results Area */}
          {aiSearch.searchState === 'idle' && renderIdleState()}
          {aiSearch.searchState === 'searching' && renderSearchingState()}
          {aiSearch.searchState === 'results' && renderResultsState()}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.docx"
            onChange={handleFileChange}
          />
        </CardHeader>

        {/* Source List Area */}
        <CardContent className="px-0 space-y-6 flex-1 overflow-y-auto no-scrollbar">
          {sourceList.filteredSources.length === 0 && sourceList.sources.length === 0 && aiSearch.searchState === 'idle' && renderEmptyState()}
          {sourceList.filteredSources.length === 0 && sourceList.sources.length > 0 && sourceList.filterQuery && renderNoMatchesState()}
          {renderSourceSections()}
        </CardContent>

        {/* Detail Sheet (legacy) */}
        <SourceDetailSheet
          source={sourceList.selectedSource}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          onGenerateSummary={sourceList.handleGenerateSummary}
        />

        {/* Add Source Dialog */}
        <AddSourceDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          projectId={projectId}
          onSourceAdded={sourceList.fetchSources}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!sourceList.sourceToDelete} onOpenChange={(open) => !open && sourceList.cancelDelete()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確認刪除來源？</AlertDialogTitle>
              <AlertDialogDescription>
                您確定要永久刪除「{sourceList.sourceToDelete?.title}」嗎？此動作無法復原。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={sourceList.confirmDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
              >
                確認刪除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Rename Dialog */}
        {sourceList.sourceToRename && (
          <RenameSourceDialog
            sourceId={sourceList.sourceToRename.id}
            initialTitle={sourceList.sourceToRename.title}
            open={isRenameDialogOpen}
            onOpenChange={(open) => {
              setIsRenameDialogOpen(open);
              if (!open) sourceList.setSourceToRename(null);
            }}
            onSuccess={(newTitle) => {
              sourceList.updateSourceTitle(sourceList.sourceToRename!.id, newTitle);
            }}
          />
        )}
      </Card>

      {/* Draggable Non-modal Dialog for Source Details */}
      {sourceList.selectedSource && !isDetailOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={draggableDialog.dialogStyle}
        >
          <div className="pointer-events-auto border-2 border-black dark:border-white rounded-none bg-white dark:bg-black font-mono shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] dark:shadow-[24px_24px_0px_0px_rgba(255,255,255,0.2)] w-full sm:w-[580px] max-w-[95vw] h-[80vh] max-h-[90vh] flex flex-col shadow-xl">
            <div
              className="bg-[#FA4028] h-4 cursor-move hover:h-6 transition-all flex items-center justify-center border-b-2 border-black dark:border-white shrink-0"
              {...draggableDialog.dragListeners}
            >
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <SourceDetailPanel
                source={sourceList.selectedSource}
                onClose={() => sourceList.setSelectedSource(null)}
                onGenerateSummary={sourceList.handleGenerateSummary}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </TooltipProvider>
  );
}
