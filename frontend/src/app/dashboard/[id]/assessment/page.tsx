"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ContentSkeleton } from "@/components/ui/skeletons/ContentSkeleton";

const AssessmentTable = dynamic(
    () => import("@/components/workspace/AssessmentTable").then((mod) => ({ default: mod.AssessmentTable })),
    { ssr: false }
);

interface AssessmentPageProps {
    params: Promise<{ id: string }>;
}

export default function AssessmentPage({ params }: AssessmentPageProps) {
    // Handle async params in client component
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
            <AssessmentTable
                projectId={projectId}
                onNextStage={() => router.push(`/dashboard/${projectId}/launch`)}
            />
        </div>
    );
}
