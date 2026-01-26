import type {
    StyleInfo,
    ParagraphInfo,
    TableInfo,
    SectionInfo,
    PageBreakInfo
} from "@/types/template-structure"

export interface StructureViewProps {
    styles?: StyleInfo[]
    paragraphs?: ParagraphInfo[]
    tables?: TableInfo[]
    sections?: SectionInfo[]
    pageBreaks?: PageBreakInfo[]
    engine?: string
    version?: string
}

export interface StyleCardProps {
    style: StyleInfo
}

export interface ParagraphCardProps {
    paragraph: ParagraphInfo
}

export interface TableCardProps {
    table: TableInfo
}

export interface SectionCardProps {
    section: SectionInfo
    index: number
}

export interface StatsPanelProps {
    styles?: StyleInfo[]
    paragraphs?: ParagraphInfo[]
    tables?: TableInfo[]
    sections?: SectionInfo[]
    pageBreaks?: PageBreakInfo[]
    engine?: string
    version?: string
}

export interface PageBreaksPanelProps {
    pageBreaks: PageBreakInfo[]
}
