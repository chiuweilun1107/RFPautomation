"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, FileText, CheckSquare, Square } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface SourceSelectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
    onConfirm: (sourceIds: string[]) => void
    title?: string
    description?: string
}

interface SourceFile {
    id: string
    title: string
    type?: string
}

export function SourceSelectionDialog({
    open,
    onOpenChange,
    projectId,
    onConfirm,
    title = "SELECT_SOURCES",
    description = "Choose which references the AI should use for this task."
}: SourceSelectionDialogProps) {
    const [loading, setLoading] = React.useState(false)
    const [sources, setSources] = React.useState<SourceFile[]>([])
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
    const supabase = createClient()

    // Fetch sources when dialog opens
    React.useEffect(() => {
        if (open && projectId) {
            fetchSources()
        }
    }, [open, projectId])

    const fetchSources = async () => {
        setLoading(true)
        try {
            // 1. Get source IDs linked to project
            const { data: projectSources, error: linkError } = await supabase
                .from('project_sources')
                .select('source_id')
                .eq('project_id', projectId)

            if (linkError) throw linkError

            const sourceIds = (projectSources || []).map(ps => ps.source_id)

            if (sourceIds.length === 0) {
                setSources([])
                setLoading(false)
                return
            }

            // 2. Get source details
            const { data: sourceFiles, error: fileError } = await supabase
                .from('sources')
                .select('id, title, type')
                .in('id', sourceIds)

            if (fileError) throw fileError

            setSources(sourceFiles || [])
            // Default select all
            setSelectedIds(new Set(sourceFiles?.map(s => s.id)))

        } catch (error: any) {
            console.error("Failed to fetch sources:", error)
            toast.error("Failed to load sources")
        } finally {
            setLoading(false)
        }
    }

    const toggleSource = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds)
        if (checked) {
            newSet.add(id)
        } else {
            newSet.delete(id)
        }
        setSelectedIds(newSet)
    }

    const toggleAll = () => {
        if (selectedIds.size === sources.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(sources.map(s => s.id)))
        }
    }

    const handleConfirm = () => {
        if (selectedIds.size === 0) {
            toast.error("Please select at least one source")
            return
        }
        onConfirm(Array.from(selectedIds))
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-hidden bg-white dark:bg-black border-2 border-black dark:border-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                <div className="p-8 font-mono">
                    {/* Header */}
                    <div className="mb-6 relative">
                        <div className="absolute -top-3 -left-2 bg-[#FA4028] text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transform -rotate-2">
                            CONTEXT
                        </div>
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight pl-2">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground uppercase tracking-wider pl-2 mt-1">
                            {description}
                        </DialogDescription>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between mb-4 border-b pb-2 border-dashed border-black/20">
                        <span className="text-xs font-bold uppercase text-muted-foreground">
                            {selectedIds.size} / {sources.length} SELECTED
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleAll}
                            className="h-6 text-[10px] uppercase font-bold text-[#FA4028] hover:bg-red-50"
                        >
                            {selectedIds.size === sources.length ? "DESELECT_ALL" : "SELECT_ALL"}
                        </Button>
                    </div>

                    {/* Source List */}
                    <div className="border-2 border-black/10 dark:border-white/10 p-1 mb-6 bg-zinc-50 dark:bg-zinc-900/50">
                        <ScrollArea className="h-[240px] pr-3">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span className="text-xs uppercase font-bold">LOADING_SOURCES...</span>
                                </div>
                            ) : sources.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-4">
                                    <FileText className="h-8 w-8 mb-2 opacity-50" />
                                    <span className="text-xs uppercase font-bold">NO SOURCES LINKED</span>
                                    <span className="text-[10px]">Upload files in Project Settings first.</span>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {sources.map(source => (
                                        <div
                                            key={source.id}
                                            className="flex items-start gap-3 p-3 hover:bg-white dark:hover:bg-black border border-transparent hover:border-black/5 transition-colors cursor-pointer group"
                                            onClick={() => toggleSource(source.id, !selectedIds.has(source.id))}
                                        >
                                            <Checkbox
                                                checked={selectedIds.has(source.id)}
                                                onCheckedChange={(checked) => toggleSource(source.id, checked as boolean)}
                                                className="mt-0.5 rounded-none border-2 border-black data-[state=checked]:bg-[#FA4028] data-[state=checked]:border-[#FA4028]"
                                            />
                                            <div className="flex-1 grid gap-0.5">
                                                <Label className="text-sm font-bold cursor-pointer group-hover:text-[#FA4028] transition-colors line-clamp-1 leading-none">
                                                    {source.title}
                                                </Label>
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                                    {source.type || 'DOCUMENT'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-none hover:bg-muted font-bold uppercase tracking-wider text-xs h-10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={loading || sources.length === 0 || selectedIds.size === 0}
                            className="rounded-none bg-[#FA4028] hover:bg-black text-white font-bold uppercase tracking-wider px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-10 text-xs"
                        >
                            Confirm_Link
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
