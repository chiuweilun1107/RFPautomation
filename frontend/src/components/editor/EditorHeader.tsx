"use client"

import Link from "next/link"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"


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
            case 'completed': return 'bg-white text-green-700 border-green-700 dark:bg-black dark:text-green-400 dark:border-green-400'
            case 'processing': return 'bg-white text-yellow-700 border-yellow-700 dark:bg-black dark:text-yellow-400 dark:border-yellow-400'
            case 'active': return 'bg-white text-blue-700 border-blue-700 dark:bg-black dark:text-blue-400 dark:border-blue-400'
            default: return 'bg-white text-gray-700 border-gray-700 dark:bg-black dark:text-gray-400 dark:border-gray-400'
        }
    }

    return (
        <div className="flex h-16 items-center justify-between border-b px-4 md:px-6 bg-white dark:bg-black border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-4 mr-8">
                    <h1 className="text-lg font-bold font-mono uppercase tracking-tight truncate max-w-[200px] md:max-w-xs">
                        {title}
                    </h1>
                    <span className={`inline-flex items-center border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${getStatusColor(status)}`}>
                        {status}
                    </span>
                </div>

                {/* Workflow Stepper */}

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
