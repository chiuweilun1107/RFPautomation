"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, FolderOpen, MoreVertical, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Project {
    id: string
    title: string
    status: string
    updated_at: string
}

export function ProjectList() {
    const [projects, setProjects] = React.useState<Project[]>([])
    const [loading, setLoading] = React.useState(true)
    const [projectToDelete, setProjectToDelete] = React.useState<Project | null>(null)
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

    const handleDelete = (project: Project) => {
        setProjectToDelete(project)
    }

    const confirmDelete = async () => {
        if (!projectToDelete) return

        const projectId = projectToDelete.id
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
            // Delete the project itself (Database cascading will handle related records)
            const { error: projectError } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId)
                .eq('owner_id', user.id)

            if (projectError) {
                throw new Error(`Failed to delete project: ${projectError.message}`)
            }
            toast.success('Project deleted')

        } catch (error) {
            console.error('Error deleting project:', error instanceof Error ? error.message : error)
            toast.error('Failed to delete project')
            // Revert on error
            setProjects(originalProjects)
        } finally {
            setProjectToDelete(null)
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
        <>
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
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleDelete(project)
                                }}
                                className="text-muted-foreground hover:text-red-500"
                                title="Delete Project"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
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

            <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete &quot;{projectToDelete?.title}&quot;.
                            This action cannot be undone and will delete all related tasks and sections.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
                        >
                            Delete Project
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
