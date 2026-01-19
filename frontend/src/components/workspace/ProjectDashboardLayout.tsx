"use client";

import { useState } from "react";
import { KnowledgeSidebar } from "@/components/workspace/KnowledgeSidebar";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { SourceDetailPanel } from "@/components/workspace/SourceDetailPanel";
import { ProjectWorkflowStepper } from "@/components/workspace/ProjectWorkflowStepper";
import { toast } from "sonner";

interface ProjectDashboardLayoutProps {
    project: any;
    children: React.ReactNode;
    onStageSelect?: (stage: number) => void;
}

export function ProjectDashboardLayout({ project, children, onStageSelect }: ProjectDashboardLayoutProps) {
    const [selectedSource, setSelectedSource] = useState<any | null>(null);

    const handleGenerateSummary = async (sourceId: string) => {
        try {
            const response = await fetch('/api/sources/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sourceId }),
            });

            if (!response.ok) throw new Error('Failed to generate summary');

            const data = await response.json();

            // Update local state to show new summary immediately
            // Note: Supabase Realtime in SourceManager will handle the sidebar update
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
        <div className="flex h-screen bg-gray-50 dark:bg-zinc-900 overflow-hidden relative font-mono text-black dark:text-white p-4 gap-4">
            {/* Left Sidebar: Knowledge Base */}
            <KnowledgeSidebar
                projectId={project.id}
                onSelectSource={setSelectedSource}
            />

            {/* Main Content: Document Editor or Source Detail */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-black border border-black dark:border-white">
                <EditorHeader
                    title={project.title}
                    status={project.status}
                    projectId={project.id}
                    stage={project.stage || 0}
                    onStageSelect={onStageSelect || (() => { })}
                />

                {/* Workflow Ribbon (Separated from Header) */}
                <div className="border-b border-black/10 dark:border-white/10 bg-white dark:bg-black px-4 py-2">
                    <ProjectWorkflowStepper
                        currentStage={project.stage || 0}
                        onStageSelect={onStageSelect || (() => { })}
                    />
                </div>

                <main className="flex-1 overflow-y-auto no-scrollbar bg-white dark:bg-black p-0">
                    {selectedSource ? (
                        <div className="max-w-5xl mx-auto pb-20 h-full p-8 border-l border-black dark:border-white">
                            <SourceDetailPanel
                                source={selectedSource}
                                onClose={() => setSelectedSource(null)}
                                onGenerateSummary={handleGenerateSummary}
                            />
                        </div>
                    ) : (
                        <div className="h-full">
                            {children}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
