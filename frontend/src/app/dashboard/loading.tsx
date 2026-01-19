import { ProjectListSkeleton } from '@/components/ui/skeletons/ProjectListSkeleton';

export default function DashboardLoading() {
  return (
    <div className="container mx-auto py-6">
      <ProjectListSkeleton />
    </div>
  );
}
