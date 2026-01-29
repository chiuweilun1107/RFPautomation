/**
 * Text Matching Utilities
 *
 * Provides functions for normalizing text and finding positions in content,
 * primarily used for highlighting quotes and citations in documents.
 */

/**
 * Regular expression pattern for characters to skip during text normalization.
 * Matches whitespace and Markdown formatting characters (# * |)
 */
export const TEXT_SKIP_CHARS_PATTERN = /[\s#*|]/;

/**
 * Chinese punctuation to ASCII mapping
 */
const CHINESE_PUNCTUATION_MAP: Record<string, string> = {
  '\uFF0C': ',', // ，
  '\u3002': '.', // 。
  '\uFF01': '!', // ！
  '\uFF1F': '?', // ？
  '\uFF1B': ';', // ；
  '\uFF1A': ':', // ：
  '\u3001': ',', // 、
};

/**
 * Match result containing start and end positions in the original content
 */
export interface TextMatchResult {
  startIndex: number;
  endIndex: number;
}

/**
 * Options for text matching operations
 */
export interface TextMatchOptions {
  /** Whether to use exact matching as fallback (default: true) */
  exactFallback?: boolean;
  /** Custom pattern for characters to skip during normalization */
  skipPattern?: RegExp;
}

/**
 * Normalizes a string for fuzzy matching by:
 * - Removing all whitespace
 * - Removing Markdown characters (#, *, |)
 * - Converting Chinese punctuation to ASCII equivalents
 *
 * @param str - The string to normalize
 * @returns The normalized string
 */
export function normalizeForMatching(str: string): string {
  return str
    .replace(/\s+/g, '') // Remove ALL whitespace
    .replace(/[#*|]/g, '') // Remove Markdown characters
    .replace(/[\uFF0C\u3002\uFF01\uFF1F\uFF1B\uFF1A\u3001]/g, (m) => {
      return CHINESE_PUNCTUATION_MAP[m] || m;
    });
}

/**
 * Finds the original position in content given a normalized index.
 * This function maps from a position in the normalized (stripped) string
 * back to the corresponding position in the original content.
 *
 * @param content - The original content string
 * @param normalizedIdx - The index in the normalized string
 * @param skipPattern - Optional custom pattern for skipped characters (default: TEXT_SKIP_CHARS_PATTERN)
 * @returns The corresponding index in the original content, or -1 if not found
 */
export function findOriginalPosition(
  content: string,
  normalizedIdx: number,
  skipPattern: RegExp = TEXT_SKIP_CHARS_PATTERN
): number {
  let normalizedCharCount = 0;
  for (let i = 0; i < content.length; i++) {
    // Skip the same characters that were stripped in normalizeForMatching
    if (!skipPattern.test(content[i])) {
      if (normalizedCharCount === normalizedIdx) {
        return i;
      }
      normalizedCharCount++;
    }
  }
  return -1;
}

/**
 * Calculates the end position in original content after matching a normalized string.
 *
 * @param content - The original content string
 * @param startPos - The starting position in the original content
 * @param normalizedLength - The length of the normalized matched string
 * @param skipPattern - Optional custom pattern for skipped characters
 * @returns The end index (exclusive) in the original content, or -1 if not found
 */
export function calculateEndPosition(
  content: string,
  startPos: number,
  normalizedLength: number,
  skipPattern: RegExp = TEXT_SKIP_CHARS_PATTERN
): number {
  let normalizedMatched = 0;
  for (let i = startPos; i < content.length && normalizedMatched < normalizedLength; i++) {
    if (!skipPattern.test(content[i])) {
      normalizedMatched++;
    }
    if (normalizedMatched >= normalizedLength) {
      return i + 1;
    }
  }
  return -1;
}

/**
 * Finds the position of a quote within content using normalized matching.
 * Supports quotes with ellipsis (...) that indicate omitted sections.
 *
 * @param content - The full content to search in
 * @param quote - The quote to find (may contain ... for omitted sections)
 * @param options - Optional matching options
 * @returns TextMatchResult with start and end indices, or null if not found
 */
export function findQuoteInContent(
  content: string,
  quote: string,
  options: TextMatchOptions = {}
): TextMatchResult | null {
  const { exactFallback = true, skipPattern = TEXT_SKIP_CHARS_PATTERN } = options;

  let trimmedQuote = quote.trim();

  // Strip leading and trailing ellipsis or dots (sequence of 2 or more dots) to avoid matching issues
  // often AI generates "..." at the end to indicate continuation
  // We handle both standard "..." and the unicode ellipsis "…"
  const ellipsisRegex = /^(\.{2,}|…)\s*|\s*(\.{2,}|…)$/g;
  while (ellipsisRegex.test(trimmedQuote)) {
    trimmedQuote = trimmedQuote.replace(ellipsisRegex, '');
  }
  trimmedQuote = trimmedQuote.trim();
  const normalizedContent = normalizeForMatching(content);

  // Handle ellipsis in quotes - find start and end positions
  const hasEllipsis = trimmedQuote.includes('...');

  if (hasEllipsis) {
    // Split by ellipsis and filter out short segments
    const quoteSegments = trimmedQuote
      .split('...')
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    if (quoteSegments.length >= 2) {
      const firstSegment = quoteSegments[0];
      const lastSegment = quoteSegments[quoteSegments.length - 1];

      const normalizedFirst = normalizeForMatching(firstSegment);
      const normalizedLast = normalizeForMatching(lastSegment);

      // Find first segment position
      const firstNormalizedIdx = normalizedContent.indexOf(normalizedFirst);
      if (firstNormalizedIdx === -1) {
        return exactFallback ? findExactMatch(content, trimmedQuote) : null;
      }

      const startIndex = findOriginalPosition(content, firstNormalizedIdx, skipPattern);
      if (startIndex === -1) {
        return exactFallback ? findExactMatch(content, trimmedQuote) : null;
      }

      // Find last segment position
      const lastNormalizedIdx = normalizedContent.indexOf(
        normalizedLast,
        firstNormalizedIdx + normalizedFirst.length
      );
      if (lastNormalizedIdx === -1) {
        return exactFallback ? findExactMatch(content, trimmedQuote) : null;
      }

      const lastStartPos = findOriginalPosition(content, lastNormalizedIdx, skipPattern);
      if (lastStartPos === -1) {
        return exactFallback ? findExactMatch(content, trimmedQuote) : null;
      }

      const endIndex = calculateEndPosition(content, lastStartPos, normalizedLast.length, skipPattern);
      if (endIndex === -1) {
        return exactFallback ? findExactMatch(content, trimmedQuote) : null;
      }

      return { startIndex, endIndex };
    }
  }

  // No ellipsis or insufficient segments, find single quote
  const normalizedQuote = normalizeForMatching(trimmedQuote);
  const normalizedIdx = normalizedContent.indexOf(normalizedQuote);

  if (normalizedIdx !== -1) {
    const startIndex = findOriginalPosition(content, normalizedIdx, skipPattern);
    if (startIndex !== -1) {
      const endIndex = calculateEndPosition(content, startIndex, normalizedQuote.length, skipPattern);
      if (endIndex !== -1) {
        return { startIndex, endIndex };
      }
    }
  }

  // Fallback: exact match
  if (exactFallback) {
    return findExactMatch(content, trimmedQuote);
  }

  return null;
}

/**
 * Performs an exact string match to find a quote in content.
 *
 * @param content - The content to search in
 * @param quote - The quote to find
 * @returns TextMatchResult with start and end indices, or null if not found
 */
export function findExactMatch(content: string, quote: string): TextMatchResult | null {
  const startIndex = content.indexOf(quote);
  if (startIndex !== -1) {
    return {
      startIndex,
      endIndex: startIndex + quote.length,
    };
  }
  return null;
}

/**
 * Finds all occurrences of a search query in content.
 *
 * @param content - The content to search in
 * @param query - The search query (case-insensitive)
 * @returns Array of TextMatchResult with all match positions
 */
export function findAllMatches(content: string, query: string): TextMatchResult[] {
  if (!query.trim()) {
    return [];
  }

  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matches: TextMatchResult[] = [];

  let pos = lowerContent.indexOf(lowerQuery);
  while (pos !== -1) {
    matches.push({
      startIndex: pos,
      endIndex: pos + query.length,
    });
    pos = lowerContent.indexOf(lowerQuery, pos + 1);
  }

  return matches;
}
