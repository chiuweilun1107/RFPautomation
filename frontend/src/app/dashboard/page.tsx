import { Suspense } from 'react';
import { ProjectList } from "@/components/dashboard/ProjectList";
import { ProjectListSkeleton } from '@/components/ui/skeletons/ProjectListSkeleton';

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
            </div>

            <Suspense fallback={<ProjectListSkeleton />}>
                <ProjectList />
            </Suspense>
        </div>
    );
}
