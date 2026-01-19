"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Upload } from "lucide-react"
import { toast } from "sonner"
import { sourcesApi } from "@/features/sources/api/sourcesApi"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"

interface CreateProjectDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function CreateProjectDialog({
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    trigger
}: CreateProjectDialogProps = {}) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [title, setTitle] = React.useState("")
    const [agency, setAgency] = React.useState("")
    const [deadline, setDeadline] = React.useState("")
    const [files, setFiles] = React.useState<File[]>([])
    const router = useRouter()
    const supabase = createClient()

    // Support both controlled and uncontrolled usage
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = controlledOnOpenChange || setInternalOpen;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!files.length || !title) return

        setIsLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // 1. Create Project Record FIRST (Parent)
            // Try with new columns first
            let project = null

            try {
                const { data, error: dbError } = await supabase
                    .from('projects')
                    .insert({
                        title,
                        agency: agency || null,
                        deadline: deadline || null,
                        owner_id: user.id,
                        status: 'processing',
                    })
                    .select()
                    .single()

                if (dbError) throw dbError
                project = data
            } catch (err: any) {
                // Fallback: If columns don't exist, try without them
                console.warn("Extended columns might be missing, retrying with basic fields...", err)
                if (err.message?.includes('column') || err.code === '42703') { // 42703: undefined_column
                    const { data, error: retryError } = await supabase
                        .from('projects')
                        .insert({
                            title,
                            owner_id: user.id,
                            status: 'processing',
                        })
                        .select()
                        .single()

                    if (retryError) throw retryError
                    project = data

                    toast.warning("Project created, but extra details weren't saved (Database update required).")
                } else {
                    throw err
                }
            }

            if (!project) throw new Error("Failed to create project record")

            // 2. Loop through all files
            const uploadPromises = files.map(async (file) => {
                // Upload File
                const fileExt = file.name.split('.').pop()
                // Sanitize filename for Storage (ASCII only) to prevent "Invalid key" errors
                const timestamp = Date.now();
                const safeName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const storagePath = `${user.id}/${safeName}`;

                const { error: uploadError } = await supabase.storage
                    .from('raw-files')
                    .upload(storagePath, file)

                if (uploadError) throw uploadError

                // Create Source & Trigger n8n
                const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'unknown';

                try {
                    await sourcesApi.create({
                        title: file.name, // Keep original Chinese name for display
                        origin_url: storagePath, // Use safe path for retrieval
                        type: fileExtension, // Use mapped safe type
                        status: 'processing',
                        project_id: project.id,
                        source_type: 'tender',
                        tags: ['標案'],
                    });
                } catch (error: any) {
                    console.error(`Failed to trigger source for ${file.name}:`, error);
                    toast.error(`Error processing ${file.name}: ${error.message?.substring(0, 50)}`);
                }
            })

            await Promise.all(uploadPromises)

            toast.success(`Project initialized. ${files.length} documents queued.`)

            setOpen(false)
            setTitle("")
            setAgency("")
            setDeadline("")
            setFiles([])
            // Removed router.refresh() - Realtime subscription will auto-update the project list

        } catch (error) {
            console.error("Error creating project:", error)
            toast.error("Failed to create project.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {/* Only show trigger button in uncontrolled mode or if custom trigger provided */}
            {controlledOpen === undefined && (
                <DialogTrigger asChild>
                    {trigger || (
                        <Button className="cursor-pointer rounded-none bg-foreground text-background hover:bg-muted-foreground font-mono font-bold uppercase tracking-wider h-10 border border-transparent">
                            <Plus className="mr-2 h-4 w-4" />
                            New_Project
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px] rounded-none border-black dark:border-white font-mono p-0 overflow-hidden">
                <DialogHeader className="bg-muted p-6 border-b border-black dark:border-white">
                    <DialogTitle className="font-bold text-xl uppercase tracking-tighter">Initialize Project</DialogTitle>
                    <DialogDescription className="text-xs font-mono">
                        Upload RFP documentation for automated analysis.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="p-6 space-y-6">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title" className="font-bold text-xs uppercase">
                                Project Designation <span className="text-red-600">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. GOV_ALGORITHM_V2"
                                required
                                className="font-mono rounded-none border-black dark:border-white focus-visible:ring-0 focus:bg-muted"
                            />
                        </div>



                        <div className="grid gap-2">
                            <Label htmlFor="file" className="font-bold text-xs uppercase">
                                Source Materials <span className="text-red-600">*</span>
                            </Label>
                            <div className="flex items-center justify-center w-full">
                                <label
                                    htmlFor="file"
                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-black/20 dark:border-white/20 rounded-none cursor-pointer hover:bg-muted hover:border-black dark:hover:border-white transition-all group"
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-4 text-muted-foreground group-hover:text-foreground" />
                                        <p className="mb-2 text-xs text-muted-foreground group-hover:text-foreground">
                                            <span className="font-bold">CLICK_TO_UPLOAD</span> or drag file
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/50">
                                            SUPPORTED: PDF, DOCX, XLSX, TXT (MAX 50MB)
                                        </p>
                                    </div>
                                    <Input
                                        id="file"
                                        type="file"
                                        className="hidden"
                                        accept=".doc,.docx,.pdf,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.md,.jpg,.jpeg,.png,.bmp,.tiff,.html,.htm,.odt"
                                        multiple
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                setFiles(Array.from(e.target.files))
                                            }
                                        }}
                                        required
                                    />
                                </label>
                            </div>

                            {files.length > 0 && (
                                <div className="text-xs font-mono bg-muted p-2 border-l-2 border-black dark:border-white">
                                    <p className="mb-1 font-bold">SELECTED_FILES ({files.length}):</p>
                                    <ul className="list-inside opacity-70">
                                        {files.map((f, i) => (
                                            <li key={i} className="truncate before:content-['>_'] before:mr-1">{f.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full rounded-none bg-foreground text-background hover:bg-muted-foreground font-bold uppercase tracking-widest">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'PROCESSING...' : 'CONFIRM_INITIALIZATION'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
