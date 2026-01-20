"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface GenerationModeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (mode: 'replace_all' | 'append_only') => void
    title?: string
    description?: string
    itemLabel?: string
}

export function GenerationModeDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "生成模式 // MODE",
    description = "Existing content detected. Choose how to proceed.",
    itemLabel = "章節"
}: GenerationModeDialogProps) {
    const [selectedMode, setSelectedMode] = React.useState<'replace_all' | 'append_only'>('replace_all')

    const handleConfirm = () => {
        onConfirm(selectedMode)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-hidden bg-white dark:bg-black border-2 border-black dark:border-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                <DialogTitle className="sr-only">生成模式選擇</DialogTitle>
                <div className="p-8 font-mono">
                    {/* Header */}
                    <div className="mb-8 border-2 border-dashed border-black/20 dark:border-white/20 p-6 relative">
                        <div className="absolute -top-3 left-4 bg-white dark:bg-black px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {title}
                        </div>

                        <p className="text-[10px] text-muted-foreground mb-6 uppercase tracking-tight">
                            {description}
                        </p>

                        <div className="space-y-4">
                            {/* Option 1: Replace All */}
                            <div
                                className={cn(
                                    "flex items-center gap-4 cursor-pointer group select-none transition-opacity",
                                    selectedMode === 'replace_all' ? "opacity-100" : "opacity-50 hover:opacity-100"
                                )}
                                onClick={() => setSelectedMode('replace_all')}
                            >
                                <div className={cn(
                                    "w-6 h-6 border-2 border-black dark:border-white flex items-center justify-center transition-colors rounded-none",
                                    selectedMode === 'replace_all' ? "bg-[#FA4028] border-[#FA4028]" : "bg-transparent"
                                )}>
                                    {selectedMode === 'replace_all' && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <span className="font-bold uppercase tracking-wider text-sm">
                                    覆蓋現有{itemLabel} (REPLACE_ALL)
                                </span>
                            </div>

                            {/* Option 2: Append Only */}
                            <div
                                className={cn(
                                    "flex items-center gap-4 cursor-pointer group select-none transition-opacity",
                                    selectedMode === 'append_only' ? "opacity-100" : "opacity-50 hover:opacity-100"
                                )}
                                onClick={() => setSelectedMode('append_only')}
                            >
                                <div className={cn(
                                    "w-6 h-6 border-2 border-black dark:border-white flex items-center justify-center transition-colors rounded-none",
                                    selectedMode === 'append_only' ? "bg-[#FA4028] border-[#FA4028]" : "bg-transparent"
                                )}>
                                    {selectedMode === 'append_only' && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <span className="font-bold uppercase tracking-wider text-sm">
                                    加在現有{itemLabel}後 (APPEND_ONLY)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-none hover:bg-muted font-bold uppercase tracking-wider"
                        >
                            Start_Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            className="rounded-none bg-[#FA4028] hover:bg-black text-white font-bold uppercase tracking-wider px-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                        >
                            Confirm_Execute
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
