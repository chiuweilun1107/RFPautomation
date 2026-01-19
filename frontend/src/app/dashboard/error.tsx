'use client';

import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto py-6">
      <ErrorBoundary error={error} reset={reset} />
    </div>
  );
}
