"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Upload } from "lucide-react"
import { toast } from "sonner"

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

export function CreateProjectDialog() {
    const [open, setOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [title, setTitle] = React.useState("")
    const [file, setFile] = React.useState<File | null>(null)
    const router = useRouter()
    const supabase = createClient()

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!file || !title) return

        setIsLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // 1. Upload File (to raw-files)
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('raw-files')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // 2. Create Project Record (New Schema)
            const { data: project, error: dbError } = await supabase
                .from('projects')
                .insert({
                    title,
                    owner_id: user.id,
                    status: 'processing',
                })
                .select()
                .single()

            if (dbError) throw dbError

            // 3. Create Source & Trigger n8n (via API)
            const sourceResponse = await fetch('/api/sources/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: file.name,
                    origin_url: fileName,
                    type: fileExt === 'pdf' ? 'pdf' : 'docx',
                    status: 'processing',
                    project_id: project.id
                })
            })

            if (!sourceResponse.ok) {
                console.error("Failed to create source record via API")
                // Non-blocking but good to log
            }

            toast.success("Project created! Document is being processed.")

            setOpen(false)
            setTitle("")
            setFile(null)
            router.refresh()
            // Optional: Redirect to the new project immediately
            // router.push(`/dashboard/${project.id}`)

        } catch (error) {
            console.error("Error creating project:", error)
            toast.error("Failed to create project. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Upload your RFP document to start the automation process.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Project Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Government Cloud Migration RFP"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="file">RFP Document</Label>
                            <div className="flex items-center justify-center w-full">
                                <label
                                    htmlFor="file"
                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800"
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-4 text-muted-foreground text-gray-400" />
                                        <p className="mb-2 text-sm text-muted-foreground text-gray-500">
                                            <span className="font-semibold">Click to upload</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground text-gray-400">
                                            DOCX, PDF, or XLSX (MAX. 10MB)
                                        </p>
                                    </div>
                                    <Input
                                        id="file"
                                        type="file"
                                        className="hidden"
                                        accept=".docx,.pdf,.xlsx"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        required
                                    />
                                </label>
                            </div>
                            {file && (
                                <p className="text-sm font-medium text-green-600 truncate">
                                    Selected: {file.name}
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
