// 範本編輯器類型定義

// 區塊類型
export type BlockType = 'paragraph' | 'table' | 'section' | 'pageBreak'

// 編輯器區塊
export interface EditorBlock {
    id: string
    type: BlockType
    sourceIndex: number  // 對應解析結果中的索引
    visible: boolean
    order: number
    // 原始資料參考
    data: ParagraphData | TableData | SectionData | null
}

// 段落資料
export interface ParagraphData {
    text: string
    styleName?: string
    format?: {
        alignment?: string
        fontSize?: number
        fontFamily?: string
        bold?: boolean
        italic?: boolean
        color?: string
    }
}

// 表格資料
export interface TableData {
    rows: number
    columns: number
    cells?: TableCell[]
    columnWidths?: number[]
}

export interface TableCell {
    row: number
    col: number
    text: string
    format?: {
        colSpan?: number
        vMerge?: string
        hAlign?: string
        vAlign?: string
        bgColor?: string
    }
}

// 節資料
export interface SectionData {
    type: string
    pageSize?: {
        width: number
        height: number
        orientation?: string
    }
    margins?: {
        top: number
        bottom: number
        left: number
        right: number
    }
}

// 變數綁定
export interface VariableBinding {
    source: 'project' | 'manual' | 'system'
    field: string
    defaultValue?: string
}

// 編輯器狀態
export interface EditorState {
    blocks: EditorBlock[]
    selectedBlockId: string | null
    variables: Record<string, VariableBinding>
    isDirty: boolean
}

// 儲存的映射規則
export interface MappingRules {
    version: number
    blocks: {
        id: string
        type: BlockType
        sourceIndex: number
        visible: boolean
        order: number
    }[]
    variables: Record<string, VariableBinding>
    updatedAt: string
}

// 元件庫項目
export interface LibraryItem {
    id: string
    type: BlockType
    label: string
    preview: string
    sourceIndex: number
    data: ParagraphData | TableData | SectionData | null
}

// 編輯器 Props
export interface TemplateEditorProps {
    templateId: string
    templateName: string
    paragraphs: ParagraphData[]
    tables: TableData[]
    sections?: SectionData[]
    pageBreaks?: { type: string; paragraphIndex: number }[]
    mappingRules?: MappingRules | null
    onSave: (rules: MappingRules) => Promise<void>
}

// 元件庫 Props
export interface ComponentLibraryProps {
    paragraphs: ParagraphData[]
    tables: TableData[]
    sections?: SectionData[]
    onAddBlock: (type: BlockType, sourceIndex: number) => void
}

// 文件畫布 Props
export interface DocumentCanvasProps {
    blocks: EditorBlock[]
    selectedBlockId: string | null
    onSelectBlock: (id: string | null) => void
    onDeleteBlock: (id: string) => void
    onReorderBlocks: (blocks: EditorBlock[]) => void
}

// 屬性面板 Props
export interface PropertiesPanelProps {
    block: EditorBlock | null
    variables: Record<string, VariableBinding>
    onUpdateVariable: (name: string, binding: VariableBinding) => void
}

