"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Lazy load the heavy TenderPlanning component
const TenderPlanning = dynamic(
    () => import("@/components/workspace/TenderPlanning").then((mod) => ({ default: mod.TenderPlanning })),
    { ssr: false }
);

interface PlanningPageProps {
    params: Promise<{ id: string }>;
}

export default function PlanningPage({ params }: PlanningPageProps) {
    const [projectId, setProjectId] = React.useState<string | null>(null);
    const router = useRouter();

    React.useEffect(() => {
        params.then(({ id }) => setProjectId(id));
    }, [params]);

    // Let loading.tsx handle the loading state via Suspense boundary
    if (!projectId) {
        return null;
    }

    return (
        <div className="h-full w-full bg-background">
            <TenderPlanning
                projectId={projectId}
                onPrevStage={() => router.push(`/dashboard/${projectId}/launch`)}
                onNextStage={() => router.push(`/dashboard/${projectId}/writing`)}
            />
        </div>
    );
}
