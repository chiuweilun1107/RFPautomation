import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { n8nApi } from '@/features/n8n/api/n8nApi';
import { Evidence } from '../CitationBadge';

/**
 * Assessment data structure from Supabase
 */
export interface AssessmentData {
  id: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  model_used?: string;
  criteria?: unknown;
  [key: string]: unknown;
}

/**
 * Source data structure from Supabase
 */
export interface SourceData {
  id: string;
  title?: string;
  url?: string;
  file_path?: string;
  content?: string;
  [key: string]: unknown;
}

/**
 * Return type for the useAssessmentState hook
 */
export interface UseAssessmentStateReturn {
  /** Whether the initial data is loading */
  loading: boolean;
  /** Assessment data from Supabase */
  data: AssessmentData | null;
  /** Collected evidences from citations */
  evidences: Record<string, Evidence>;
  /** Currently selected evidence for display */
  selectedEvidence: Evidence | null;
  /** Source data for the selected evidence */
  selectedSource: SourceData | null;
  /** Error message if any */
  error: string | null;
  /** Whether AI analysis is in progress */
  isAnalyzing: boolean;
  /** Current active tab key */
  activeTab: string;
  /** Whether the header is expanded */
  isHeaderExpanded: boolean;
  /** Keys to display (excluding system keys) */
  displayKeys: string[];
  /** Set the active tab */
  setActiveTab: (tab: string) => void;
  /** Toggle header expansion */
  setIsHeaderExpanded: (expanded: boolean) => void;
  /** Start AI analysis */
  handleStartAnalysis: () => Promise<void>;
  /** Handle citation click to show evidence details */
  handleCitationClick: (evidence: Evidence) => Promise<void>;
  /** Close the evidence detail panel */
  closeEvidencePanel: () => void;
  /** Refetch assessment data */
  refetch: () => Promise<void>;
}

/**
 * Keys to exclude from display tabs
 */
const EXCLUDED_KEYS = ['id', 'project_id', 'created_at', 'updated_at', 'model_used', 'criteria'];

/**
 * Recursively collects citations from JSONB data structure
 */
function collectCitationsFromData(
  data: AssessmentData
): Record<string, Evidence> {
  const collectedEvidences: Record<string, Evidence> = {};
  const citationMap = new Map<string, number>();
  let citationCounter = 1;

  const collectCitations = (obj: unknown): void => {
    if (!obj || typeof obj !== 'object') return;

    const objRecord = obj as Record<string, unknown>;

    if (objRecord.citations && Array.isArray(objRecord.citations)) {
      const ids: number[] = [];

      objRecord.citations.forEach((cit: Record<string, unknown>) => {
        const key = `${cit.source_id}-${cit.page}-${cit.quote || ''}`;
        let id: number;

        if (citationMap.has(key)) {
          id = citationMap.get(key)!;
        } else {
          id = citationCounter++;
          citationMap.set(key, id);
          collectedEvidences[id] = {
            id,
            source_id: cit.source_id as string,
            page: (cit.page as number) ?? 0,
            source_title: (cit.title as string) ?? 'Unknown Source',
            quote: cit.quote as string | undefined,
          };
        }
        ids.push(id);
      });

      // Attach citation IDs to the object so the renderer knows which badges to show
      objRecord.citationIds = ids;
    }

    Object.values(objRecord).forEach((val) => collectCitations(val));
  };

  collectCitations(data);
  return collectedEvidences;
}

/**
 * A custom hook for managing assessment state and operations.
 *
 * This hook handles:
 * - Fetching and managing assessment data from Supabase
 * - Real-time subscription for assessment updates
 * - Citation evidence collection and management
 * - AI analysis workflow triggering
 * - Tab navigation state
 *
 * @param projectId - The project ID to fetch assessment for
 * @returns Object containing assessment state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   loading,
 *   data,
 *   evidences,
 *   activeTab,
 *   setActiveTab,
 *   handleStartAnalysis,
 *   handleCitationClick,
 * } = useAssessmentState(projectId);
 * ```
 */
export function useAssessmentState(projectId: string): UseAssessmentStateReturn {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AssessmentData | null>(null);
  const [evidences, setEvidences] = useState<Record<string, Evidence>>({});
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

  const supabase = createClient();

  /**
   * Fetch assessment data from Supabase
   */
  const fetchData = useCallback(async () => {
    try {
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('project_assessments')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (assessmentError) throw assessmentError;

      if (assessmentData) {
        const typedData = assessmentData as AssessmentData;
        const keys = Object.keys(typedData).filter(
          (k) => !EXCLUDED_KEYS.includes(k)
        );

        if (keys.length > 0) {
          setActiveTab(keys[0]);
        }

        setData(typedData);
        const collectedEvidences = collectCitationsFromData(typedData);
        setEvidences(collectedEvidences);
      } else {
        setData(null);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useAssessmentState] Fetch error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [projectId, supabase]);

  /**
   * Start AI analysis workflow
   */
  const handleStartAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      await n8nApi.evaluateProject(projectId);

      toast.success('AI Analysis Started', {
        description:
          'The deconstruction process has been initiated. This may take a few minutes.',
      });

      // Optimistically fetch, though Realtime will likely catch it later
      setTimeout(() => fetchData(), 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useAssessmentState] Analysis error:', err);
      toast.error('Analysis Failed', {
        description:
          errorMessage || 'Could not initiate the AI workflow. Please try again.',
      });
    }
    // DO NOT setIsAnalyzing(false) here, we wait for Realtime update
  }, [projectId, fetchData]);

  /**
   * Handle citation click to show evidence details
   */
  const handleCitationClick = useCallback(
    async (evidence: Evidence) => {
      setSelectedEvidence(evidence);

      try {
        const { data: sourceData, error: sourceError } = await supabase
          .from('sources')
          .select('*')
          .eq('id', evidence.source_id)
          .maybeSingle();

        if (sourceError) {
          console.error('[useAssessmentState] Error fetching source:', sourceError);
          setSelectedSource(null);
        } else {
          setSelectedSource(sourceData as SourceData | null);
        }
      } catch (err) {
        console.error('[useAssessmentState] Catch error fetching source:', err);
        setSelectedSource(null);
      }
    },
    [supabase]
  );

  /**
   * Close the evidence detail panel
   */
  const closeEvidencePanel = useCallback(() => {
    setSelectedEvidence(null);
    setSelectedSource(null);
  }, []);

  /**
   * Initial data fetch and Realtime subscription
   */
  useEffect(() => {
    fetchData();

    // Subscribe to Realtime changes for this project
    const channel = supabase
      .channel(`project_assessments_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_assessments',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchData();
          setIsAnalyzing(false);
          toast.success('Intelligence Sequence Updated', {
            description: 'New analysis results have been received.',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, supabase, fetchData]);

  /**
   * Compute display keys from data
   */
  const displayKeys = useMemo(() => {
    if (!data) return [];
    return Object.keys(data).filter((k) => !EXCLUDED_KEYS.includes(k));
  }, [data]);

  return {
    loading,
    data,
    evidences,
    selectedEvidence,
    selectedSource,
    error,
    isAnalyzing,
    activeTab,
    isHeaderExpanded,
    displayKeys,
    setActiveTab,
    setIsHeaderExpanded,
    handleStartAnalysis,
    handleCitationClick,
    closeEvidencePanel,
    refetch: fetchData,
  };
}

export default useAssessmentState;
