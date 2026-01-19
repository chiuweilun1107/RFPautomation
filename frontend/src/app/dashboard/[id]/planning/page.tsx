"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { PanelLoadingState } from "@/components/ui/loading-spinner";

// Lazy load the heavy ProposalStructureEditor component
const ProposalStructureEditor = dynamic(
    () => import("@/components/workspace/ProposalStructureEditor").then((mod) => ({ default: mod.ProposalStructureEditor })),
    {
        loading: () => <PanelLoadingState />,
        ssr: false
    }
);

interface PlanningPageProps {
    params: Promise<{ id: string }>;
}

export default function PlanningPage({ params }: PlanningPageProps) {
    const [projectId, setProjectId] = React.useState<string | null>(null);

    React.useEffect(() => {
        params.then(({ id }) => setProjectId(id));
    }, [params]);

    if (!projectId) {
        return <PanelLoadingState />;
    }

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <ProposalStructureEditor projectId={projectId} />
        </div>
    );
}
