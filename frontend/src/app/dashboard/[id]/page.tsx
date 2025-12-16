import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { EditorHeader } from "@/components/editor/EditorHeader"
import { SectionList } from "@/components/editor/SectionList"
import { Loader2 } from "lucide-react"
import { ProjectDashboardClient } from "@/components/workspace/ProjectDashboardClient"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ProjectEditorPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect("/login")
    }

    // Is there a project?
    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !project) {
        notFound()
    }

    // If processing, show a special state
    if (project.status === 'processing') {
        return (
            <div className="flex flex-col min-h-screen bg-white dark:bg-black">
                <EditorHeader title={project.title} status={project.status} projectId={project.id} onStageSelect={() => { }} />
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary text-blue-600" />
                    <h2 className="text-xl font-semibold">AI is analyzing your document</h2>
                    <p className="text-muted-foreground text-gray-500 max-w-md text-center">
                        This usually takes about a minute. We are extracting sections and requirements from your uploaded file.
                    </p>
                </div>
            </div>
        )
    }

    // Fetch Sections (without nested tasks - no FK relationship exists)
    const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .eq('project_id', id)
        .order('order_index', { ascending: true })

    // Debug logging
    console.log('[DEBUG] Project ID:', id)
    console.log('[DEBUG] Sections query error:', sectionsError)
    console.log('[DEBUG] Sections count:', sectionsData?.length || 0)

    // Fetch tasks separately (if tasks table has section_id column)
    const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id)

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

    // Filter for root sections (where parent_id is null)
    const rootSections = sectionsData?.filter((s: any) => !s.parent_id) || []

    // Build sections tree with tasks attached
    const sectionsWithChildren = rootSections.map((section: any) => ({
        ...section,
        content: section.title, // Map title to content for SectionList component
        children: sectionsData?.filter((s: any) => s.parent_id === section.id).map((child: any) => ({
            ...child,
            content: child.title,
            tasks: tasksBySection[child.id] || []
        })),
        tasks: tasksBySection[section.id] || []
    }))

    // If we have orphan tasks, add a virtual "General" section at the top
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

    return (
        <ProjectDashboardClient project={project} sections={sectionsWithChildren} />
    )
}
