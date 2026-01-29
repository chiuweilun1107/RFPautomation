/**
 * useContentHighlight Hook
 *
 * Provides quote highlighting functionality for content panels.
 * Handles both normalized fuzzy matching and exact matching for quotes.
 */

import { useMemo, ReactNode, createElement } from 'react';
import { findQuoteInContent, findAllMatches, TextMatchResult } from '@/lib/textMatching';

/**
 * Configuration for highlight styling
 */
export interface HighlightConfig {
  /** CSS classes for the highlight mark element */
  className?: string;
  /** Data attribute to mark highlighted elements */
  dataAttribute?: string;
}

/**
 * Props for the useContentHighlight hook
 */
export interface UseContentHighlightProps {
  /** The full content to search in */
  content: string | undefined | null;
  /** The quote to highlight */
  quote: string | undefined | null;
  /** Whether highlighting is enabled */
  enabled?: boolean;
  /** Custom highlight configuration */
  highlightConfig?: HighlightConfig;
}

/**
 * Return type for the useContentHighlight hook
 */
export interface UseContentHighlightResult {
  /** The highlighted content as React nodes, or null if no match */
  highlightedContent: ReactNode | null;
  /** Whether a match was found */
  hasMatch: boolean;
  /** The match result with positions, or null if no match */
  matchResult: TextMatchResult | null;
}

const DEFAULT_HIGHLIGHT_CONFIG: HighlightConfig = {
  className:
    'bg-yellow-200 dark:bg-yellow-800/80 text-black dark:text-white font-semibold px-1 py-0.5 rounded-sm',
  dataAttribute: 'highlighted',
};

/**
 * Hook for highlighting a quote within content.
 *
 * @param props - The hook props
 * @returns The highlighted content and match information
 *
 * @example
 * ```tsx
 * const { highlightedContent, hasMatch } = useContentHighlight({
 *   content: documentContent,
 *   quote: evidence?.quote,
 *   enabled: showHighlight,
 * });
 *
 * return <div>{highlightedContent || content}</div>;
 * ```
 */
export function useContentHighlight({
  content,
  quote,
  enabled = true,
  highlightConfig = DEFAULT_HIGHLIGHT_CONFIG,
}: UseContentHighlightProps): UseContentHighlightResult {
  return useMemo(() => {
    if (!enabled || !quote || !content) {
      return {
        highlightedContent: null,
        hasMatch: false,
        matchResult: null,
      };
    }

    const matchResult = findQuoteInContent(content, quote);

    if (!matchResult) {
      return {
        highlightedContent: null,
        hasMatch: false,
        matchResult: null,
      };
    }

    const { startIndex, endIndex } = matchResult;

    const beforeQuote = content.substring(0, startIndex);
    const quotePart = content.substring(startIndex, endIndex);
    const afterQuote = content.substring(endIndex);

    const config = { ...DEFAULT_HIGHLIGHT_CONFIG, ...highlightConfig };

    const highlightedContent = createElement(
      'span',
      { key: 'highlight-wrapper' },
      beforeQuote,
      createElement(
        'mark',
        {
          key: 'highlight-mark',
          className: config.className,
          [`data-${config.dataAttribute}`]: 'true',
        },
        quotePart
      ),
      afterQuote
    );

    return {
      highlightedContent,
      hasMatch: true,
      matchResult,
    };
  }, [content, quote, enabled, highlightConfig]);
}

/**
 * Props for the useSearchHighlight hook
 */
export interface UseSearchHighlightProps {
  /** The content to search in */
  content: string | undefined | null;
  /** The search query */
  query: string;
  /** The current match index for navigation */
  currentMatchIndex: number;
}

/**
 * Return type for the useSearchHighlight hook
 */
export interface UseSearchHighlightResult {
  /** The highlighted content as React nodes, or null if no matches */
  highlightedContent: ReactNode | null;
  /** Array of all match positions */
  matches: TextMatchResult[];
  /** Total number of matches */
  matchCount: number;
}

/**
 * Hook for highlighting search results within content.
 *
 * @param props - The hook props
 * @returns The highlighted content and match information
 *
 * @example
 * ```tsx
 * const { highlightedContent, matchCount } = useSearchHighlight({
 *   content: documentContent,
 *   query: searchQuery,
 *   currentMatchIndex: currentMatch,
 * });
 *
 * return (
 *   <div>
 *     <span>{currentMatch + 1} / {matchCount}</span>
 *     <div>{highlightedContent || content}</div>
 *   </div>
 * );
 * ```
 */
export function useSearchHighlight({
  content,
  query,
  currentMatchIndex,
}: UseSearchHighlightProps): UseSearchHighlightResult {
  const matches = useMemo(() => {
    if (!content || !query.trim()) {
      return [];
    }
    return findAllMatches(content, query);
  }, [content, query]);

  const highlightedContent = useMemo(() => {
    if (!content || matches.length === 0) {
      return null;
    }

    const parts: ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      if (match.startIndex > lastIndex) {
        parts.push(content.substring(lastIndex, match.startIndex));
      }

      const isCurrent = index === currentMatchIndex;
      parts.push(
        createElement(
          'mark',
          {
            key: `match-${index}`,
            id: `search-match-${index}`,
            className: isCurrent
              ? 'bg-orange-500 text-white font-semibold px-0.5 rounded-sm transition-colors duration-200'
              : 'bg-yellow-200 dark:bg-yellow-800/60 text-black dark:text-white font-semibold px-0.5 rounded-sm transition-colors duration-200',
          },
          content.substring(match.startIndex, match.endIndex)
        )
      );
      lastIndex = match.endIndex;
    });

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return createElement('span', { key: 'search-highlight-wrapper' }, ...parts);
  }, [content, matches, currentMatchIndex]);

  return {
    highlightedContent,
    matches,
    matchCount: matches.length,
  };
}
