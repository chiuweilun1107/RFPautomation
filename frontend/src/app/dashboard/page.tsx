import { ProjectList } from "@/components/dashboard/ProjectList"
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog"

export default function DashboardPage() {
    return (
        <div className="container mx-auto space-y-8">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Your Projects</h2>
                    <p className="text-muted-foreground text-gray-500">
                        Manage your RFP responses and automation tasks.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <CreateProjectDialog />
                </div>
            </div>

            <ProjectList />
        </div>
    )
}
