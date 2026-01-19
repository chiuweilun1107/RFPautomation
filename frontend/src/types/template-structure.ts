// 範本結構解析的完整型別定義

// ==================== 邊框樣式 ====================
export interface BorderStyle {
    style?: string
    width?: number
    color?: string
}

export interface BordersFormat {
    top?: BorderStyle
    bottom?: BorderStyle
    left?: BorderStyle
    right?: BorderStyle
    insideH?: BorderStyle  // 表格內部水平線
    insideV?: BorderStyle  // 表格內部垂直線
}

// ==================== Run 格式 ====================
export interface RunFormat {
    font?: string
    size?: number
    color?: string
    bold?: boolean
    italic?: boolean
    underline?: string | boolean
    strike?: boolean
    vertAlign?: string  // superscript, subscript
    // === 新增 ===
    hasPageBreak?: boolean
    hasColumnBreak?: boolean
    hasLineBreak?: boolean
    hasImage?: boolean
    image?: {
        type: 'inline' | 'anchor'
        width?: number  // inches
        height?: number
    }
}

// ==================== 段落格式 ====================
export interface ParagraphFormat {
    alignment?: string  // left, center, right, both (justify)
    indentation?: {
        left: number
        right: number
        firstLine: number
        hanging?: number
    }
    spacing?: {
        before: number
        after: number
        line: number
        lineRule: string  // auto, exact, atLeast
    }
    outlineLevel?: number
    // === 新增 ===
    borders?: BordersFormat
    shading?: {
        fill?: string
        color?: string
        pattern?: string
    }
    pageBreakBefore?: boolean
    keepLines?: boolean      // 段落內不分頁
    keepNext?: boolean       // 與下段同頁
    widowControl?: boolean   // 寡行/孤行控制
    sectionBreak?: string    // nextPage, continuous, evenPage, oddPage
}

// ==================== 書籤和超連結 ====================
export interface Bookmark {
    id: string
    name: string
}

export interface Hyperlink {
    id?: string
    anchor?: string
    text: string
}

// ==================== 樣式定義 ====================
export interface StyleInfo {
    id: string
    name: string
    type: string
    basedOn?: string | null
    font?: {
        ascii?: string
        eastAsia?: string
        hAnsi?: string
        size?: number
        color?: string
        bold?: boolean
        italic?: boolean
        underline?: string
    }
    paragraph?: {
        alignment?: string
        indentation?: {
            left: number
            right: number
            firstLine: number
            hanging: number
        }
        spacing?: {
            before: number
            after: number
            line: number
            lineRule: string
        }
        outlineLevel?: number
    }
}

// ==================== 段落資訊 ====================
export interface ParagraphInfo {
    id?: string           // Optional unique identifier
    index: number
    text: string
    fullText?: string
    style?: string
    format?: ParagraphFormat
    runs?: Array<{
        text: string
        format: RunFormat
    }>
    // === 新增 ===
    bookmarks?: Bookmark[]
    hyperlinks?: Hyperlink[]
}

// ==================== 儲存格格式 ====================
export interface CellFormat {
    width?: string | number
    vAlign?: string           // top, center, bottom
    hAlign?: string           // left, center, right, both
    backgroundColor?: string
    // === 新增：合併儲存格 ===
    colSpan?: number          // 水平合併
    vMerge?: 'start' | 'continue'  // 垂直合併
    borders?: BordersFormat
}

export interface TableCell {
    row: number
    col: number
    text: string
    runs?: Array<{
        text: string
        format: RunFormat
    }>
    format?: CellFormat
}

// ==================== 表格行格式 ====================
export interface RowFormat {
    isHeader?: boolean        // 表頭行（重複於每頁）
    height?: {
        value: number | null
        rule: string          // exact, atLeast, auto
    }
    cantSplit?: boolean       // 不允許跨頁分割
    alignment?: string
}

// ==================== 表格格式 ====================
export interface TableFormat {
    style?: string
    width?: { value: string | number; type: string }
    alignment?: string        // left, center, right
    // === 新增 ===
    borders?: BordersFormat
    cellMargins?: {
        top?: number
        bottom?: number
        left?: number
        right?: number
    }
    indent?: number
    layout?: 'fixed' | 'autofit'
}

export interface TableInfo {
    index: number
    rows: number
    cols: number
    format?: TableFormat
    cells?: TableCell[]
    // === 新增 ===
    columnWidths?: number[]   // 每欄寬度 (pt)
    rowFormats?: RowFormat[]  // 每行格式
}

// ==================== 節（Section）屬性 ====================
export interface SectionInfo {
    type?: string             // nextPage, continuous, evenPage, oddPage
    isDocumentLevel?: boolean
    endParagraphIndex?: number
    pageSize?: {
        width: number
        height: number
        orientation: 'portrait' | 'landscape'
    }
    margins?: {
        top: number
        bottom: number
        left: number
        right: number
        header: number
        footer: number
        gutter: number
    }
    columns?: {
        num: number
        space: number
        equalWidth: boolean
    }
    headers?: Array<{ type: string; id: string }>
    footers?: Array<{ type: string; id: string }>
    lineNumbers?: {
        countBy: number
        start: number
        restart: string
    }
    pageNumbers?: {
        format: string
        start: number
    }
}

// ==================== 換頁資訊 ====================
export interface PageBreakInfo {
    type: 'before' | 'inline'
    paragraphIndex: number
}

// ==================== 完整範本結構 ====================
export interface TemplateStructure {
    styles?: StyleInfo[]
    paragraphs?: ParagraphInfo[]
    parsed_tables?: TableInfo[]
    // === 新增 ===
    sections?: SectionInfo[]
    pageBreaks?: PageBreakInfo[]
    template_version?: string
    engine?: string
}

