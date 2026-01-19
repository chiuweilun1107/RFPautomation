"use client"

import * as React from "react"
import { getErrorMessage } from '@/lib/errorUtils'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FolderPlus } from "lucide-react"
import { toast } from "sonner"
import { BaseDialog } from "@/components/common"

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
    const [error, setError] = React.useState<string | null>(null)
    const supabase = createClient()

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("請輸入資料夾名稱")
            return
        }

        setCreating(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { error: dbError } = await supabase
                .from('template_folders')
                .insert({
                    name: name.trim(),
                    description: description.trim() || null,
                    owner_id: user.id,
                })

            if (dbError) throw dbError

            toast.success("資料夾已建立")
            setOpen(false)
            setName("")
            setDescription("")

            if (onFolderCreated) {
                onFolderCreated()
            }
        } catch (err) {
            const errorMsg = getErrorMessage(err) || "建立資料夾失敗"
            setError(errorMsg)
            toast.error(errorMsg)
        } finally {
            setCreating(false)
        }
    }

    return (
        <>
            <Button
                className="rounded-none border-2 border-black bg-black hover:bg-zinc-800 text-white font-mono uppercase tracking-[0.2em]"
                onClick={() => setOpen(true)}
            >
                <FolderPlus className="mr-2 h-4 w-4" />
                CREATE_DIR
            </Button>

            <BaseDialog
                open={open}
                onOpenChange={setOpen}
                title="建立範本資料夾"
                description="CREATE NEW FOLDER TO ORGANIZE TEMPLATES."
                confirmText="COMMIT_FOLDER"
                cancelText="CANCEL"
                onConfirm={handleSubmit}
                loading={creating}
                error={error}
                disableConfirm={!name.trim() || creating}
            >
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-sm font-black uppercase tracking-widest">資料夾名稱</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例如：投標書範本、合約範本"
                            required
                            className="rounded-none border-2 border-black font-mono focus-visible:ring-0 focus-visible:border-[#FA4028]"
                            disabled={creating}
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
                            disabled={creating}
                        />
                    </div>
                </div>
            </BaseDialog>
        </>
    )
}

