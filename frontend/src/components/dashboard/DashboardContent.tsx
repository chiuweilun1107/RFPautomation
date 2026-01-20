"use client"

import * as React from 'react';
import { ProjectList } from "@/components/dashboard/ProjectList";
import { ProjectListSkeleton } from '@/components/ui/skeletons/ProjectListSkeleton';
import { CreateProjectDialog } from '@/components/dashboard/CreateProjectDialog';
import { DashboardSearchBar } from '@/components/dashboard/DashboardSearchBar';
import Link from 'next/link';

export function DashboardContent() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <div className="container mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                    <DashboardSearchBar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />
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

                {isMounted ? (
                    <ProjectList searchQuery={searchQuery} />
                ) : (
                    <ProjectListSkeleton />
                )}
            </div>
        </div>
    );
}
