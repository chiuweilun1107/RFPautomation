"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { createClient } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const SectionList = dynamic(
    () => import("@/components/editor/SectionList").then((mod) => ({ default: mod.SectionList })),
    {
        loading: () => <LoadingSpinner size="lg" text="載入章節列表..." />,
        ssr: false
    }
)

export default function WritingPage({ params }: { params: Promise<{ id: string }> }) {
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
                    .eq('project_id', projectId)

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
        <div className="max-w-4xl mx-auto pb-20">
            <SectionList sections={sections} projectId={projectId} />
        </div>
    )
}
