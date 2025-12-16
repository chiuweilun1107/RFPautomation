"use client";

import { useState } from "react";
import { ProjectDashboardLayout } from "@/components/workspace/ProjectDashboardLayout";
import { SectionList } from "@/components/editor/SectionList";
import { ProjectStage } from "@/components/workspace/ProjectWorkflowStepper";
import { AssessmentTable } from "@/components/workspace/AssessmentTable";

interface ProjectDashboardClientProps {
    project: any;
    sections: any[];
}

export function ProjectDashboardClient({ project, sections }: ProjectDashboardClientProps) {
    // Initialize stage from project data, default to Assessment (0)
    const [activeStage, setActiveStage] = useState<number>(project.stage || 0);

    const handleStageSelect = (stageId: number) => {
        setActiveStage(stageId);
        // Optional: Update project stage in DB via API if persistence is needed immediately
        // For now, it's a view state
    };

    // Render content based on active stage
    const renderStageContent = () => {
        switch (activeStage) {
            case ProjectStage.Assessment: // 0
                return (
                    <div className="max-w-6xl mx-auto pb-20">
                        <AssessmentTable />
                    </div>
                );
            case ProjectStage.Launch: // 1
                return (
                    <div className="max-w-4xl mx-auto pb-20 text-center py-20">
                        <h2 className="text-2xl font-bold mb-4">領標啟動 (Tender Launch)</h2>
                        <p className="text-muted-foreground">在此階段管理領標文件與相關作業。</p>
                        {/* Placeholder for future implementation */}
                    </div>
                );
            case ProjectStage.Planning: // 2
                return (
                    <div className="max-w-4xl mx-auto pb-20 text-center py-20">
                        <h2 className="text-2xl font-bold mb-4">標書規劃 (Proposal Planning)</h2>
                        <p className="text-muted-foreground">在此階段規劃標書架構與分工。</p>
                    </div>
                );
            case ProjectStage.Writing: // 3
                return (
                    <div className="max-w-4xl mx-auto pb-20">
                        <SectionList sections={sections} projectId={project.id} />
                    </div>
                );
            case ProjectStage.Review: // 4
                return (
                    <div className="max-w-4xl mx-auto pb-20 text-center py-20">
                        <h2 className="text-2xl font-bold mb-4">簡報評選 (Presentation Selection)</h2>
                        <p className="text-muted-foreground">在此階段準備簡報材料與演練。</p>
                    </div>
                );
            case ProjectStage.Handover: // 5
                return (
                    <div className="max-w-4xl mx-auto pb-20 text-center py-20">
                        <h2 className="text-2xl font-bold mb-4">決標移交 (Award & Handover)</h2>
                        <p className="text-muted-foreground">在此階段處理結案與移交事項。</p>
                    </div>
                );
            default:
                return (
                    <div className="max-w-4xl mx-auto pb-20 text-center py-20">
                        <p className="text-muted-foreground">Select a stage to view content.</p>
                    </div>
                );
        }
    };

    return (
        <ProjectDashboardLayout
            project={{ ...project, stage: activeStage }} // Override project stage with local state
            onStageSelect={handleStageSelect}
        >
            {renderStageContent()}
        </ProjectDashboardLayout>
    );
}
