"use client"

import * as React from "react"
import { getErrorMessage } from '@/lib/errorUtils';
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FolderPlus } from "lucide-react"
import { toast } from "sonner"

interface CreateTemplateFolderDialogProps {
    onFolderCreated?: () => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function CreateTemplateFolderDialog({ onFolderCreated, open: controlledOpen, onOpenChange }: CreateTemplateFolderDialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen
    const [name, setName] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [creating, setCreating] = React.useState(false)
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            toast.error("請輸入資料夾名稱")
            return
        }

        setCreating(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { error } = await supabase
                .from('template_folders')
                .insert({
                    name: name.trim(),
                    description: description.trim() || null,
                    owner_id: user.id,
                })

            if (error) throw error

            toast.success("資料夾已建立")
            setOpen(false)
            setName("")
            setDescription("")

            if (onFolderCreated) {
                onFolderCreated()
            }
        } catch (error) {
            console.error("Create folder error:", error)
            toast.error(getErrorMessage(error) || "建立資料夾失敗")
        } finally {
            setCreating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-none border-2 border-black bg-black hover:bg-zinc-800 text-white font-mono uppercase tracking-[0.2em]">
                    <FolderPlus className="mr-2 h-4 w-4" />
                    CREATE_DIR
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-none border-4 border-black p-0">
                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">建立範本資料夾</DialogTitle>
                        <DialogDescription className="font-mono text-black dark:text-gray-400 uppercase text-xs mt-1">
                            CREATE NEW FOLDER TO ORGANIZE TEMPLATES.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-sm font-black uppercase tracking-widest">資料夾名稱</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="例如：投標書範本、合約範本"
                                    required
                                    className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description" className="text-sm font-black uppercase tracking-widest">描述（選填）</Label>
                                <Input
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="簡短描述此資料夾的用途"
                                    className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                                />
                            </div>
                        </div>
                        <DialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="rounded-none border-black border-2 font-mono font-bold uppercase tracking-widest w-full sm:w-auto hover:bg-gray-100"
                            >
                                CANCEL
                            </Button>
                            <Button
                                type="submit"
                                disabled={creating}
                                className="rounded-none border-black border-2 bg-black hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-widest w-full sm:w-auto"
                            >
                                {creating ? "SAVING..." : "COMMIT_FOLDER"}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}

