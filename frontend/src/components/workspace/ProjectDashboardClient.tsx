"use client";

import { useState } from "react";
import { ProjectDashboardLayout } from "@/components/workspace/ProjectDashboardLayout";
import { SectionList } from "@/components/editor/SectionList";
import { ProjectStage, ProjectWorkflowStepper } from "@/components/workspace/ProjectWorkflowStepper";
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
                        <AssessmentTable projectId={project.id} />
                    </div>
                );
            case ProjectStage.Launch: // 1
                return (
                    <div className="max-w-4xl mx-auto pb-20 text-center py-20 font-mono">
                        <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Tender_Launch</h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            System_Status: Pending_Implementation
                            <br />
                            Management of acquisition documents and preliminary logistics.
                        </p>
                    </div>
                );
            case ProjectStage.Planning: // 2
                return (
                    <div className="max-w-4xl mx-auto pb-20 text-center py-20 font-mono">
                        <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Proposal_Planning</h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            System_Status: Pending_Implementation
                            <br />
                            Structural architecture and resource allocation strategy.
                        </p>
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
                    <div className="max-w-4xl mx-auto pb-20 text-center py-20 font-mono">
                        <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Presentation_Selection</h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            System_Status: Pending_Implementation
                            <br />
                            Materials preparation and simulation for review panel.
                        </p>
                    </div>
                );
            case ProjectStage.Handover: // 5
                return (
                    <div className="max-w-4xl mx-auto pb-20 text-center py-20 font-mono">
                        <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Award_Handover</h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            System_Status: Pending_Implementation
                            <br />
                            Final project resolution and transition protocol.
                        </p>
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
