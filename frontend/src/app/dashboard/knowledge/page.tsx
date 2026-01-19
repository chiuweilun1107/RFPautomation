import { createClient } from "@/lib/supabase/server"
import { UploadResourcesDialog } from "@/components/knowledge/UploadResourcesDialog"
import { KnowledgeList } from "@/components/knowledge/KnowledgeList"
import { LayoutGrid } from "lucide-react"
import Link from "next/link"

export default async function KnowledgePage() {
    const supabase = await createClient()

    const { data: docs } = await supabase
        .from('sources')
        .select('*')
        .is('project_id', null) // Filter for global knowledge only (no specific project)
        .order('created_at', { ascending: false })

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
                        WORKSPACE_ID: 104-92-3 // SYSTEM_SYNC: ONLINE
                    </p>
                </div>
                <UploadResourcesDialog />
            </div>

            {/* Main Content */}
            <div className="space-y-12">
                {/* List Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-2">
                        <h2 className="text-sm font-black uppercase tracking-widest font-mono">
                            [ 01 ] Document_Repository
                        </h2>
                    </div>
                    <KnowledgeList initialDocs={docs || []} />
                </div>
            </div>
        </div>
    )
}
