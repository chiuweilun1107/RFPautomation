import { useState, useEffect, useCallback } from 'react';
import { sourcesApi } from '@/features/sources/api/sourcesApi';
import { toast } from 'sonner';

/**
 * AI Search result item from the API
 */
export interface AISearchResultItem {
  title: string;
  url: string;
  content?: string;
  snippet?: string;
}

/**
 * Search state enum for the AI search flow
 */
export type SearchState = 'idle' | 'searching' | 'results';

/**
 * Research mode for AI search
 */
export type ResearchMode = 'fast' | 'deep';

/**
 * Options for the useAISearch hook
 */
export interface UseAISearchOptions {
  /** Project ID for scoping the search */
  projectId: string;
  /** Callback when sources are imported successfully */
  onImportSuccess?: () => void;
}

/**
 * Return type for the useAISearch hook
 */
export interface UseAISearchReturn {
  /** Current state of the search flow */
  searchState: SearchState;
  /** Current search query input */
  aiSearchQuery: string;
  /** Set the search query input */
  setAiSearchQuery: (query: string) => void;
  /** Search results from AI */
  aiResults: AISearchResultItem[];
  /** Set of selected result indices */
  selectedResults: Set<number>;
  /** Toggle selection of a result by index */
  toggleResultSelection: (index: number, checked: boolean) => void;
  /** Current research mode */
  researchMode: ResearchMode;
  /** Set the research mode */
  setResearchMode: (mode: ResearchMode) => void;
  /** Keywords used in the search */
  aiSearchKeywords: string[];
  /** Current loading text message */
  loadingText: string;
  /** Whether import is in progress */
  isImporting: boolean;
  /** Execute AI search */
  handleAISearch: () => Promise<void>;
  /** Import selected results as sources */
  handleImportResults: () => Promise<void>;
  /** Reset to idle state */
  resetSearch: () => void;
  /** Clear search and go back to idle */
  clearSearch: () => void;
}

/**
 * Loading messages for the search animation
 */
const LOADING_MESSAGES = [
  "正在分析您的需求...",
  "正在生成最佳搜尋關鍵字...",
  "正在搜尋相關來源...",
  "正在整理搜尋結果...",
];

const DEFAULT_LOADING_TEXT = "正在研究網站...";

/**
 * Custom hook for AI-powered source search functionality.
 *
 * This hook manages the complete AI search flow including:
 * - Search query state
 * - Search execution with loading states
 * - Result selection management
 * - Importing selected results as sources
 *
 * @param options - Configuration options
 * @returns Object containing search state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   searchState,
 *   aiSearchQuery,
 *   setAiSearchQuery,
 *   handleAISearch,
 *   aiResults,
 *   selectedResults,
 *   toggleResultSelection,
 *   handleImportResults,
 * } = useAISearch({
 *   projectId: 'project-123',
 *   onImportSuccess: () => fetchSources(),
 * });
 * ```
 */
export function useAISearch(options: UseAISearchOptions): UseAISearchReturn {
  const { projectId, onImportSuccess } = options;

  // Search state
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiResults, setAiResults] = useState<AISearchResultItem[]>([]);
  const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set());
  const [researchMode, setResearchMode] = useState<ResearchMode>('fast');
  const [aiSearchKeywords, setAiSearchKeywords] = useState<string[]>([]);
  const [loadingText, setLoadingText] = useState(DEFAULT_LOADING_TEXT);
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Cycling loading text effect during search
   */
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (searchState === 'searching') {
      let index = 0;
      interval = setInterval(() => {
        index = (index + 1) % LOADING_MESSAGES.length;
        setLoadingText(LOADING_MESSAGES[index]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [searchState]);

  /**
   * Execute AI search
   */
  const handleAISearch = useCallback(async () => {
    if (!aiSearchQuery.trim()) return;

    setSearchState('searching');
    try {
      const result = await sourcesApi.aiSearch(aiSearchQuery.trim(), projectId);
      // Extract results from API response - handle different response structures
      const data = result as Record<string, unknown>;

      // Try to get results array from various possible response structures
      let results: AISearchResultItem[] = [];
      if (Array.isArray(data.results)) {
        results = data.results as AISearchResultItem[];
      } else if (Array.isArray(data.sources)) {
        // Map sources to AISearchResultItem format
        results = (data.sources as Array<{ id: string; title: string; origin_url: string | null }>).map(s => ({
          title: s.title,
          url: s.origin_url || '',
        }));
      }

      setAiResults(results);
      setAiSearchKeywords((data.searchQueries as string[]) || []);
      // Default select all
      setSelectedResults(new Set(results.map((_, i) => i)));
      setSearchState('results');
    } catch (error) {
      console.error('AI search error:', error);
      toast.error('搜尋失敗');
      setSearchState('idle');
    } finally {
      // Reset loading text when done
      setLoadingText(DEFAULT_LOADING_TEXT);
    }
  }, [aiSearchQuery, projectId]);

  /**
   * Import selected results as sources
   */
  const handleImportResults = useCallback(async () => {
    setIsImporting(true);
    const resultsToImport = aiResults.filter((_, i) => selectedResults.has(i));

    try {
      for (const result of resultsToImport) {
        await sourcesApi.fromUrl(result.url, projectId);
      }
      toast.success(`成功匯入 ${resultsToImport.length} 個來源`);
      setSearchState('idle');
      setAiSearchQuery('');
      setAiResults([]);
      setSelectedResults(new Set());
      onImportSuccess?.();
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('匯入失敗');
    } finally {
      setIsImporting(false);
    }
  }, [aiResults, selectedResults, projectId, onImportSuccess]);

  /**
   * Toggle selection of a result by index
   */
  const toggleResultSelection = useCallback((index: number, checked: boolean) => {
    setSelectedResults(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(index);
      } else {
        next.delete(index);
      }
      return next;
    });
  }, []);

  /**
   * Reset to idle state (keeps query)
   */
  const resetSearch = useCallback(() => {
    setSearchState('idle');
  }, []);

  /**
   * Clear search and go back to idle
   */
  const clearSearch = useCallback(() => {
    setSearchState('idle');
    setAiSearchQuery('');
    setAiResults([]);
    setSelectedResults(new Set());
    setAiSearchKeywords([]);
  }, []);

  return {
    searchState,
    aiSearchQuery,
    setAiSearchQuery,
    aiResults,
    selectedResults,
    toggleResultSelection,
    researchMode,
    setResearchMode,
    aiSearchKeywords,
    loadingText,
    isImporting,
    handleAISearch,
    handleImportResults,
    resetSearch,
    clearSearch,
  };
}

export default useAISearch;
