import { ProjectList } from "@/components/dashboard/ProjectList"
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog"

export default function DashboardPage() {
    return (
        <div className="container mx-auto space-y-8">
            <div className="flex items-center justify-between space-y-2 border-b border-black dark:border-white pb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tighter font-mono uppercase">Your Projects</h2>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                        Workspace_ID: 104-92-3
                    </p>
                </div>
                {/* Dialog moved to inside ProjectList for better toolbar integration, or kept here if needed. 
                    Checking ProjectList.tsx, it includes the Dialog in the toolbar. 
                    So we can remove it from here or keep it as a secondary action. 
                    Actually, it's cleaner to remove it from here if it's already in the list toolbar.
                    Let's checking ProjectList again... yes, ProjectList has its own toolbar with CreateProjectDialog.
                    So I will REMOVE the button from here to avoid duplication and clutter.
                */}
            </div>

            <ProjectList />
        </div>
    )
}
