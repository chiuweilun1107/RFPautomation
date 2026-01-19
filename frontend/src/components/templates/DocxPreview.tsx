"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface DocxPreviewProps {
    fileUrl: string
    className?: string
}

export function DocxPreview({ fileUrl, className = "" }: DocxPreviewProps) {
    const [loading, setLoading] = React.useState(true)

    const handleLoad = () => {
        setLoading(false)
    }

    const handleError = () => {
        setLoading(false)
    }

    if (!fileUrl) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                無文件 URL
            </div>
        )
    }

    // Office Online Viewer - 完整支援 Word 格式和字體（包含標楷體）
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`

    return (
        <div className={`relative h-full ${className}`}>
            {loading && (
                <div className="absolute inset-0 bg-background z-10 p-6 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="space-y-2 pt-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </div>
            )}
            <iframe
                src={officeViewerUrl}
                className="w-full h-full border-0"
                onLoad={handleLoad}
                onError={handleError}
            />
        </div>
    )
}

