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
                <Button className="bg-[#FA4028] hover:bg-[#D93620] text-white font-bold">
                    <FolderPlus className="mr-2 h-4 w-4" />
                    建立資料夾
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl">建立範本資料夾</DialogTitle>
                    <DialogDescription>
                        建立新的資料夾來組織您的 Word 範本檔案。
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="font-bold">資料夾名稱</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="例如：投標書範本、合約範本"
                                required
                                className="font-medium"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description" className="font-bold">描述（選填）</Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="簡短描述此資料夾的用途"
                                className="font-medium"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            取消
                        </Button>
                        <Button
                            type="submit"
                            disabled={creating}
                            className="bg-[#FA4028] hover:bg-[#D93620] text-white font-bold"
                        >
                            {creating ? "建立中..." : "建立資料夾"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

