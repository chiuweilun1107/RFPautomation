/**
 * Citation Text Parser Utilities
 *
 * Converts citation marks like (出處：檔案名 P.頁碼) to numbered format [1] [2] [3]
 * for use with CitationRenderer component.
 */

import type { Citation } from '@/components/workspace/types';
import type { Evidence } from '@/components/workspace/CitationBadge';

/**
 * Regular expressions for parsing citation marks
 *
 * Matches formats:
 * - (出處：3-需求說明書.docx P.1) - with fullwidth colon
 * - (出處: 3-需求說明書.docx P.1) - with halfwidth colon
 * - (出處：3-需求說明書.docx P.1, RFP.xlsx P.5)
 * - (出處：RFP.xlsx P.1)
 */
const CITATION_PATTERN = /[\(（]出處\s*[：:]\s*([^)）]+?)[）\)]/g;  // Match both ASCII and fullwidth parentheses
const SOURCE_ITEM_PATTERN = /([^,]+?)\s+P\.(\d+)/g;

/**
 * Parse source information from citation text
 *
 * Supports multiple formats:
 * - "需求說明書 P.1, RFP.xlsx P.5" - multiple full references
 * - "需求說明書 P.2, P.7" - second reference inherits first title
 * - "需求說明書 P.1" - single reference
 *
 * @param citationText - Example: "3-需求說明書.docx P.1, P.2, RFP.xlsx P.5"
 * @returns Parsed source list with title and page
 */
function parseCitationText(citationText: string): Array<{ title: string; page: number }> {
  const sources: Array<{ title: string; page: number }> = [];
  let lastTitle = '';

  // Split by comma or fullwidth comma, then process each part
  const parts = citationText.split(/[,，]/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Try to match "檔案名 P.頁碼" format
    const fullMatch = /^(.+?)\s+P\.(\d+)/.exec(trimmed);
    if (fullMatch) {
      const title = fullMatch[1].trim();
      const page = parseInt(fullMatch[2], 10);
      lastTitle = title; // Remember this title for next standalone page references
      sources.push({ title, page });
      continue;
    }

    // Try to match standalone "P.頁碼" format (inherits previous title)
    const pageOnlyMatch = /^P\.(\d+)/.exec(trimmed);
    if (pageOnlyMatch && lastTitle) {
      const page = parseInt(pageOnlyMatch[1], 10);
      sources.push({ title: lastTitle, page }); // Reuse last title
      continue;
    }
  }

  return sources;
}

/**
 * Match parsed source with citations array
 *
 * Uses a flexible matching strategy that works even with incomplete citation data:
 * 1. Exact match (title + page) - if title exists in citations
 * 2. Title match only - if title exists in citations
 * 3. Page match only - fallback for citations without title field
 * 4. Create synthetic citation - if no match found but we have parsed data
 *
 * @param parsedSource - Parsed source from requirement text
 * @param citations - Task's citations JSONB array (may be incomplete)
 * @returns Matched or synthetic Citation object
 */
function matchCitation(
  parsedSource: { title: string; page: number },
  citations: Citation[]
): Citation {
  // Priority 1: Exact match (title and page both match)
  const exactMatch = citations.find(
    (cit) => cit.title === parsedSource.title && cit.page === parsedSource.page
  );
  if (exactMatch) return exactMatch;

  // Priority 2: Title match only (page may differ)
  const titleMatch = citations.find((cit) => cit.title === parsedSource.title);
  if (titleMatch) return titleMatch;

  // Priority 3: Fuzzy match (title contains or is contained)
  const fuzzyMatch = citations.find((cit) =>
    cit.title?.includes(parsedSource.title) || parsedSource.title.includes(cit.title || '')
  );
  if (fuzzyMatch) return fuzzyMatch;

  // Priority 4: Page match only (for incomplete citations without title)
  const pageMatch = citations.find((cit) => cit.page === parsedSource.page);
  if (pageMatch) {
    // Merge parsed title with matched citation data
    return {
      ...pageMatch,
      title: parsedSource.title // Use title from parsed text
    };
  }

  // Priority 5: Create synthetic citation from parsed data
  // This ensures we always show a badge, even without complete DB data
  return {
    source_id: 'unknown', // Placeholder
    page: parsedSource.page,
    title: parsedSource.title,
    quote: undefined // No quote available
  };
}

/**
 * Convert citation marks in requirement text to numbered format
 *
 * Transforms text like:
 * "系統應支援... (出處：3-需求說明書.docx P.1) 並且... (出處：RFP.xlsx P.5)"
 *
 * Into:
 * "系統應支援... [1] 並且... [2]"
 *
 * @param requirementText - Original requirement text with (出處：...) marks
 * @param citations - Task's citations JSONB array
 * @returns Object with converted text and evidence mapping
 *
 * @example
 * const { textWithNumbers, evidences } = convertCitationMarksToNumbers(
 *   "需求 (出處：doc.docx P.1)",
 *   [{ source_id: "uuid", page: 1, title: "doc.docx", quote: "..." }]
 * );
 * // textWithNumbers: "需求 [1]"
 * // evidences: { 1: { id: 1, source_id: "uuid", page: 1, ... } }
 */
export function convertCitationMarksToNumbers(
  requirementText: string,
  citations: Citation[]
): {
  textWithNumbers: string;
  evidences: Record<number, Evidence>;
} {
  const evidences: Record<number, Evidence> = {};
  const citationMap = new Map<string, number>(); // For deduplication: key -> citationId
  let counter = 1;

  // Replace all (出處：...) marks with [number]
  const textWithNumbers = requirementText.replace(CITATION_PATTERN, (fullMatch, citationText) => {
    const parsedSources = parseCitationText(citationText);
    const numberTags: string[] = [];

    parsedSources.forEach((parsedSource) => {
      // matchCitation now always returns a Citation object (never null)
      const matchedCitation = matchCitation(parsedSource, citations);

      // Deduplication key: use title + page for better deduplication
      // (source_id might be 'unknown' for synthetic citations)
      const key = `${matchedCitation.title || parsedSource.title}-${matchedCitation.page}`;

      if (citationMap.has(key)) {
        // Reuse existing ID for duplicate citation
        numberTags.push(`[${citationMap.get(key)}]`);
      } else {
        // Assign new numeric ID
        const id = counter++;
        citationMap.set(key, id);
        evidences[id] = {
          id,
          source_id: matchedCitation.source_id || 'unknown',
          page: matchedCitation.page,
          source_title: matchedCitation.title || parsedSource.title,
          quote: matchedCitation.quote
        };
        numberTags.push(`[${id}]`);
      }
    });

    // Return converted number tags separated by spaces (deduplicated)
    return Array.from(new Set(numberTags)).join(' ');
  });

  return { textWithNumbers, evidences };
}

/**
 * Collect all evidences from citations array
 *
 * Used for displaying all citations in the SOURCE_REFERENCES section
 *
 * @param citations - Task's citations JSONB array
 * @returns Evidence mapping with sequential IDs
 */
export function collectAllEvidences(citations: Citation[]): Record<number, Evidence> {
  const evidences: Record<number, Evidence> = {};
  citations.forEach((cit, index) => {
    evidences[index + 1] = {
      id: index + 1,
      source_id: cit.source_id,
      page: cit.page,
      source_title: cit.title || 'Unknown Source',
      quote: cit.quote
    };
  });
  return evidences;
}
