"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ContentSkeleton } from "@/components/ui/skeletons/ContentSkeleton";

const WritingTable = dynamic(
    () => import("@/components/workspace/WritingTable").then((mod) => ({ default: mod.WritingTable })),
    { ssr: false }
);

interface WritingPageProps {
    params: Promise<{ id: string }>;
}

export default function WritingPage({ params }: WritingPageProps) {
    const [projectId, setProjectId] = React.useState<string | null>(null);

    React.useEffect(() => {
        params.then(({ id }) => setProjectId(id));
    }, [params]);

    // Show loading skeleton instead of null to prevent hydration mismatch
    if (!projectId) {
        return (
            <div className="h-full flex flex-col p-8 md:px-12">
                <ContentSkeleton />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <WritingTable projectId={projectId} />
        </div>
    );
}
