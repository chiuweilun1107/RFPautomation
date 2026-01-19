export function getStyleNameCN(name: string): string {
    if (!name) return '無樣式'

    const mapping: Record<string, string> = {
        'Normal': '內文 (Normal)',
        'Default Paragraph Font': '預設字體',
        'Normal Table': '一般表格',
        'No List': '無清單',
        'Table Grid': '表格格線',
        'Heading 1': '標題 1',
        'Heading 2': '標題 2',
        'Heading 3': '標題 3',
        'Title': '標題',
        'Subtitle': '副標題',
        'Strong': '粗體',
        'Emphasis': '強調',
        'List Paragraph': '清單段落'
    }

    // 直接比對
    if (mapping[name]) {
        return mapping[name]
    }

    // 處理標題 Heading 1-9
    const headingMatch = name.match(/^Heading (\d+)$/)
    if (headingMatch) {
        return `標題 ${headingMatch[1]}`
    }

    return name
}
