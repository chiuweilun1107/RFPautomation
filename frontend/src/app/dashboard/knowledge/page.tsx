"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { UploadResourcesDialog } from "@/components/knowledge/UploadResourcesDialog"
import { KnowledgeList } from "@/components/knowledge/KnowledgeList"
import { Search, LayoutGrid, List as ListIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SwissPagination } from "@/components/ui/SwissPagination"

export default function KnowledgePage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
    const [docs, setDocs] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(12);
    const supabase = createClient();

    const fetchDocs = React.useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('sources')
                .select('*')
                .is('project_id', null)
                .order('created_at', { ascending: false });
            setDocs(data || []);
        } catch (error) {
            console.error('Error fetching docs:', error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    React.useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    const filteredDocs = React.useMemo(() => {
        if (!searchQuery) return docs;
        const query = searchQuery.toLowerCase();
        return docs.filter(doc =>
            doc.title?.toLowerCase().includes(query) ||
            doc.type?.toLowerCase().includes(query)
        );
    }, [docs, searchQuery]);

    const { paginatedDocs, totalPages } = React.useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return {
            paginatedDocs: filteredDocs.slice(start, end),
            totalPages: Math.ceil(filteredDocs.length / pageSize)
        };
    }, [filteredDocs, currentPage, pageSize]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    return (
        <div className="container mx-auto space-y-8 pb-12">
            {/* Breadcrumbs - Swiss Style */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">
                <Link href="/" className="hover:text-[#FA4028] transition-colors">HOME</Link>
                <span>/</span>
                <Link href="/dashboard" className="hover:text-[#FA4028] transition-colors">DASHBOARD</Link>
                <span>/</span>
                <span className="text-[#FA4028]">KNOWLEDGE_VAULT</span>
            </nav>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-black dark:border-white pb-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight font-mono uppercase">Knowledge_Base</h2>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                        WORKSPACE_ID: 104-92-3 // ACCESS: VERIFIED
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative w-full md:w-[320px] group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-[#FA4028]" />
                        <input
                            type="text"
                            placeholder="SEARCH_KNOWLEDGE..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 bg-background border border-black dark:border-white rounded-none font-mono text-xs focus:outline-none focus:border-[#FA4028] transition-colors h-10"
                        />
                    </div>
                    <UploadResourcesDialog onUploadComplete={fetchDocs} />
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-12">
                {/* List Section */}
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#00063D] dark:text-white flex items-center gap-2">
                            <span className="w-2 h-2 bg-teal-500"></span>
                            Document_Repository
                        </h2>
                        <p className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400">
                            VAULT_STORAGE: // 管理您的知識庫文件
                        </p>
                    </div>

                    {/* View Toggle - Exact same position as Project page (Left aligned row) */}
                    <div className="flex items-center justify-between">
                        <div className="flex border border-black dark:border-white h-10 p-1 bg-white dark:bg-black shrink-0">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "px-3 transition-colors flex items-center justify-center",
                                    viewMode === 'grid'
                                        ? "bg-black text-white dark:bg-white dark:text-black"
                                        : "hover:bg-muted text-muted-foreground"
                                )}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "px-3 transition-colors flex items-center justify-center",
                                    viewMode === 'list'
                                        ? "bg-black text-white dark:bg-white dark:text-black"
                                        : "hover:bg-muted text-muted-foreground"
                                )}
                            >
                                <ListIcon className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-teal-500">
                                FILES_ACTIVE
                            </span>
                            <span className="text-xl font-black font-mono leading-none">
                                {String(docs.length).padStart(2, '0')}
                            </span>
                        </div>
                    </div>
                    <KnowledgeList initialDocs={paginatedDocs} searchQuery={searchQuery} viewMode={viewMode} />
                    <SwissPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalCount={filteredDocs.length}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            </div>
        </div>
    )
}
