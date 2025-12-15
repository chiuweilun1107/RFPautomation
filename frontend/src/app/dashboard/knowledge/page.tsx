import { createClient } from "@/lib/supabase/server"
import { UploadZone } from "@/components/knowledge/UploadZone"
import { KnowledgeList } from "@/components/knowledge/KnowledgeList"
import { BookOpen, Sparkles } from "lucide-react"

export default async function KnowledgePage() {
    const supabase = await createClient()

    const { data: docs } = await supabase
        .from('knowledge_docs')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center">
                        <BookOpen className="mr-2 h-6 w-6 text-blue-600" />
                        Company Knowledge Base
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                        Upload company documents (PDF, Word) here. The AI will learn from these materials
                        to generate more accurate and personalized RFP responses.
                    </p>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Upload Section setup as 1/3 width on large screens if desired, but here we stack */}
                    <div className="md:col-span-3 space-y-6">
                        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
                            <h2 className="text-sm font-semibold mb-4 flex items-center">
                                <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
                                Add New Knowledge
                            </h2>
                            <UploadZone />
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold mb-4 text-gray-900 dark:text-gray-100">
                                Existing Documents
                            </h2>
                            <KnowledgeList initialDocs={docs || []} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
