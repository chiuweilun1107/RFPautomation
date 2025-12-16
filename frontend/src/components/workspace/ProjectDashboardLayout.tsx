"use client";

import { useState } from "react";
import { KnowledgeSidebar } from "@/components/workspace/KnowledgeSidebar";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { SourceDetailPanel } from "@/components/workspace/SourceDetailPanel";
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
        <div className="flex h-screen bg-background overflow-hidden relative">
            {/* Left Sidebar: Knowledge Base */}
            <KnowledgeSidebar
                projectId={project.id}
                onSelectSource={setSelectedSource}
            />

            {/* Main Content: Document Editor or Source Detail */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <EditorHeader
                    title={project.title}
                    status={project.status}
                    projectId={project.id}
                    stage={project.stage || 0}
                    onStageSelect={onStageSelect || (() => { })}
                />

                <main className="flex-1 overflow-y-auto bg-white/50 dark:bg-black/50 p-8">
                    {selectedSource ? (
                        <div className="max-w-5xl mx-auto pb-20 h-full">
                            <SourceDetailPanel
                                source={selectedSource}
                                onClose={() => setSelectedSource(null)}
                                onGenerateSummary={handleGenerateSummary}
                            />
                        </div>
                    ) : (
                        children
                    )}
                </main>
            </div>
        </div>
    );
}
