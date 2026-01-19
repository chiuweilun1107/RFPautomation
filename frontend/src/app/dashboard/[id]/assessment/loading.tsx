import { ContentSkeleton } from '@/components/ui/skeletons/ContentSkeleton';

export default function AssessmentLoading() {
  return (
    <div className="container mx-auto py-6">
      <ContentSkeleton />
    </div>
  );
}
