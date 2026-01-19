import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { ProjectWorkspaceLayout } from "@/components/workspace/ProjectWorkspaceLayout"

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

    if (!project) notFound()

    return (
        <ProjectWorkspaceLayout project={project}>
            {children}
        </ProjectWorkspaceLayout>
    )
}
