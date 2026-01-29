import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sourcesApi } from '@/features/sources/api/sourcesApi';
import { n8nApi } from '@/features/n8n/api/n8nApi';
import { toast } from 'sonner';

/**
 * Source type definition
 */
export interface Source {
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

/**
 * Source sections for grouping display
 */
export interface SourceSections {
  tender: { label: string; items: Source[] };
  internal: { label: string; items: Source[] };
  external: { label: string; items: Source[] };
}

/**
 * Options for the useSourceList hook
 */
export interface UseSourceListOptions {
  /** Project ID for scoping sources */
  projectId: string;
  /** Callback when a source is selected for viewing */
  onSelectSource?: (source: Source) => void;
}

/**
 * Return type for the useSourceList hook
 */
export interface UseSourceListReturn {
  // State
  /** All sources */
  sources: Source[];
  /** Set of linked source IDs */
  linkedSourceIds: Set<string>;
  /** Count of linked sources */
  linkedCount: number;
  /** Loading state */
  loading: boolean;
  /** Saving state (for toggle operations) */
  saving: boolean;
  /** Currently selected source for detail view */
  selectedSource: Source | null;
  /** Set the selected source */
  setSelectedSource: (source: Source | null) => void;
  /** Source pending deletion */
  sourceToDelete: Source | null;
  /** Source pending rename */
  sourceToRename: Source | null;
  /** Set source to rename */
  setSourceToRename: (source: Source | null) => void;
  /** Filter query for source list */
  filterQuery: string;
  /** Set the filter query */
  setFilterQuery: (query: string) => void;
  /** Collapsed state for sections */
  collapsedSections: Record<string, boolean>;
  /** Filtered sources based on filter query */
  filteredSources: Source[];
  /** Grouped source sections */
  sourceSections: SourceSections;

  // Actions
  /** Fetch/refresh sources from database */
  fetchSources: () => Promise<void>;
  /** Toggle a source's link status to project */
  toggleSourceLink: (sourceId: string) => Promise<void>;
  /** Handle viewing a source */
  handleViewSource: (source: Source) => void;
  /** Generate summary for a source */
  handleGenerateSummary: (sourceId: string) => Promise<void>;
  /** Refresh/re-ingest a source */
  handleRefreshSource: (source: Source, e: React.MouseEvent) => Promise<void>;
  /** Initiate rename flow for a source */
  handleRenameClick: (source: Source, e: React.MouseEvent) => void;
  /** Initiate delete flow for a source */
  handleDeleteSource: (source: Source, e?: React.MouseEvent) => void;
  /** Confirm and execute delete */
  confirmDelete: () => Promise<void>;
  /** Cancel delete operation */
  cancelDelete: () => void;
  /** Toggle section collapse state */
  toggleSection: (key: string) => void;
  /** Update a source locally after rename */
  updateSourceTitle: (sourceId: string, newTitle: string) => void;
}

/**
 * Custom hook for managing the source list, including fetching, filtering,
 * linking, and CRUD operations on sources.
 *
 * @param options - Configuration options
 * @returns Object containing source list state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   sources,
 *   filteredSources,
 *   sourceSections,
 *   linkedSourceIds,
 *   toggleSourceLink,
 *   handleViewSource,
 * } = useSourceList({
 *   projectId: 'project-123',
 *   onSelectSource: (source) => console.log('Selected:', source),
 * });
 * ```
 */
export function useSourceList(options: UseSourceListOptions): UseSourceListReturn {
  const { projectId, onSelectSource } = options;

  const supabase = createClient();

  // Source state
  const [sources, setSources] = useState<Source[]>([]);
  const [linkedSourceIds, setLinkedSourceIds] = useState<Set<string>>(new Set());

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<Source | null>(null);
  const [sourceToRename, setSourceToRename] = useState<Source | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  /**
   * Fetch sources and linked source IDs from database
   */
  const fetchSources = useCallback(async () => {
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
      setSources(relevantSources as Source[]);
    }

    if (projectSources) {
      const linkedIds = new Set<string>(projectSources.map(ps => ps.source_id));
      setLinkedSourceIds(linkedIds);
    }
  }, [projectId, supabase]);

  /**
   * Set up realtime subscription for sources changes
   */
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
  }, [projectId, fetchSources, supabase]);

  /**
   * Toggle section collapse state
   */
  const toggleSection = useCallback((key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  /**
   * Handle viewing a source (either via callback or local state)
   */
  const handleViewSource = useCallback((source: Source) => {
    if (onSelectSource) {
      onSelectSource(source);
    } else {
      setSelectedSource(source);
    }
  }, [onSelectSource]);

  /**
   * Generate summary for a source
   */
  const handleGenerateSummary = useCallback(async (sourceId: string) => {
    try {
      const data = await sourcesApi.summarize(sourceId);
      const topics = data.topics;

      setSources(prev => prev.map(s =>
        s.id === sourceId
          ? { ...s, summary: data.summary, topics }
          : s
      ));

      if (selectedSource?.id === sourceId) {
        setSelectedSource(prev => prev ? { ...prev, summary: data.summary, topics } : null);
      }
      toast.success('摘要已生成');
    } catch (error) {
      console.error('Generate summary failed:', error);
      toast.error('生成摘要失敗');
    }
  }, [selectedSource?.id]);

  /**
   * Refresh/re-ingest a source
   */
  const handleRefreshSource = useCallback(async (source: Source, e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    toast.info("Triggering refresh...");
    try {
      await n8nApi.ingest(source.id, projectId);
      toast.success("Refresh triggered successfully");
    } catch (error) {
      console.error("Refresh error:", error);
      toast.error("Failed to refresh source");
    } finally {
      setLoading(false);
    }
  }, [loading, projectId]);

  /**
   * Initiate rename flow for a source
   */
  const handleRenameClick = useCallback((source: Source, e: React.MouseEvent) => {
    e.stopPropagation();
    setSourceToRename(source);
  }, []);

  /**
   * Initiate delete flow for a source
   */
  const handleDeleteSource = useCallback((source: Source, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSourceToDelete(source);
  }, []);

  /**
   * Confirm and execute delete
   */
  const confirmDelete = useCallback(async () => {
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
  }, [sourceToDelete, projectId, supabase, fetchSources]);

  /**
   * Cancel delete operation
   */
  const cancelDelete = useCallback(() => {
    setSourceToDelete(null);
  }, []);

  /**
   * Toggle a source's link status to project
   */
  const toggleSourceLink = useCallback(async (sourceId: string) => {
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
        setLinkedSourceIds(prev => new Set<string>([...prev, sourceId]));
        toast.success('已加入專案知識庫');
      }
    } catch (error) {
      console.error('Toggle link failed:', error);
      toast.error('操作失敗');
    } finally {
      setSaving(false);
    }
  }, [linkedSourceIds, projectId, supabase]);

  /**
   * Update a source's title locally after rename
   */
  const updateSourceTitle = useCallback((sourceId: string, newTitle: string) => {
    setSources(prev => prev.map(s =>
      s.id === sourceId ? { ...s, title: newTitle } : s
    ));
  }, []);

  /**
   * Filtered sources based on filter query
   */
  const filteredSources = useMemo(() => {
    if (!filterQuery.trim()) return sources;
    const query = filterQuery.toLowerCase();
    return sources.filter(s =>
      s.title.toLowerCase().includes(query) ||
      s.content?.toLowerCase().includes(query)
    );
  }, [sources, filterQuery]);

  /**
   * Grouped source sections for display
   */
  const sourceSections = useMemo((): SourceSections => {
    const sections: SourceSections = {
      tender: { label: 'TENDER DOCUMENTS', items: [] },
      internal: { label: 'INTERNAL KNOWLEDGE', items: [] },
      external: { label: 'EXTERNAL SOURCES', items: [] },
    };

    filteredSources.forEach(s => {
      const type = s.type?.toLowerCase();
      const sourceType = s.source_type?.toLowerCase();

      if (type === 'web' || type === 'web_crawl' || sourceType === 'web' || sourceType === 'url') {
        sections.external.items.push(s);
      } else if (sourceType === 'rfp' || sourceType === 'tender') {
        sections.tender.items.push(s);
      } else {
        sections.internal.items.push(s);
      }
    });

    return sections;
  }, [filteredSources]);

  return {
    // State
    sources,
    linkedSourceIds,
    linkedCount: linkedSourceIds.size,
    loading,
    saving,
    selectedSource,
    setSelectedSource,
    sourceToDelete,
    sourceToRename,
    setSourceToRename,
    filterQuery,
    setFilterQuery,
    collapsedSections,
    filteredSources,
    sourceSections,

    // Actions
    fetchSources,
    toggleSourceLink,
    handleViewSource,
    handleGenerateSummary,
    handleRefreshSource,
    handleRenameClick,
    handleDeleteSource,
    confirmDelete,
    cancelDelete,
    toggleSection,
    updateSourceTitle,
  };
}

export default useSourceList;
