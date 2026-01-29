/**
 * useTaskPopupState Hook
 *
 * Manages all state related to the DraggableTaskPopup component:
 * - Citation state (selected evidence, evidences map, converted text)
 * - Content state (generated content, loading state)
 * - Copy state
 * - Source fetching and selection
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { Evidence } from '@/components/workspace/CitationBadge';
import type { Task } from '../types';
import { convertCitationMarksToNumbers } from '../utils/citationTextParser';

/**
 * Configuration options for useTaskPopupState
 */
export interface UseTaskPopupStateOptions {
  /** Task data */
  task: Task;
  /** Whether the popup is open */
  isOpen: boolean;
  /** Initial content if prefetched */
  initialContent?: string | null;
}

/**
 * Return type for useTaskPopupState hook
 */
export interface UseTaskPopupStateReturn {
  // Copy state
  copied: boolean;
  handleCopy: () => void;
  handleDownload: () => void;

  // Citation state
  selectedEvidence: Evidence | null;
  setSelectedEvidence: React.Dispatch<React.SetStateAction<Evidence | null>>;
  evidences: Record<number, Evidence>;
  convertedText: string;

  // Source state
  selectedSource: any | null;
  setSelectedSource: React.Dispatch<React.SetStateAction<any | null>>;

  // Content state
  content: string | null;
  loadingContent: boolean;

  // Citation handler
  handleCitationClick: (evidence: Evidence) => Promise<void>;

  // Close citation panel
  closeCitationPanel: () => void;
}

/**
 * Hook to manage task popup state
 *
 * @param options - Configuration options
 * @returns State and handlers for the task popup
 *
 * @example
 * ```tsx
 * const {
 *   copied,
 *   handleCopy,
 *   evidences,
 *   convertedText,
 *   handleCitationClick,
 * } = useTaskPopupState({
 *   task,
 *   isOpen: true,
 * });
 * ```
 */
export function useTaskPopupState(
  options: UseTaskPopupStateOptions
): UseTaskPopupStateReturn {
  const { task, isOpen, initialContent } = options;
  const supabase = createClient();

  // Copy state
  const [copied, setCopied] = useState(false);

  // Citation states
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [evidences, setEvidences] = useState<Record<number, Evidence>>({});
  const [convertedText, setConvertedText] = useState<string>('');

  // Source state
  const [selectedSource, setSelectedSource] = useState<any | null>(null);

  // Content state
  const [content, setContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  /**
   * Fetch content from database
   */
  const fetchContent = useCallback(async () => {
    if (!task?.id) return;
    setLoadingContent(true);
    try {
      const { data, error } = await supabase
        .from('task_contents')
        .select('content')
        .eq('task_id', task.id)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching content:', error);
      }

      setContent(data?.content || null);
    } catch (err) {
      console.error('Fetch content error:', err);
    } finally {
      setLoadingContent(false);
    }
  }, [task?.id, supabase]);

  /**
   * Handle copy to clipboard
   */
  const handleCopy = useCallback(() => {
    const text =
      typeof task.requirement_text === 'string'
        ? task.requirement_text
        : JSON.stringify(task.requirement_text, null, 2);

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  }, [task.requirement_text]);

  /**
   * Handle download as markdown
   */
  const handleDownload = useCallback(() => {
    const text =
      typeof task.requirement_text === 'string'
        ? task.requirement_text
        : JSON.stringify(task.requirement_text, null, 2);

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-requirement-${task.id.slice(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Download started');
  }, [task.requirement_text, task.id]);

  /**
   * Handle citation click with source fetching
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
          console.error('[TaskPopup] Error fetching source:', sourceError);
          setSelectedSource(null);
        } else {
          setSelectedSource(sourceData);
        }
      } catch (err) {
        console.error('[TaskPopup] Catch error fetching source:', err);
        setSelectedSource(null);
      }
    },
    [supabase]
  );

  /**
   * Close citation panel
   */
  const closeCitationPanel = useCallback(() => {
    setSelectedEvidence(null);
    setSelectedSource(null);
  }, []);

  // Effect: Sync initialContent when opening
  useEffect(() => {
    if (isOpen && initialContent && !content) {
      setContent(initialContent);
    }
  }, [isOpen, initialContent, content]);

  // Effect: Convert citation marks to numbers
  useEffect(() => {
    if (task) {
      const rawText =
        typeof task.requirement_text === 'string'
          ? task.requirement_text
          : JSON.stringify(task.requirement_text, null, 2);

      const { textWithNumbers, evidences: parsedEvidences } =
        convertCitationMarksToNumbers(rawText, task.citations || []);

      setConvertedText(textWithNumbers);
      setEvidences(parsedEvidences);
    }
  }, [task?.id, task?.requirement_text, task?.citations]);

  // Effect: Fetch content and subscribe to realtime updates
  useEffect(() => {
    if (isOpen && task?.id) {
      // Immediate fetch
      fetchContent();

      // Subscribe to realtime updates for this task's content
      const channel = supabase
        .channel(`task-content-${task.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'task_contents',
            filter: `task_id=eq.${task.id}`,
          },
          (payload: any) => {
            setContent((payload.new as any).content);
            toast.success('New content received!');
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, task?.id, fetchContent, supabase]);

  return {
    // Copy state
    copied,
    handleCopy,
    handleDownload,

    // Citation state
    selectedEvidence,
    setSelectedEvidence,
    evidences,
    convertedText,

    // Source state
    selectedSource,
    setSelectedSource,

    // Content state
    content,
    loadingContent,

    // Handlers
    handleCitationClick,
    closeCitationPanel,
  };
}

export default useTaskPopupState;
