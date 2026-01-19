"use client"

import * as React from "react"
import type { Template } from "@/types"
import dynamic from "next/dynamic"
import { createClient } from "@/lib/supabase/client"
import { Search } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-black dark:border-white pb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tighter font-mono uppercase">Templates Library</h2>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                        Workspace_ID: 104-92-3 // RESOURCE_TYPE: .DOCX
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative w-full md:w-[320px] group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="SEARCH_RESOURCES..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 bg-background border border-black dark:border-white rounded-none font-mono text-xs focus:outline-none focus:border-[#FA4028] focus:bg-black/5 transition-colors h-10"
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
                <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-2">
                    <h2 className="text-sm font-black uppercase tracking-widest font-mono">
                        [ 01 ] Directories
                    </h2>
                </div>
                <TemplateFolderList
                    folders={folders}
                    onFolderSelect={handleFolderSelect}
                    selectedFolderId={selectedFolderId}
                    onFolderUpdate={handleFolderUpdate}
                    onCreateFolderClick={() => setIsCreateFolderOpen(true)}
                />
            </div>

            {/* Templates Section */}
            <div className="space-y-6 mt-12">
                <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-2">
                    <h2 className="text-sm font-black uppercase tracking-widest font-mono">
                        [ 02 ] {selectedFolderId === "all"
                            ? 'Global_Resources'
                            : folders.find(f => f.id === selectedFolderId)?.name || 'Folder_Content'
                        }
                    </h2>
                </div>
                <TemplateList
                    templates={filteredTemplates}
                    folders={folders}
                    onTemplateUpdate={handleTemplateUpdate}
                />
            </div>
        </div>
    )
}

