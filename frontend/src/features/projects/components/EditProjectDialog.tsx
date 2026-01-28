"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BaseDialog } from "@/components/common"
import type { Project } from "../hooks/useProjects"

interface EditProjectDialogProps {
    project: Project | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function EditProjectDialog({
    project,
    open,
    onOpenChange,
    onSuccess
}: EditProjectDialogProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [title, setTitle] = React.useState("")
    const [agency, setAgency] = React.useState("")
    const [deadline, setDeadline] = React.useState("")
    const supabase = createClient()

    React.useEffect(() => {
        if (project && open) {
            setTitle(project.title || "")
            setAgency(project.agency || "")
            setDeadline(project.deadline || "")
        }
    }, [project, open])

    // Helper to convert ROC Year or other formats back to ISO for DB
    const convertToIsoDate = (dateStr: string): string | null => {
        if (!dateStr) return null;

        // 1. Check if it's already a valid ISO-like date
        const stdDate = new Date(dateStr);
        if (!isNaN(stdDate.getTime())) return stdDate.toISOString();

        // 2. Try ROC Year format: 115年1月27日 -> 2026/1/27
        const rocMatch = dateStr.match(/(\d{2,3})年(\d{1,2})月(\d{1,2})日/);
        if (rocMatch) {
            const year = parseInt(rocMatch[1]) + 1911;
            const month = parseInt(rocMatch[2]);
            const day = parseInt(rocMatch[3]);
            return new Date(year, month - 1, day).toISOString();
        }

        return null;
    };

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!project || !title) return

        setIsLoading(true)

        try {
            const isoDeadline = deadline ? convertToIsoDate(deadline) : null;

            const { error } = await supabase
                .from('projects')
                .update({
                    title,
                    agency: agency || null,
                    deadline: isoDeadline,
                    updated_at: new Date().toISOString()
                })
                .eq('id', project.id)

            if (error) throw error

            toast.success("專案資訊已更新")

            // ✅ 關閉對話框前先調用 onSuccess，確保畫面更新
            if (onSuccess) onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Error updating project details:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                fullError: error
            })
            toast.error(`更新專案失敗: ${error.message || '未知錯誤'}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title="編輯專案資訊"
            description="修改專案名稱、機關名稱及截止日期。"
            maxWidth="md"
            loading={isLoading}
            showFooter={true}
            footer={
                <div className="flex gap-3 w-full">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 rounded-none border-2 border-black font-black uppercase tracking-widest hover:bg-gray-100 dark:border-white dark:hover:bg-white/10"
                    >
                        取消
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        onClick={(e) => onSubmit(e as any)}
                        className="flex-1 rounded-none border-2 border-black bg-[#FA4028] hover:bg-black text-white font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] dark:border-white"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? '更新中...' : '確認更新'}
                    </Button>
                </div>
            }
        >
            <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-title" className="text-sm font-black uppercase tracking-widest">
                            專案名稱 <span className="text-red-600">*</span>
                        </Label>
                        <Input
                            id="edit-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="輸入專案名稱..."
                            required
                            className="font-mono rounded-none border-2 border-black dark:border-white focus-visible:ring-0 focus-visible:border-[#FA4028]"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="edit-agency" className="text-sm font-black uppercase tracking-widest">
                            主辦機關
                        </Label>
                        <Input
                            id="edit-agency"
                            value={agency}
                            onChange={(e) => setAgency(e.target.value)}
                            placeholder="輸入主辦機關..."
                            className="font-mono rounded-none border-2 border-black dark:border-white focus-visible:ring-0 focus-visible:border-[#FA4028]"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="edit-deadline" className="text-sm font-black uppercase tracking-widest">
                            截標日期 (Deadline)
                        </Label>
                        <Input
                            id="edit-deadline"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            placeholder="YYYY/MM/DD..."
                            className="font-mono rounded-none border-2 border-black dark:border-white focus-visible:ring-0 focus-visible:border-[#FA4028]"
                        />
                    </div>
                </div>
            </form>
        </BaseDialog>
    )
}
