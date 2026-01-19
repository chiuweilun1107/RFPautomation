"use client"

import * as React from 'react';
import { Suspense } from 'react';
import { ProjectList } from "@/components/dashboard/ProjectList";
import { ProjectListSkeleton } from '@/components/ui/skeletons/ProjectListSkeleton';
import { CreateProjectDialog } from '@/components/dashboard/CreateProjectDialog';
import { Search } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const [searchQuery, setSearchQuery] = React.useState("");

    return (
        <div className="container mx-auto space-y-8 pb-12">
            {/* Breadcrumbs - Swiss Style */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">
                <Link href="/" className="hover:text-[#FA4028] transition-colors">HOME</Link>
                <span>/</span>
                <span className="text-[#FA4028]">DASHBOARD</span>
            </nav>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-black dark:border-white pb-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight font-mono uppercase">Project_Dashboard</h2>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                        WORKSPACE_ID: 104-92-3 // ACCESS: VERIFIED
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative w-full md:w-[320px] group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-[#FA4028]" />
                        <input
                            type="text"
                            placeholder="SEARCH_PROJECTS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 bg-background border border-black dark:border-white rounded-none font-mono text-xs focus:outline-none focus:border-[#FA4028] transition-colors h-10"
                        />
                    </div>
                    <CreateProjectDialog />
                </div>
            </div>

            {/* Projects Section */}
            <div className="space-y-6">
                <div className="space-y-1">
                    <h2 className="text-sm font-black uppercase tracking-widest text-[#00063D] dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#FA4028]"></span>
                        Project_Inventory
                    </h2>
                    <p className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400">
                        WORKSPACE_STATUS: // 管理您的所有開發專案
                    </p>
                </div>

                <Suspense fallback={<ProjectListSkeleton />}>
                    <ProjectList searchQuery={searchQuery} />
                </Suspense>
            </div>
        </div>
    );
}
