"use client"

import { Check } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export enum ProjectStage {
    Assessment = 0,    // 標案初評
    Launch = 1,        // 領標啟動
    Planning = 2,      // 標書規劃
    Writing = 3,       // 文件撰寫
    Review = 4,        // 簡報評選
    Handover = 5       // 決標移交
}

interface ProjectWorkflowStepperProps {
    projectId: string;
    className?: string;
}

const STAGES = [
    { id: 0, label: "Assessment", path: "assessment" },
    { id: 1, label: "Tender_Launch", path: "launch" },
    { id: 2, label: "Planning", path: "planning" },
    { id: 3, label: "Writing", path: "writing" },
    { id: 4, label: "Review", path: "presentation" },
    { id: 5, label: "Handover", path: "handover" },
];

export function ProjectWorkflowStepper({ projectId, className }: ProjectWorkflowStepperProps) {
    const [currentStage, setCurrentStage] = useState(0);
    const pathname = usePathname();

    useEffect(() => {
        // Determine current stage from pathname after mount to ensure server/client consistency
        let stage = 0;
        if (pathname.includes('/launch')) stage = 1;
        else if (pathname.includes('/planning')) stage = 2;
        else if (pathname.includes('/writing')) stage = 3;
        else if (pathname.includes('/presentation')) stage = 4;
        else if (pathname.includes('/handover')) stage = 5;

        setCurrentStage(stage);
    }, [pathname]);

    return (
        <div className={cn("w-full py-4", className)}>
            <div className="flex items-start w-full font-mono">
                {STAGES.map((stage, index) => {
                    const isCompleted = currentStage > stage.id;
                    const isCurrent = currentStage === stage.id;
                    const isLast = index === STAGES.length - 1;

                    return (
                        <Link
                            key={stage.id}
                            href={`/dashboard/${projectId}/${stage.path}`}
                            className="flex-1 relative flex flex-col items-center group cursor-pointer"
                        >
                            {/* Connecting Line (To the right) */}
                            {!isLast && (
                                <>
                                    {/* Grey Background Line */}
                                    <div className="absolute top-4 left-[50%] w-full h-[1px] bg-black/20 dark:bg-white/20" />

                                    {/* Colored Active Line */}
                                    <div
                                        className={cn(
                                            "absolute top-4 left-[50%] w-full h-[1px] bg-black dark:bg-white transition-all duration-500 origin-left scale-x-0",
                                            isCompleted && "scale-x-100"
                                        )}
                                    />
                                </>
                            )}

                            {/* Step Box */}
                            <div
                                className={cn(
                                    "relative flex items-center justify-center w-8 h-8 border transition-all duration-300 bg-white dark:bg-black z-10 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black",
                                    isCompleted && "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black",
                                    isCurrent && "border-black text-black ring-1 ring-black ring-offset-2 dark:border-white dark:text-white dark:ring-white dark:ring-offset-black",
                                    !isCompleted && !isCurrent && "border-gray-300 text-gray-400 dark:border-gray-700 dark:text-gray-600"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <span className="text-[10px] font-bold">{(index + 1).toString().padStart(2, '0')}</span>
                                )}
                            </div>

                            {/* Label */}
                            <span
                                className={cn(
                                    "mt-2 text-[10px] uppercase tracking-wider font-medium whitespace-nowrap transition-colors duration-300",
                                    isCompleted && "text-black dark:text-white",
                                    isCurrent && "text-black font-bold dark:text-white",
                                    !isCompleted && !isCurrent && "text-gray-400 dark:text-gray-600"
                                )}
                            >
                                {stage.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
