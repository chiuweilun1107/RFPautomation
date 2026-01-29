"use client"

import * as React from "react"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Tender {
    id: string
    title: string
    org_name: string
    publish_date: string
    deadline_date: string | null
    status: string | null
    source: string
    url: string
    keyword_tag?: string
}

interface TenderListViewProps {
    tenders: Tender[]
    getDisplayStatus: (tender: Tender) => string
}

/**
 * Formats deadline date for display
 * Handles both date-only and datetime formats
 */
function formatDeadlineDate(dateStr: string | null): string {
    if (!dateStr) return '--'

    if (dateStr.includes('T')) {
        try {
            const date = new Date(dateStr)
            const yyyy = date.getFullYear()
            const mm = String(date.getMonth() + 1).padStart(2, '0')
            const dd = String(date.getDate()).padStart(2, '0')
            const hh = String(date.getHours()).padStart(2, '0')
            const min = String(date.getMinutes()).padStart(2, '0')
            return `${yyyy}-${mm}-${dd} ${hh}:${min}`
        } catch {
            return dateStr
        }
    }
    return dateStr
}

/**
 * Returns the badge color class based on tender status
 */
function getStatusBadgeClass(displayStatus: string): string {
    switch (displayStatus) {
        case '已撤案':
        case '已廢標':
            return "bg-gray-500 text-white"
        case '已決標':
            return "bg-[#285AFA] text-white"
        case '已截止':
            return "bg-[#FA4028] text-white"
        default:
            return "bg-[#00C853] text-white"
    }
}

export function TenderListView({ tenders, getDisplayStatus }: TenderListViewProps) {
    return (
        <div className="border-[1.5px] border-black dark:border-white bg-white dark:bg-black overflow-hidden rounded-none">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted border-b border-black dark:border-white hover:bg-muted font-mono">
                        <TableHead className="w-[110px] text-[10px] font-black uppercase tracking-wider text-black dark:text-white py-3">
                            Publish_Date
                        </TableHead>
                        <TableHead className="w-[110px] text-[10px] font-black uppercase tracking-wider text-black dark:text-white py-3">
                            Deadline
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white py-3">
                            Tender_Title
                        </TableHead>
                        <TableHead className="w-[160px] text-[10px] font-black uppercase tracking-wider text-black dark:text-white py-3">
                            Agency_Entity
                        </TableHead>
                        <TableHead className="w-[90px] text-[10px] font-black uppercase tracking-wider text-black dark:text-white py-3">
                            Status
                        </TableHead>
                        <TableHead className="w-[80px] text-right text-[10px] font-black uppercase tracking-wider text-black dark:text-white py-3">
                            Ops
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tenders.map((tender) => {
                        const displayStatus = getDisplayStatus(tender)

                        return (
                            <TableRow
                                key={tender.id}
                                className="hover:bg-[#FA4028]/5 transition-colors group cursor-default"
                            >
                                <TableCell className="font-mono text-[11px] font-black whitespace-nowrap text-black/60 dark:text-white/60">
                                    {tender.publish_date}
                                </TableCell>
                                <TableCell className="font-mono text-[11px] font-bold whitespace-nowrap text-[#FA4028] border-l border-black/5 dark:border-white/5">
                                    {formatDeadlineDate(tender.deadline_date)}
                                </TableCell>
                                <TableCell className="border-l border-black/5 dark:border-white/5">
                                    <div className="flex flex-col gap-0.5">
                                        <span className={cn(
                                            "font-mono text-xs font-black uppercase group-hover:text-[#FA4028] transition-colors line-clamp-1",
                                            tender.status === '已撤案' && "line-through opacity-40"
                                        )}>
                                            {tender.title}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Badge className="rounded-none border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[9px] font-bold text-black/40 dark:text-white/40 px-1 py-0">
                                                {tender.source}
                                            </Badge>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-[11px] font-bold text-black/60 dark:text-white/60 border-l border-black/5 dark:border-white/5">
                                    <span className="line-clamp-1" title={tender.org_name}>
                                        {tender.org_name}
                                    </span>
                                </TableCell>
                                <TableCell className="border-l border-black/5 dark:border-white/5">
                                    <Badge className={cn(
                                        "rounded-none text-[9px] font-black uppercase px-1.5 py-0.5",
                                        getStatusBadgeClass(displayStatus)
                                    )}>
                                        {displayStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right border-l border-black/5 dark:border-white/5">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-none text-gray-400 hover:text-white hover:bg-black dark:hover:bg-white dark:hover:text-black transition-colors"
                                        asChild
                                    >
                                        <a href={tender.url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
