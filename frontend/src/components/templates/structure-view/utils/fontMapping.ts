/**
 * 統一的字體映射函數
 * 將 Word 字體名稱映射到 Web 安全字體堆疊
 */
export function getFontFamily(fontName: string): string {
    const fontMap: Record<string, string> = {
        '標楷體': '"BiauKai TC", "BiauKai HK", "標楷體-繁", "標楷體-港澳", "Kaiti TC", STKaiti, DFKai-SB, KaiTi, serif',
        'DFKai-SB': 'DFKai-SB, "BiauKai TC", "BiauKai HK", "標楷體-繁", "Kaiti TC", STKaiti, KaiTi, serif',
        'BiauKai': '"BiauKai TC", "BiauKai HK", "標楷體-繁", DFKai-SB, STKaiti, serif',
        'BiauKaiTC': '"BiauKai TC", BiauKaiTC, "標楷體-繁", DFKai-SB, STKaiti, serif',
        'BiauKaiHK': '"BiauKai HK", BiauKaiHK, "標楷體-港澳", DFKai-SB, STKaiti, serif',
        '楷體': '"Kaiti TC", "Kaiti SC", STKaiti, KaiTi, "楷體-繁", DFKai-SB, serif',
        'KaiTi': '"Kaiti TC", "Kaiti SC", STKaiti, KaiTi, "楷體-繁", DFKai-SB, serif',
        '新細明體': 'PMingLiU, MingLiU, "Apple LiSung", "PingFang TC", serif',
        '微軟正黑體': '"Microsoft JhengHei", "PingFang TC", "Heiti TC", "Noto Sans TC", sans-serif',
        'Times New Roman': '"Times New Roman", Times, Georgia, serif',
        'Arial': 'Arial, Helvetica, "PingFang TC", sans-serif',
        'Calibri': 'Calibri, "Helvetica Neue", Arial, sans-serif',
        'Verdana': 'Verdana, Geneva, Arial, sans-serif'
    }

    return fontMap[fontName] || `"${fontName}", sans-serif`
}
