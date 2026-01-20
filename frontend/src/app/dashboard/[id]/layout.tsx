import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { KnowledgeSidebar } from "@/components/workspace/KnowledgeSidebar"
import { EditorHeader } from "@/components/editor/EditorHeader"
import { ProjectWorkflowStepper } from "@/components/workspace/ProjectWorkflowStepper"

export default async function Layout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    // Verify project exists
    if (!project) notFound()

    return (
        <div className="flex h-screen overflow-hidden relative font-mono text-black dark:text-white p-4 gap-4">
            {/* Left Sidebar: Knowledge Base - Client Component */}
            <KnowledgeSidebar
                projectId={project.id}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-black border border-black dark:border-white">
                <EditorHeader
                    title={project.title}
                    status={project.status}
                    projectId={project.id}
                    // stage prop is removed as we let the stepper/page handle it, or we pass 0 as default
                    stage={0}
                />

                {/* Workflow Ribbon */}
                <div className="border-b border-black/10 dark:border-white/10 bg-white dark:bg-black px-4 py-2">
                    <ProjectWorkflowStepper
                        projectId={project.id}
                    // removed currentStage prop, it will be handled internally by pathname
                    />
                </div>

                <main className="flex-1 overflow-y-auto no-scrollbar bg-white dark:bg-black p-0">
                    {children}
                </main>
            </div>
        </div>
    )
}
