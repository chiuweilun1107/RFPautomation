import type { SourceMetadata } from '@/types';

export interface Source {
    id: string;
    title: string;
    source_type?: string;
    project_id?: string;
    metadata?: SourceMetadata;
    origin_url?: string;
    type?: string;
    content?: string;
    summary?: string;
    topics?: string[];
    pages?: unknown;
    images?: unknown;
    status?: string;
    created_at?: string;
}

export type SourceCategory = 'internal' | 'external' | 'tender';

export const getSourceType = (source: Source): SourceCategory => {
    // Direct mapping from source_type field
    if (source.source_type === 'tender') return 'tender';
    if (source.source_type === 'internal') return 'internal';
    if (source.source_type === 'external') return 'external';

    // Fallback for legacy data (upload/url/search/rfp)
    const isTender =
        (source.origin_url && source.origin_url.includes('web.pcc.gov.tw')) ||
        (source.title && source.title.includes('招標')) ||
        (source.source_type === 'rfp');

    if (isTender) {
        return 'tender';
    } else if (!source.project_id) {
        return 'internal';
    } else {
        return 'external';
    }
};

export const getSourceTypeLabel = (type: SourceCategory) => {
    switch (type) {
        case 'internal': return '內部知識';
        case 'tender': return '標案文件';
        case 'external': return '外部知識庫';
        default: return '未知';
    }
};
