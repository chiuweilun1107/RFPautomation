"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, FolderOpen, MoreVertical } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog"

interface Project {
    id: string
    title: string
    status: string
    updated_at: string
}

export function ProjectList() {
    const [projects, setProjects] = React.useState<Project[]>([])
    const [loading, setLoading] = React.useState(true)
    const supabase = createClient()

    React.useEffect(() => {
        async function fetchProjects() {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) return

                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('owner_id', user.id)
                    .order('updated_at', { ascending: false })

                if (error) {
                    console.error('Error fetching projects:', error)
                    return
                }

                if (data) {
                    setProjects(data)
                }
            } finally {
                setLoading(false)
            }
        }

        fetchProjects()
    }, [supabase])

    const handleDelete = async (projectId: string) => {
        if (!confirm('Are you sure you want to delete this project? This will also delete all related tasks and sections.')) return

        // Get current user first
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            console.error('Error deleting project: User not authenticated')
            return
        }

        // Store original projects for rollback
        const originalProjects = [...projects]

        // Optimistic UI update
        setProjects(projects.filter(p => p.id !== projectId))

        try {
            // Step 1: Delete tasks that directly reference this project
            // (tasks table has project_id FK without CASCADE)
            const { error: tasksError } = await supabase
                .from('tasks')
                .delete()
                .eq('project_id', projectId)

            if (tasksError) {
                throw new Error(`Failed to delete tasks: ${tasksError.message}`)
            }

            // Step 2: Delete sections (this will also cascade delete tasks via section_id)
            const { error: sectionsError } = await supabase
                .from('sections')
                .delete()
                .eq('project_id', projectId)

            if (sectionsError) {
                throw new Error(`Failed to delete sections: ${sectionsError.message}`)
            }

            // Step 3: Now delete the project itself
            const { error: projectError } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId)
                .eq('owner_id', user.id)

            if (projectError) {
                throw new Error(`Failed to delete project: ${projectError.message}`)
            }

        } catch (error) {
            console.error('Error deleting project:', error instanceof Error ? error.message : error)
            // Revert on error
            setProjects(originalProjects)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 text-muted-foreground text-gray-500">
                Loading projects...
            </div>
        )
    }

    if (projects.length === 0) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                    <FolderOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm text-gray-500">
                    Upload a DOCX, PDF, or Excel file to generate your first RFP response project.
                </p>
                <CreateProjectDialog />
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
                <div
                    key={project.id}
                    className="flex flex-col justify-between rounded-md border p-4 shadow-sm transition-all hover:shadow-md bg-white dark:bg-zinc-900 dark:border-zinc-800"
                >
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <Link
                                href={`/dashboard/${project.id}`}
                                className="font-semibold hover:underline"
                            >
                                {project.title}
                            </Link>
                            <p className="text-sm text-muted-foreground text-gray-500">
                                Last updated {new Date(project.updated_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="relative group">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete(project.id);
                                }}
                                className="text-muted-foreground hover:text-red-500 p-2"
                                title="Delete Project"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                <span className="sr-only">Delete</span>
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${project.status === 'completed' || project.status === 'active'
                                ? 'bg-green-50 text-green-700 ring-green-600/20'
                                : 'bg-blue-50 text-blue-700 ring-blue-700/10'
                                }`}
                        >
                            {project.status}
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/${project.id}`}>Open</Link>
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}
