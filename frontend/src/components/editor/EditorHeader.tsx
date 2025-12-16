"use client"

import Link from "next/link"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProjectWorkflowStepper } from "@/components/workspace/ProjectWorkflowStepper"

interface EditorHeaderProps {
    title: string
    status: string
    projectId: string
    stage?: number
    onStageSelect: (stageId: number) => void
}

export function EditorHeader({ title, status, projectId, stage = 0, onStageSelect }: EditorHeaderProps) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const response = await fetch(`/api/export?projectId=${projectId}`)
            if (!response.ok) throw new Error('Export failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_proposal.docx`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Export failed:', error)
            // Ideally show a toast here
        } finally {
            setIsExporting(false)
        }
    }

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
            case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }
    }

    return (
        <div className="flex h-16 items-center justify-between border-b px-4 md:px-6 bg-white dark:bg-black border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 mr-8">
                    <h1 className="text-lg font-semibold truncate max-w-[200px] md:max-w-xs">
                        {title}
                    </h1>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                    </span>
                </div>

                {/* Workflow Stepper */}
                <div className="flex-1 max-w-3xl hidden md:block">
                    <ProjectWorkflowStepper currentStage={stage} onStageSelect={onStageSelect} />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleExport} disabled={isExporting || status === 'processing'}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Export DOCX
                </Button>
            </div>
        </div>
    )
}
