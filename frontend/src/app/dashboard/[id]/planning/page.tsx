"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ContentSkeleton } from "@/components/ui/skeletons/ContentSkeleton";

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

    // Show loading skeleton instead of null to prevent hydration mismatch
    if (!projectId) {
        return (
            <div className="h-full flex flex-col">
                <ContentSkeleton />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <TenderPlanning
                projectId={projectId}
                onPrevStage={() => router.push(`/dashboard/${projectId}/launch`)}
                onNextStage={() => router.push(`/dashboard/${projectId}/writing`)}
            />
        </div>
    );
}
