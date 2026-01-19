"use client"

import * as React from "react"
import type { Template } from "@/types"
import dynamic from "next/dynamic"
import { createClient } from "@/lib/supabase/client"
import { Search, LayoutGrid, List as ListIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SwissPagination } from "@/components/ui/SwissPagination"

// Lazy load heavy components
const TemplateFolderList = dynamic(
    () => import("@/components/templates/TemplateFolderList").then((mod) => ({ default: mod.TemplateFolderList })),
    { ssr: false }
)

const TemplateList = dynamic(
    () => import("@/components/templates/TemplateList").then((mod) => ({ default: mod.TemplateList })),
    { ssr: false }
)

const CreateTemplateFolderDialog = dynamic(
    () => import("@/components/templates/CreateTemplateFolderDialog").then((mod) => ({ default: mod.CreateTemplateFolderDialog })),
    {
        ssr: false
    }
)

interface TemplateFolder {
    id: string
    name: string
    description: string | null
    created_at: string
    updated_at: string
}



export default function TemplatesPage() {
    const [folders, setFolders] = React.useState<TemplateFolder[]>([])
    const [templates, setTemplates] = React.useState<Template[]>([])
    const [loading, setLoading] = React.useState(true)
    const [selectedFolderId, setSelectedFolderId] = React.useState<string | null | "all">("all")
    const [searchQuery, setSearchQuery] = React.useState("")
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
    const [isCreateFolderOpen, setIsCreateFolderOpen] = React.useState(false)
    const [currentPage, setCurrentPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(12)
    const supabase = createClient()

    const fetchData = React.useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true)
            }

            // Fetch folders
            const { data: foldersData } = await supabase
                .from('template_folders')
                .select('*')
                .order('created_at', { ascending: false })

            // Fetch templates
            const { data: templatesData } = await supabase
                .from('templates')
                .select('*')
                .order('created_at', { ascending: false })

            if (foldersData) setFolders(foldersData)
            if (templatesData) setTemplates(templatesData)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            if (showLoading) {
                setLoading(false)
            }
        }
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleFolderSelect = (folderId: string | null | "all") => {
        setSelectedFolderId(folderId)
        setCurrentPage(1)
    }

    const handleFolderUpdate = () => {
        fetchData(false)
    }

    const handleTemplateUpdate = () => {
        fetchData(false)
    }

    const filteredTemplates = React.useMemo(() => {
        let result = templates

        // Filter by folder
        if (selectedFolderId && selectedFolderId !== "all") {
            result = result.filter(t => t.folder_id === selectedFolderId)
        }
        // 如果是 "all",不過濾,顯示所有範本

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(template =>
                template.name.toLowerCase().includes(query) ||
                template.category?.toLowerCase().includes(query) ||
                template.description?.toLowerCase().includes(query)
            )
        }

        return result
    }, [templates, selectedFolderId, searchQuery])

    const { paginatedTemplates, totalPages } = React.useMemo(() => {
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        return {
            paginatedTemplates: filteredTemplates.slice(start, end),
            totalPages: Math.ceil(filteredTemplates.length / pageSize)
        }
    }, [filteredTemplates, currentPage, pageSize])

    React.useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-black dark:border-white">
                    <div className="space-y-2">
                        <div className="h-6 w-32 bg-black/10" />
                        <div className="h-4 w-96 bg-black/5" />
                    </div>
                    <div className="h-10 w-64 bg-black/5" />
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[300px] border border-black dark:border-white bg-black/5" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto space-y-8 pb-12">
            {/* Breadcrumbs - Swiss Style */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">
                <Link href="/" className="hover:text-[#FA4028] transition-colors">HOME</Link>
                <span>/</span>
                <Link href="/dashboard" className="hover:text-[#FA4028] transition-colors">DASHBOARD</Link>
                <span>/</span>
                <span className="text-[#FA4028]">TEMPLATES_POOL</span>
            </nav>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-black dark:border-white pb-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight font-mono uppercase">Templates_Pool</h2>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                        WORKSPACE_ID: 104-92-3 // ACCESS: VERIFIED
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative w-full md:w-[320px] group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-[#FA4028]" />
                        <input
                            type="text"
                            placeholder="SEARCH_TEMPLATES..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 bg-background border border-black dark:border-white rounded-none font-mono text-xs focus:outline-none focus:border-[#FA4028] transition-colors h-10"
                        />
                    </div>
                    <CreateTemplateFolderDialog
                        open={isCreateFolderOpen}
                        onOpenChange={setIsCreateFolderOpen}
                        onFolderCreated={handleFolderUpdate}
                    />
                </div>
            </div>

            {/* Folders Section */}
            <div className="space-y-6">
                <div className="space-y-1">
                    <h2 className="text-sm font-black uppercase tracking-widest text-[#00063D] dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500"></span>
                        Template_Directories
                    </h2>
                    <p className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400">
                        FOLDER_STRUCTURE: // 組織您的文件範本庫
                    </p>
                </div>
                <TemplateFolderList
                    folders={folders}
                    onFolderSelect={handleFolderSelect}
                    selectedFolderId={selectedFolderId}
                    onFolderUpdate={handleFolderUpdate}
                    onCreateFolderClick={() => setIsCreateFolderOpen(true)}
                    viewMode={viewMode}
                />
            </div>

            {/* Templates Section */}
            <div className="space-y-6 mt-12">
                <div className="space-y-1">
                    <h2 className="text-sm font-black uppercase tracking-widest text-[#00063D] dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500"></span>
                        {selectedFolderId === "all"
                            ? 'Global_Resources'
                            : (folders.find(f => f.id === selectedFolderId)?.name || 'Folder_Content').toUpperCase()
                        }
                    </h2>
                    <p className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400">
                        RESOURCE_INDEX: // 選取或管理具體範本內容
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
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                            TEMPLATES_ACTIVE
                        </span>
                        <span className="text-xl font-black font-mono leading-none">
                            {String(filteredTemplates.length).padStart(2, '0')}
                        </span>
                    </div>
                </div>
                <TemplateList
                    templates={paginatedTemplates}
                    folders={folders}
                    onTemplateUpdate={handleTemplateUpdate}
                    viewMode={viewMode}
                />

                <SwissPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalCount={filteredTemplates.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                />
            </div>
        </div>
    )
}

