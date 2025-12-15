import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { EditorHeader } from "@/components/editor/EditorHeader"
import { SectionList } from "@/components/editor/SectionList"
import { Loader2 } from "lucide-react"

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
                <EditorHeader title={project.title} status={project.status} projectId={project.id} />
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

    // Fetch Sections and Tasks
    // Note: This is a simplified fetch. Real-world would be recursive or use a view.
    // For MVP, lets assume a flat fetch and client-side tree build, or just fetch top level.
    // Actually, let's fetch all sections for this project.
    const { data: sectionsData } = await supabase
        .from('sections')
        .select(`
            *,
            tasks (*)
        `)
        .eq('project_id', id)
        .order('order_index', { ascending: true })

    // Fetch orphan tasks (direct project children)
    const { data: orphanTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id)
        .is('section_id', null)

    // We need to build the tree if we have parent_id logic, 
    // but for now let's just pass the flat list if SectionList handles it, 
    // OR assuming we only have 1 level for MVP.
    // Let's pass the raw data and let's map it to the Section interface.
    // Ideally we'd organize this into a tree in a utility function.

    // For now, simple mapping of top-level sections (where parent_id is null)
    // If the DB schema is strict text/tree, handling it here might be complex without a helper.
    // I'll filter for root sections first.

    const rootSections = sectionsData?.filter((s: any) => !s.parent_id) || []

    // Quick hack to attach children (1 level deep)
    const sectionsWithChildren = rootSections.map((section: any) => ({
        ...section,
        children: sectionsData?.filter((s: any) => s.parent_id === section.id).map((child: any) => ({
            ...child,
            tasks: child.tasks || []
        })),
        tasks: section.tasks || []
    }))

    // If we have orphan tasks, add a virtual "General" section at the top
    if (orphanTasks && orphanTasks.length > 0) {
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
        <div className="flex flex-col min-h-screen bg-white dark:bg-black font-sans">
            <EditorHeader title={project.title} status={project.status} projectId={project.id} />
            <main className="flex-1 overflow-y-auto">
                <SectionList sections={sectionsWithChildren} />
            </main>
        </div>
    )
}
