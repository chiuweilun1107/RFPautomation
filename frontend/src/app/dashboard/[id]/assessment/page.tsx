"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const AssessmentTable = dynamic(
    () => import("@/components/workspace/AssessmentTable").then((mod) => ({ default: mod.AssessmentTable })),
    {
        loading: () => <LoadingSpinner size="lg" text="載入評估表..." />,
        ssr: false
    }
);

interface AssessmentPageProps {
    params: Promise<{ id: string }>;
}

export default function AssessmentPage({ params }: AssessmentPageProps) {
    // Handle async params in client component
    const [projectId, setProjectId] = React.useState<string | null>(null);

    React.useEffect(() => {
        params.then(({ id }) => setProjectId(id));
    }, [params]);

    if (!projectId) {
        return <LoadingSpinner size="lg" text="載入中..." />;
    }

    return (
        <div className="h-full flex flex-col">
            <AssessmentTable projectId={projectId} />
        </div>
    );
}
