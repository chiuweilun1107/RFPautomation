"use client"

import * as React from "react"
import { TenderSubscriptionManager } from "@/components/dashboard/tenders/TenderSubscriptionManager"
import { TenderList } from "@/components/dashboard/tenders/TenderList"
import { Search, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from 'next/link';

export default function TendersPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isSyncing, setIsSyncing] = React.useState(false);

    return (
        <div className="container mx-auto space-y-8 pb-12">
            {/* Breadcrumbs - Swiss Style */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">
                <Link href="/" className="hover:text-[#FA4028] transition-colors">HOME</Link>
                <span>/</span>
                <Link href="/dashboard" className="hover:text-[#FA4028] transition-colors">DASHBOARD</Link>
                <span>/</span>
                <span className="text-[#FA4028]">TENDER_HUB</span>
            </nav>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-black dark:border-white pb-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight font-mono uppercase">Tender_Consolidation</h2>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                        WORKSPACE_ID: 104-92-3 // TRACKING: ACTIVE
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative w-full md:w-[320px] group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-[#FA4028]" />
                        <input
                            type="text"
                            placeholder="SEARCH_TENDERS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 bg-background border border-black dark:border-white rounded-none font-mono text-xs focus:outline-none focus:border-[#FA4028] transition-colors h-10"
                        />
                    </div>
                    {/* Move Sync button here */}
                    <div id="tender-sync-portal"></div>
                </div>
            </div>

            {/* Components Section */}
            <div className="space-y-8">
                <TenderSubscriptionManager />
                <TenderList
                    searchQuery={searchQuery}
                    syncButtonPortalId="tender-sync-portal"
                />
            </div>
        </div>
    )
}
