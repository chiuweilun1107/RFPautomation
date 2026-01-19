"use client"

import * as React from "react"
import { getErrorMessage } from '@/lib/errorUtils';
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus } from "lucide-react"
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

interface CreateFolderDialogProps {
    onFolderCreated?: () => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function CreateFolderDialog({ onFolderCreated, open: controlledOpen, onOpenChange }: CreateFolderDialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen
    const [isLoading, setIsLoading] = React.useState(false)
    const [name, setName] = React.useState("")
    const [description, setDescription] = React.useState("")
    const supabase = createClient()

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name) return

        setIsLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { error, data } = await supabase
                .from('knowledge_folders')
                .insert({
                    name,
                    description: description || null,
                    owner_id: user.id,
                })
                .select()
                .single()

            if (error) {
                console.error("Supabase error:", error)
                throw new Error(getErrorMessage(error) || "Failed to create folder")
            }

            toast.success("資料夾建立成功！")
            setOpen(false)
            setName("")
            setDescription("")
            
            // 通知父組件更新數據
            if (onFolderCreated) {
                onFolderCreated()
            }
        } catch (error) {
            console.error("Error creating folder:", error)
            const errorMessage = getErrorMessage(error) || "建立資料夾失敗，請重試。"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="cursor-pointer bg-[#FA4028] hover:bg-[#D93620] text-white font-bold shadow-lg shadow-orange-900/10 hover:shadow-orange-900/20 transition-all">
                    <Plus className="mr-2 h-4 w-4" />
                    建立新資料夾
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl">建立新資料夾</DialogTitle>
                    <DialogDescription>
                        建立資料夾來組織您的知識庫文件。
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="font-bold">資料夾名稱</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="例如：公司政策、技術文件、合約範本"
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
                        <Button type="submit" disabled={isLoading} className="w-full bg-[#FA4028] hover:bg-[#D93620] text-white font-bold">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? '建立中...' : '確認建立'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}