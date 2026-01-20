"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ContentSkeleton } from "@/components/ui/skeletons/ContentSkeleton";

const TenderLaunch = dynamic(
    () => import("@/components/workspace/TenderLaunch").then((mod) => ({ default: mod.TenderLaunch })),
    { ssr: false }
);

interface LaunchPageProps {
    params: Promise<{ id: string }>;
}

export default function LaunchPage({ params }: LaunchPageProps) {
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
            <TenderLaunch
                projectId={projectId}
                onPrevStage={() => router.push(`/dashboard/${projectId}/assessment`)}
                onNextStage={() => router.push(`/dashboard/${projectId}/planning`)}
            />
        </div>
    );
}
