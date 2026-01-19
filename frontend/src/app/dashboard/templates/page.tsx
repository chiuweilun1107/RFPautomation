"use client"

import * as React from "react"
import type { Template } from "@/types"
import dynamic from "next/dynamic"
import { createClient } from "@/lib/supabase/client"
import { Search } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Lazy load heavy components
const TemplateFolderList = dynamic(
    () => import("@/components/templates/TemplateFolderList").then((mod) => ({ default: mod.TemplateFolderList })),
    {
        loading: () => <div className="h-24"><Skeleton className="h-24 rounded-lg" /></div>,
        ssr: false
    }
)

const TemplateList = dynamic(
    () => import("@/components/templates/TemplateList").then((mod) => ({ default: mod.TemplateList })),
    {
        loading: () => <LoadingSpinner text="載入範本列表..." />,
        ssr: false
    }
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
    const [isCreateFolderOpen, setIsCreateFolderOpen] = React.useState(false)
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

    if (loading) {
        return (
            <div className="space-y-8">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-gray-200/50 dark:border-white/5">
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-5 w-96" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-64 rounded-[4px]" />
                        <Skeleton className="h-10 w-28 rounded-[4px]" />
                    </div>
                </div>

                {/* Folders Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-6 w-20" />
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-24 rounded-lg" />
                        ))}
                    </div>
                </div>

                {/* Templates Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-6 w-24" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-gray-200/50 dark:border-white/5">
                <div className="space-y-1">
                    <h1 className="text-3xl font-serif font-bold text-[#00063D] dark:text-white tracking-tight">
                        範本庫
                    </h1>
                    <p className="text-base text-gray-500 dark:text-gray-400 max-w-2xl font-medium">
                        管理 Word 範本檔案，用於生成格式一致的投標文件。
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="搜尋範本..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-zinc-700 rounded-[4px] bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#FA4028] focus:border-transparent"
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
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#00063D] dark:text-white">
                    資料夾
                </h2>
                <TemplateFolderList
                    folders={folders}
                    onFolderSelect={handleFolderSelect}
                    selectedFolderId={selectedFolderId}
                    onFolderUpdate={handleFolderUpdate}
                    onCreateFolderClick={() => setIsCreateFolderOpen(true)}
                />
            </div>

            {/* Templates Section */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#00063D] dark:text-white">
                    {selectedFolderId === "all"
                        ? '所有範本'
                        : selectedFolderId
                        ? folders.find(f => f.id === selectedFolderId)?.name || '資料夾範本'
                        : '所有範本'
                    }
                    {searchQuery && ` (${filteredTemplates.length} 個結果)`}
                </h2>
                <TemplateList
                    templates={filteredTemplates}
                    folders={folders}
                    onTemplateUpdate={handleTemplateUpdate}
                />
            </div>
        </div>
    )
}

