/**
 * Font Mappings Configuration
 *
 * Centralized font family definitions for cross-platform compatibility.
 * Used by TableOfContentsGenerator and other editor components.
 */

/**
 * Font family fallback chains for common fonts
 * Maps font names to their CSS font-family values with appropriate fallbacks
 */
export const FONT_MAP: Record<string, string> = {
  // Traditional Chinese fonts (Kai style)
  '標楷體': '"BiauKai TC", "BiauKai HK", "標楷體-繁", "標楷體-港澳", "Kaiti TC", STKaiti, DFKai-SB, KaiTi, serif',
  'DFKai-SB': 'DFKai-SB, "BiauKai TC", "BiauKai HK", "標楷體-繁", "Kaiti TC", STKaiti, KaiTi, serif',
  'BiauKai': '"BiauKai TC", "BiauKai HK", "標楷體-繁", DFKai-SB, STKaiti, serif',
  'BiauKaiTC': '"BiauKai TC", BiauKaiTC, "標楷體-繁", DFKai-SB, STKaiti, serif',
  'BiauKaiHK': '"BiauKai HK", BiauKaiHK, "標楷體-港澳", DFKai-SB, STKaiti, serif',
  '楷體': '"Kaiti TC", "Kaiti SC", STKaiti, KaiTi, "楷體-繁", DFKai-SB, serif',
  'KaiTi': '"Kaiti TC", "Kaiti SC", STKaiti, KaiTi, "楷體-繁", DFKai-SB, serif',

  // Traditional Chinese fonts (Ming style)
  '新細明體': 'PMingLiU, MingLiU, "Apple LiSung", "PingFang TC", serif',

  // Traditional Chinese fonts (Gothic/Sans-serif style)
  '微軟正黑體': '"Microsoft JhengHei", "PingFang TC", "Heiti TC", "Noto Sans TC", sans-serif',

  // Western fonts
  'Times New Roman': '"Times New Roman", Times, Georgia, serif',
  'Arial': 'Arial, Helvetica, "PingFang TC", sans-serif',
  'Calibri': 'Calibri, "Helvetica Neue", Arial, sans-serif',
  'Verdana': 'Verdana, Geneva, Arial, sans-serif',
}

/**
 * Default font family when no font is specified
 */
export const DEFAULT_FONT_FAMILY = 'serif'

/**
 * Get a CSS font-family string for given font names
 *
 * @param fontName - Primary font name (typically for Western text)
 * @param cjkFontName - CJK font name (for Chinese/Japanese/Korean text)
 * @returns CSS font-family value with appropriate fallbacks
 *
 * @example
 * // Single font
 * getFontFamily('標楷體')
 * // => '"BiauKai TC", "BiauKai HK", "標楷體-繁", ..., serif'
 *
 * @example
 * // Mixed fonts (Western + CJK)
 * getFontFamily('Times New Roman', '標楷體')
 * // => '"Times New Roman", Times, Georgia, serif, "BiauKai TC", ..., serif'
 */
export function getFontFamily(fontName?: string, cjkFontName?: string): string {
  const families: string[] = []

  if (fontName) {
    families.push(FONT_MAP[fontName] || `"${fontName}"`)
  }

  if (cjkFontName) {
    families.push(FONT_MAP[cjkFontName] || `"${cjkFontName}"`)
  }

  if (families.length === 0) {
    return DEFAULT_FONT_FAMILY
  }

  return families.join(', ')
}

/**
 * Type for alignment values from Word documents
 */
export type AlignmentValue =
  | 'left' | 'center' | 'right' | 'both'
  | 'LEFT' | 'CENTER' | 'RIGHT' | 'BOTH' | 'DISTRIBUTE'

/**
 * Alignment mapping from Word values to CSS text-align
 */
export const ALIGNMENT_MAP: Record<string, string> = {
  left: 'left',
  center: 'center',
  right: 'right',
  both: 'justify',
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
  BOTH: 'justify',
  DISTRIBUTE: 'justify',
}

/**
 * Get CSS text-align value from Word alignment
 *
 * @param alignment - Word alignment value
 * @param defaultAlign - Default alignment if not found (default: 'left')
 * @returns CSS text-align value
 */
export function getTextAlign(alignment?: string, defaultAlign: string = 'left'): string {
  if (!alignment) return defaultAlign
  return ALIGNMENT_MAP[alignment] || ALIGNMENT_MAP[alignment.toLowerCase()] || defaultAlign
}
