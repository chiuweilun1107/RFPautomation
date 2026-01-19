"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
    Plus,
    FolderOpen,
    MoreVertical,
    Trash2,
    Search,
    FileText,
    Calendar,
    Clock,
    ArrowRight,
    LayoutGrid,
    Loader2,
    List as ListIcon
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type Project = {
    id: string
    title: string
    status: 'processing' | 'active' | 'completed' | 'archived'
    updated_at: string
    created_at: string
    owner_id: string
    agency?: string
    deadline?: string
}

const ITEMS_PER_PAGE = 6

export function ProjectList() {
    const router = useRouter()
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
    const [projects, setProjects] = React.useState<Project[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [currentPage, setCurrentPage] = React.useState(1)
    const [projectToDelete, setProjectToDelete] = React.useState<Project | null>(null)
    const supabase = createClient()

    React.useEffect(() => {
        fetchProjects()

        const channel = supabase
            .channel('projects_realtime_grid')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
                fetchProjects()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    async function fetchProjects() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('owner_id', user.id)
                .order('updated_at', { ascending: false })

            if (error) throw error
            if (data) setProjects(data)
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (project: Project) => {
        setProjectToDelete(project)
    }

    const confirmDelete = async () => {
        if (!projectToDelete) return

        const projectId = projectToDelete.id
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const originalProjects = [...projects]
        setProjects(projects.filter(p => p.id !== projectId))

        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId)
                .eq('owner_id', user.id)

            if (error) throw error
            toast.success('Project entry deleted')
        } catch (error) {
            console.error('Error deleting project:', error)
            toast.error('Failed to delete project')
            setProjects(originalProjects)
        } finally {
            setProjectToDelete(null)
        }
    }

    const filteredProjects = projects.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Pagination Logic
    const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE)
    const paginatedProjects = filteredProjects.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    // Reset pagination on search
    React.useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-[250px] border border-black dark:border-white bg-muted animate-pulse" />
                ))}
            </div>
        )
    }

    if (projects.length === 0) {
        return (
            <div className="flex min-h-[500px] flex-col items-center justify-center border border-black dark:border-white bg-white dark:bg-black p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="relative z-10 max-w-md space-y-6">
                    <div className="relative w-64 h-64 mx-auto mb-6 border border-black dark:border-white p-2 bg-white dark:bg-black">
                        <img
                            src="/dashboard-empty-state.png"
                            alt="Empty State"
                            className="w-full h-full object-cover grayscale"
                        />
                    </div>
                    <h3 className="text-2xl font-bold font-mono tracking-tighter uppercase">No Active Projects</h3>
                    <p className="text-muted-foreground font-mono text-xs max-w-sm mx-auto">
                        system_status: idle
                        <br />
                        Initialize new RFP sequence to begin processing.
                    </p>
                    <div className="pt-4">
                        <CreateProjectDialog />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Breadcrumbs - Swiss Style */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-4">
                <Link href="/" className="hover:text-[#FA4028] transition-colors">HOME</Link>
                <span>/</span>
                <span className="text-foreground">DASHBOARD</span>
                <span>/</span>
                <span className="text-[#FA4028]">PROJECTS_POOL</span>
            </nav>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-black dark:border-white pb-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-[320px] group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="SEARCH_PROJECTS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background border-black dark:border-white rounded-none font-mono text-xs focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-black focus:bg-muted transition-colors h-10"
                        />
                    </div>

                    {/* View Toggle */}
                    <div className="flex border border-black dark:border-white h-10 p-1 bg-white dark:bg-black shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={`rounded-none h-full px-3 ${viewMode === 'grid' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-muted text-muted-foreground'}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={`rounded-none h-full px-3 ${viewMode === 'list' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-muted text-muted-foreground'}`}
                        >
                            <ListIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <CreateProjectDialog />
            </div>

            {viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedProjects.map((project) => (
                        <Card
                            key={project.id}
                            onClick={() => router.push(`/dashboard/${project.id}`)}
                            className="group relative flex flex-col overflow-visible border-[1.5px] border-black dark:border-white rounded-none bg-background transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] cursor-pointer"
                        >
                            <div className={`h-1.5 w-full ${project.status === 'processing' ? 'bg-amber-400' :
                                project.status === 'active' ? 'bg-emerald-500' :
                                    project.status === 'completed' ? 'bg-blue-600' : 'bg-gray-400'
                                }`} />

                            <CardHeader className="p-5 space-y-4 flex-1">
                                <div className="flex justify-between items-center">
                                    <Badge
                                        className={`
                                            rounded-none border-black dark:border-white font-mono text-[9px] uppercase font-black px-2 py-0.5
                                            ${project.status === 'processing' ? 'bg-amber-400 text-black' : ''}
                                            ${project.status === 'active' ? 'bg-emerald-500 text-white' : ''}
                                            ${project.status === 'completed' ? 'bg-blue-600 text-white' : ''}
                                            ${!['processing', 'active', 'completed'].includes(project.status) ? 'bg-white text-black' : ''}
                                        `}
                                    >
                                        {project.status === 'processing' && <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin inline-block" />}
                                        {project.status.toUpperCase()}
                                    </Badge>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-none border-black dark:border-white font-mono text-xs" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/${project.id}`} className="w-full">OPEN_PROJECT</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-black/10 dark:bg-white/10" />
                                            <DropdownMenuItem
                                                className="text-red-600 focus:text-white focus:bg-red-600 rounded-none cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(project);
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-3 w-3" />
                                                DELETE
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-1">
                                    <CardTitle className="text-2xl font-black leading-[1.1] font-mono tracking-tighter uppercase group-hover:text-[#FA4028] transition-colors">
                                        {project.title}
                                    </CardTitle>
                                </div>

                                <div className="grid grid-cols-1 gap-2 pt-2 mt-2">
                                    <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-black dark:border-white space-y-1">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FA4028] uppercase tracking-[0.2em]">
                                            <LayoutGrid className="h-3.5 w-3.5" />
                                            Agency_Entity
                                        </div>
                                        <div className="text-xl font-black font-mono text-foreground break-words leading-tight">
                                            {project.agency || "UNDEFINED_DATA"}
                                        </div>
                                    </div>

                                    <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-[#FA4028] space-y-1">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FA4028] uppercase tracking-[0.2em]">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Deadline_Sequence
                                        </div>
                                        <div className="text-xl font-black font-mono text-foreground leading-tight">
                                            {project.deadline ? new Date(project.deadline).toLocaleDateString() : "PENDING_STAMP"}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardFooter className="px-5 py-3 flex items-center justify-between border-t border-black/5 dark:border-white/5 mt-auto opacity-40 hover:opacity-100 transition-opacity">
                                <div className="flex gap-4 text-[9px] font-mono uppercase font-bold italic">
                                    <span>Upd: {new Date(project.updated_at).toLocaleDateString()}</span>
                                    <span>Cre: {new Date(project.created_at).toLocaleDateString()}</span>
                                </div>
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                /* List View */
                <div className="border-[1.5px] border-black dark:border-white bg-white dark:bg-black overflow-hidden">
                    <div className="hidden md:grid grid-cols-[80px_1fr_200px_150px_50px] gap-4 p-4 bg-muted border-b border-black dark:border-white text-[10px] font-black uppercase tracking-[0.2em] opacity-60 italic">
                        <div>Status</div>
                        <div>Project_Title</div>
                        <div>Agency_Entity</div>
                        <div>Deadline</div>
                        <div className="text-right">Ops</div>
                    </div>
                    <div className="divide-y divide-black/10 dark:divide-white/10">
                        {paginatedProjects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => router.push(`/dashboard/${project.id}`)}
                                className="grid grid-cols-1 md:grid-cols-[80px_1fr_200px_150px_50px] gap-4 p-4 items-center hover:bg-[#FA4028]/5 transition-colors cursor-pointer group"
                            >
                                <div className="flex justify-start">
                                    <Badge
                                        className={`
                                            rounded-none border-black dark:border-white font-mono text-[8px] uppercase font-black px-1.5 py-0
                                            ${project.status === 'processing' ? 'bg-amber-400 text-black' : ''}
                                            ${project.status === 'active' ? 'bg-emerald-500 text-white' : ''}
                                            ${project.status === 'completed' ? 'bg-blue-600 text-white' : ''}
                                            ${!['processing', 'active', 'completed'].includes(project.status) ? 'bg-white text-black' : ''}
                                        `}
                                    >
                                        {project.status.slice(0, 3)}
                                    </Badge>
                                </div>
                                <div>
                                    <div className="font-mono font-black text-sm uppercase truncate group-hover:text-[#FA4028] transition-colors">
                                        {project.title}
                                    </div>
                                </div>
                                <div className="font-mono text-[11px] font-bold uppercase truncate text-foreground/80 border-l border-black/5 pl-4 hidden md:block">
                                    {project.agency || "UNDEFINED"}
                                </div>
                                <div className={`font-mono text-xs font-black border-l border-black/5 pl-4 hidden md:block ${project.deadline ? 'text-[#FA4028]' : 'opacity-30'}`}>
                                    {project.deadline ? new Date(project.deadline).toLocaleDateString() : "PENDING"}
                                </div>
                                <div className="flex justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none hover:bg-black hover:text-white transition-colors">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-none border-black dark:border-white font-mono text-xs" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/${project.id}`} className="w-full">OPEN</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-black/10 dark:bg-white/10" />
                                            <DropdownMenuItem
                                                className="text-red-600 focus:bg-red-600 focus:text-white rounded-none cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(project);
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-3 w-3" />
                                                DELETE
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-8 border-t border-black dark:border-white mt-12">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">
                        PAGE_IDENTIFIER: {currentPage} / {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="rounded-none border-black dark:border-white font-mono text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-20"
                        >
                            [ PREV ]
                        </Button>
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <Button
                                    key={i}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={cn(
                                        "h-8 w-8 rounded-none font-mono text-xs font-black transition-all",
                                        currentPage === i + 1
                                            ? "bg-black text-white dark:bg-white dark:text-black"
                                            : "hover:bg-[#FA4028] hover:text-white"
                                    )}
                                >
                                    {String(i + 1).padStart(2, '0')}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="rounded-none border-black dark:border-white font-mono text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-20"
                        >
                            [ NEXT ]
                        </Button>
                    </div>
                </div>
            )}

            <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
                <AlertDialogContent className="rounded-none border-[2px] border-black dark:border-white font-mono p-0 overflow-hidden bg-white dark:bg-black">
                    <div className="bg-red-600 p-4 text-white">
                        <AlertDialogTitle className="font-black uppercase tracking-widest flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            Danger Zone: Protocol Erasure
                        </AlertDialogTitle>
                    </div>
                    <div className="p-6">
                        <AlertDialogDescription className="text-foreground font-bold">
                            You are about to permanently delete project:
                            <span className="block mt-2 p-2 bg-muted text-black dark:text-white border border-black dark:border-white break-all">{projectToDelete?.title}</span>
                        </AlertDialogDescription>
                        <div className="mt-4 text-[10px] uppercase text-red-600 font-black animate-pulse">
                            CRITICAL: This action cannot be reversed.
                        </div>
                    </div>
                    <AlertDialogFooter className="p-6 bg-muted/30 border-t border-black dark:border-white sm:space-x-4">
                        <AlertDialogCancel className="rounded-none border-black dark:border-white font-bold hover:bg-black hover:text-white transition-all">ABORT_CANCEL</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="rounded-none bg-red-600 hover:bg-black text-white font-bold border-none transition-colors"
                        >
                            CONFIRM_ERASURE
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
