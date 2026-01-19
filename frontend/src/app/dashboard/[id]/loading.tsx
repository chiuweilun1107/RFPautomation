import { ProjectDashboardSkeleton } from '@/components/ui/skeletons/ProjectDashboardSkeleton';

export default function ProjectDashboardLoading() {
  return (
    <div className="container mx-auto py-6">
      <ProjectDashboardSkeleton />
    </div>
  );
}
