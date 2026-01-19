"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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

    if (!projectId) {
        return <LoadingSpinner size="lg" text="載入中..." />;
    }

    return (
        <div className="h-full w-full bg-background">
            <TenderLaunch
                projectId={projectId}
                onPrevStage={() => router.push(`/dashboard/${projectId}/assessment`)}
                onNextStage={() => router.push(`/dashboard/${projectId}/planning`)}
            />
        </div>
    );
}
