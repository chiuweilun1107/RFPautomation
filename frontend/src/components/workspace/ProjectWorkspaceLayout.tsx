"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { KnowledgeSidebar } from "@/components/workspace/KnowledgeSidebar";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { SourceDetailPanel } from "@/components/workspace/SourceDetailPanel";
import { toast } from "sonner";
import { ProjectStage } from "@/components/workspace/ProjectWorkflowStepper";
import { sourcesApi } from "@/features/sources/api/sourcesApi";

interface ProjectWorkspaceLayoutProps {
    project: any;
    children: React.ReactNode;
}

export function ProjectWorkspaceLayout({ project, children }: ProjectWorkspaceLayoutProps) {
    const [selectedSource, setSelectedSource] = useState<any | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const pathname = usePathname();

    // Determine current stage from pathname
    const getStageFromPath = (path: string): number => {
        if (path.includes('/assessment')) return ProjectStage.Assessment; // 0
        if (path.includes('/launch')) return ProjectStage.Launch; // 1
        if (path.includes('/planning')) return ProjectStage.Planning; // 2
        if (path.includes('/writing')) return ProjectStage.Writing; // 3
        if (path.includes('/presentation')) return ProjectStage.Review; // 4
        if (path.includes('/handover')) return ProjectStage.Handover; // 5
        return ProjectStage.Assessment; // Default
    };

    const currentStage = getStageFromPath(pathname);

    const handleGenerateSummary = async (sourceId: string) => {
        try {
            const data = await sourcesApi.summarize(sourceId);

            setSelectedSource((prev: any) => prev ? {
                ...prev,
                summary: data.summary,
                topics: data.topics
            } : null);

            toast.success('摘要生成成功');
        } catch (error) {
            console.error('Error generating summary:', error);
            toast.error('摘要生成失敗');
        }
    };

    return (
        <div className="flex h-full bg-transparent overflow-hidden relative p-4 gap-4">
            {/* Left Sidebar: Knowledge Base */}
            <div className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-0' : 'w-[380px]'} relative group/sidebar`}>
                <div className={`h-full bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? 'invisible opacity-0' : 'visible opacity-100'}`}>
                    <KnowledgeSidebar
                        projectId={project.id}
                        onSelectSource={setSelectedSource}
                        isCollapsed={isSidebarCollapsed}
                        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    />
                </div>

                {/* Floating Toggle Button when collapsed */}
                {isSidebarCollapsed && (
                    <button
                        onClick={() => setIsSidebarCollapsed(false)}
                        className="absolute left-0 top-6 z-50 p-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-400 hover:text-blue-600 group flex flex-col items-center gap-1"
                        style={{ transform: 'translateX(-50%)' }}
                        title="展開側邊欄"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Main Content Area: Studio Workspace */}
            <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {/* Integrated Header */}
                <div className="shrink-0 bg-white dark:bg-gray-950 z-30 border-b border-gray-50 dark:border-gray-900/50">
                    <EditorHeader
                        title={project.title}
                        status={project.status}
                        projectId={project.id}
                        stage={currentStage}
                    // onStageSelect is no longer needed as we use Links
                    />
                </div>

                {/* Content Section Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    <main className="min-h-full">
                        {selectedSource ? (
                            <SourceDetailPanel
                                source={selectedSource}
                                onClose={() => setSelectedSource(null)}
                                onGenerateSummary={handleGenerateSummary}
                            />
                        ) : (
                            <div className="w-full max-w-7xl mx-auto px-8 py-10">
                                {children}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
