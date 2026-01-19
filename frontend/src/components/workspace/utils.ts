
/**
 * Helper to parse task requirement text into title and body
 * Extracts content inside 【】 as title, or uses the first line/30 chars.
 */
export const parseTaskRequirement = (text: string) => {
    const titleMatch = text.match(/【(.*?)】/);
    if (titleMatch) {
        const title = titleMatch[1];
        const body = text.replace(titleMatch[0], '').trim();
        return { title, body };
    }
    // Fallback: use first line or first 30 chars as title
    const firstLine = text.split('\n')[0].trim();
    const title = firstLine.length > 40 ? firstLine.substring(0, 37) + '...' : firstLine;
    return { title, body: text };
};

/**
 * Helper for Chinese Numeral Parsing
 */
export function parseChineseNumber(str: string): number {
    const map: Record<string, number> = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
    };
    const match = str.match(/^([一二三四五六七八九十]+)[、\.\s]/);
    if (!match) return Infinity;

    const numStr = match[1];

    // Simple cases: 1-10
    if (numStr.length === 1) return map[numStr] || Infinity;

    // Teens: 十一 (11) to 十九 (19), and multiples like 二十 (20), 三十 (30)
    if (numStr.length === 2) {
        if (numStr[0] === '十') return 10 + (map[numStr[1]] || 0); // 11-19
        if (numStr[1] === '十') return (map[numStr[0]] || 1) * 10; // 20, 30...
    }

    // Compound: 二十一 (21)
    if (numStr.length === 3 && numStr[1] === '十') {
        return (map[numStr[0]] || 0) * 10 + (map[numStr[2]] || 0);
    }

    return Infinity;
}
