import type { Citation, Task } from '@/components/workspace/types';
import type { Evidence } from '@/components/workspace/CitationBadge';

/**
 * Collect citations from task and assign sequential numeric IDs
 * Supports JSONB citations array with deduplication
 *
 * @param task - Task object containing citations array
 * @returns Object with evidences (keyed by numeric ID) and citationIds array
 */
export function collectTaskCitations(task: Task): {
  evidences: Record<number, Evidence>;
  citationIds: number[];
} {
  const evidences: Record<number, Evidence> = {};
  const citationMap = new Map<string, number>();
  const citationIds: number[] = [];
  let counter = 1;

  // Handle empty or missing citations
  if (!task.citations || task.citations.length === 0) {
    return { evidences: {}, citationIds: [] };
  }

  // Process citations array
  task.citations.forEach((cit) => {
    // Use source_id + page + quote as unique key for deduplication
    const key = `${cit.source_id}-${cit.page}-${cit.quote || ''}`;

    if (citationMap.has(key)) {
      // Reuse existing ID for duplicate citations
      citationIds.push(citationMap.get(key)!);
    } else {
      // Assign new sequential numeric ID
      const id = counter++;
      citationMap.set(key, id);
      evidences[id] = {
        id,
        source_id: cit.source_id,
        page: cit.page,
        source_title: cit.title || 'Unknown Source',
        quote: cit.quote
      };
      citationIds.push(id);
    }
  });

  return { evidences, citationIds };
}
