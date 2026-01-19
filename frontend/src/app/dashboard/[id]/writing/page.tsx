"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { createClient } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useRouter } from "next/navigation"

const SectionList = dynamic(
    () => import("@/components/editor/SectionList").then((mod) => ({ default: mod.SectionList })),
    { ssr: false }
)

export default function WritingPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const [projectId, setProjectId] = React.useState<string | null>(null)
    const [sections, setSections] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const supabase = createClient()

    React.useEffect(() => {
        params.then(({ id }) => setProjectId(id))
    }, [params])

    React.useEffect(() => {
        if (!projectId) return

        async function fetchData() {
            setLoading(true)
            try {
                // Fetch Sections
                const { data: sectionsData } = await supabase
                    .from('sections')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('order_index', { ascending: true })

                // Fetch tasks separately
                const { data: tasksData } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('project_id', projectId) // Assuming tasks have section_id, we filter by project and then map in memory or query specifically? 
                // Actually original code fetched all tasks for project. Safe to assume.

                // Group tasks by section_id
                const tasksBySection: Record<string, any[]> = {}
                const orphanTasks: any[] = []

                tasksData?.forEach((task: any) => {
                    if (task.section_id) {
                        if (!tasksBySection[task.section_id]) {
                            tasksBySection[task.section_id] = []
                        }
                        tasksBySection[task.section_id].push(task)
                    } else {
                        orphanTasks.push(task)
                    }
                })

                // Recursive function to build section tree
                const buildSectionTree = (parentId: string | null): any[] => {
                    const sections = sectionsData?.filter((s: any) => s.parent_id === parentId) || []

                    return sections.map((section: any) => ({
                        ...section,
                        content: section.title,
                        tasks: tasksBySection[section.id] || [],
                        children: buildSectionTree(section.id)
                    }))
                }

                const sectionsWithChildren = buildSectionTree(null)

                // If we have orphan tasks, add virtual root
                if (orphanTasks.length > 0) {
                    sectionsWithChildren.unshift({
                        id: 'virtual-root',
                        title: 'General Requirements',
                        content: 'General Requirements',
                        type: 'chapter',
                        children: [],
                        tasks: orphanTasks
                    })
                }

                setSections(sectionsWithChildren)
            } catch (error) {
                console.error('Error fetching sections:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [projectId, supabase])

    if (!projectId || loading) {
        return <LoadingSpinner size="lg" text="載入文章..." />
    }

    return (
        <div className="h-full w-full">
            <div className="flex w-full min-h-full gap-8 relative font-mono text-black dark:text-white pb-20">
                <div className="flex-1 px-8 md:px-12">
                    {/* Sticky Header Container */}
                    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-8 pb-4 mb-4 border-b border-black/5 dark:border-white/5">
                        <div className="flex flex-col items-center">
                            <div className="relative inline-flex items-center">
                                {/* Back Navigation Arrow */}
                                <div className="absolute -left-20 top-1/2 -translate-y-1/2">
                                    <button
                                        onClick={() => router.push(`/dashboard/${projectId}/planning`)}
                                        className="group relative w-12 h-12 border-2 border-black dark:border-white bg-white dark:bg-black transition-all hover:translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] active:shadow-none flex items-center justify-center overflow-hidden"
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="w-6 h-6 fill-none stroke-black dark:stroke-white stroke-[3] transition-transform group-hover:-translate-x-1"
                                        >
                                            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="square" strokeLinejoin="miter" />
                                        </svg>
                                        <div className="absolute inset-0 bg-[#FA4028] translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10 opacity-10" />
                                    </button>
                                </div>

                                <div className="bg-[#FA4028] text-white px-10 py-4 flex flex-col items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]">
                                    <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                                        PROPOSAL_WRITING
                                    </h2>
                                </div>

                                {/* Next Navigation Arrow */}
                                <div className="absolute -right-20 top-1/2 -translate-y-1/2">
                                    <button
                                        onClick={() => router.push(`/dashboard/${projectId}/presentation`)}
                                        className="group relative w-12 h-12 border-2 border-black dark:border-white bg-white dark:bg-black transition-all hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] active:shadow-none flex items-center justify-center overflow-hidden"
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="w-6 h-6 fill-none stroke-black dark:stroke-white stroke-[3] transition-transform group-hover:translate-x-1"
                                        >
                                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="square" strokeLinejoin="miter" />
                                        </svg>
                                        <div className="absolute inset-0 bg-[#FA4028] translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10 opacity-10" />
                                    </button>
                                </div>
                            </div>
                            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">
                                Stage 04 // Content Generation & Drafting
                            </p>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <SectionList sections={sections} projectId={projectId} />
                    </div>
                </div>
            </div>
        </div>
    )
}
