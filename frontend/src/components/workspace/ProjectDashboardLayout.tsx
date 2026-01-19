import { KnowledgeSidebar } from "@/components/workspace/KnowledgeSidebar";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { ProjectWorkflowStepper } from "@/components/workspace/ProjectWorkflowStepper";
import { toast } from "sonner";

interface ProjectDashboardLayoutProps {
    project: any;
    children: React.ReactNode;
    onStageSelect?: (stage: number) => void;
}

export function ProjectDashboardLayout({ project, children, onStageSelect }: ProjectDashboardLayoutProps) {
    // Removed inline source selection handler to support draggable popup in SourceManager

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-zinc-900 overflow-hidden relative font-mono text-black dark:text-white p-4 gap-4">
            {/* Left Sidebar: Knowledge Base */}
            <KnowledgeSidebar
                projectId={project.id}
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
                    <div className="h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
