
"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { TiptapEditor } from "@/components/editor/TiptapEditor"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import { Loader2, Sparkles } from "lucide-react"

interface Task {
    id: string
    title?: string
    description?: string
    requirement_text: string
    response_draft?: string
    status: string
}

interface TaskEditorSheetProps {
    task: Task | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onTaskUpdated: (task: Task) => void
}

export function TaskEditorSheet({ task, open, onOpenChange, onTaskUpdated }: TaskEditorSheetProps) {
    const [draft, setDraft] = React.useState("")
    const [isSaving, setIsSaving] = React.useState(false)
    const [isGenerating, setIsGenerating] = React.useState(false)
    const supabase = createClient()

    // Sync draft with task when opened
    React.useEffect(() => {
        if (task) {
            setDraft(task.response_draft || "")
        }
    }, [task])

    const handleSave = async () => {
        if (!task) return
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('tasks')
                .update({
                    response_draft: draft,
                    status: 'drafted', // Auto-update status to drafted
                    updated_at: new Date().toISOString()
                })
                .eq('id', task.id)

            if (error) throw error

            onTaskUpdated({ ...task, response_draft: draft, status: 'drafted' })
            onOpenChange(false) // Close on save? Optional. Let's keep it open for now or close.
            // Let's close it to show progress.
        } catch (err) {
            console.error("Failed to save draft:", err)
        } finally {
            setIsSaving(false)
        }
    }

    const handleMagicDraft = async () => {
        setIsGenerating(true)
        try {
            const response = await fetch('/api/n8n/draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: task?.id,
                    requirement: task?.requirement_text || task?.title,
                    query: "Draft a section for this task based on available documents.",
                    project_id: null // TODO: Pass actual project ID
                })
            });
            const data = await response.json();
            if (data.answer) {
                // Determine if we append or replace. For now, append.
                const newContent = draft + `\n\n${data.answer}`;
                setDraft(newContent);
            }
        } catch (e) {
            console.error("Magic Draft API call failed", e)
        } finally {
            setIsGenerating(false)
        }
    }

    if (!task) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[800px] sm:w-[540px] overflow-y-auto flex flex-col">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl">{task.title || "Untitled Task"}</SheetTitle>
                    <SheetDescription>
                        Internal ID: {task.id}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-6">
                    {/* Requirement View */}
                    <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
                        <h4 className="text-sm font-medium text-foreground">Requirement Details</h4>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {task.requirement_text || task.description || "No text content available."}
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Response Draft</h4>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMagicDraft}
                                disabled={isGenerating}
                                className="h-8 text-xs text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:text-purple-400 dark:border-purple-900 dark:hover:bg-purple-900/20"
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                ) : (
                                    <Sparkles className="w-3 h-3 mr-2" />
                                )}
                                Auto-Generate
                            </Button>
                        </div>
                        <TiptapEditor
                            content={draft}
                            onChange={setDraft}
                            className="bg-background"
                        />
                    </div>
                </div>

                <SheetFooter className="mt-8 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
