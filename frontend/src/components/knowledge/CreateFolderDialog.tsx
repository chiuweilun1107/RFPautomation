"use client"

import * as React from "react"
import { getErrorMessage } from '@/lib/errorUtils'
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BaseDialog } from "@/components/common"

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
    const [error, setError] = React.useState<string | null>(null)
    const supabase = createClient()

    async function handleSubmit() {
        if (!name) return

        setIsLoading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { error: dbError } = await supabase
                .from('knowledge_folders')
                .insert({
                    name,
                    description: description || null,
                    owner_id: user.id,
                })
                .select()
                .single()

            if (dbError) {
                throw new Error(getErrorMessage(dbError) || "Failed to create folder")
            }

            toast.success("資料夾建立成功！")
            setOpen(false)
            setName("")
            setDescription("")

            if (onFolderCreated) {
                onFolderCreated()
            }
        } catch (err) {
            const errorMessage = getErrorMessage(err) || "建立資料夾失敗，請重試。"
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Button
                className="cursor-pointer bg-[#FA4028] hover:bg-[#D93620] text-white font-bold shadow-lg shadow-orange-900/10 hover:shadow-orange-900/20 transition-all"
                onClick={() => setOpen(true)}
            >
                <Plus className="mr-2 h-4 w-4" />
                建立新資料夾
            </Button>

            <BaseDialog
                open={open}
                onOpenChange={setOpen}
                title="建立新資料夾"
                description="建立資料夾來組織您的知識庫文件。"
                confirmText="確認建立"
                cancelText="取消"
                onConfirm={handleSubmit}
                loading={isLoading}
                error={error}
                disableConfirm={!name.trim() || isLoading}
            >
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="font-bold">資料夾名稱</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例如：公司政策、技術文件、合約範本"
                            required
                            className="font-medium"
                            disabled={isLoading}
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
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </BaseDialog>
        </>
    )
}