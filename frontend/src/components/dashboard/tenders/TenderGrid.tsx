"use client"

import * as React from "react"
import { ExternalLink, Calendar, Building2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TenderGridProps {
    tenders: any[];
}

export function TenderGrid({ tenders }: TenderGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenders.map((tender) => (
                <div
                    key={tender.id}
                    className="flex flex-col border-[1.5px] border-black dark:border-white bg-white dark:bg-black rounded-none group hover:shadow-[8px_8px_0px_0px_#FA4028] transition-all duration-300"
                >
                    {/* Top Banner (Metadata) */}
                    <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10">
                        <div className="flex items-center gap-2">
                            <Badge className="rounded-none bg-black text-white dark:bg-white dark:text-black text-[9px] font-black uppercase px-2 py-0.5">
                                {tender.source.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="font-mono text-[9px] font-black text-black/40 dark:text-white/40 uppercase">
                            ID: {String(tender.id || '').slice(0, 8)}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-6 flex-1 flex flex-col gap-4">
                        <div className="space-y-2">
                            <h3 className="font-mono text-lg font-black uppercase leading-tight tracking-tighter group-hover:text-[#FA4028] transition-colors line-clamp-2">
                                {tender.title}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] font-bold font-mono text-black/60 dark:text-white/60">
                                <Building2 className="h-3 w-3 text-[#FA4028]" />
                                <span className="truncate">{tender.org_name}</span>
                            </div>
                        </div>

                        {/* Middle Metadata */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/5 dark:border-white/5">
                            <div className="space-y-1">
                                <div className="text-[8px] font-black uppercase text-black/40 dark:text-white/40 tracking-widest">PUBLISH_DATE</div>
                                <div className="flex items-center gap-2 text-[10px] font-bold font-mono">
                                    <Calendar className="h-3 w-3 text-[#FA4028]" />
                                    {tender.publish_date}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[8px] font-black uppercase text-black/40 dark:text-white/40 tracking-widest">KEYWORD_TAG</div>
                                <div className="flex items-center gap-2 text-[10px] font-bold font-mono">
                                    <Tag className="h-3 w-3 text-[#FA4028]" />
                                    <span className="truncate">{tender.keyword_tag}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Banner */}
                    <div className="flex items-center justify-between p-4 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                        <div className="text-[10px] font-mono font-bold uppercase opacity-40 italic">
                            // READY_FOR_BID
                        </div>
                        <Button
                            variant="default"
                            size="sm"
                            className="h-8 rounded-none bg-black text-white dark:bg-white dark:text-black hover:bg-[#FA4028] dark:hover:bg-[#FA4028] hover:text-white transition-colors text-[10px] font-black uppercase px-4"
                            asChild
                        >
                            <a href={tender.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                VIEW_TENDER
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}
