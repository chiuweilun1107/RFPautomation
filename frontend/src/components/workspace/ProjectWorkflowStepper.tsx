import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export enum ProjectStage {
    Assessment = 0,    // 標案初評
    Launch = 1,        // 領標啟動
    Planning = 2,      // 標書規劃
    Writing = 3,       // 文件撰寫
    Review = 4,        // 簡報評選
    Handover = 5       // 決標移交
}

interface ProjectWorkflowStepperProps {
    currentStage: number;
    className?: string;
    onStageSelect: (stageId: number) => void;
}

const STAGES = [
    { id: 0, label: "Assessment" },
    { id: 1, label: "Tender_Launch" },
    { id: 2, label: "Planning" },
    { id: 3, label: "Writing" },
    { id: 4, label: "Review" },
    { id: 5, label: "Handover" },
];

export function ProjectWorkflowStepper({ currentStage, className, onStageSelect }: ProjectWorkflowStepperProps) {
    return (
        <div className={cn("w-full py-4", className)}>
            <div className="flex items-start w-full font-mono">
                {STAGES.map((stage, index) => {
                    const isCompleted = currentStage > stage.id;
                    const isCurrent = currentStage === stage.id;
                    const isLast = index === STAGES.length - 1;

                    return (
                        <div
                            key={stage.id}
                            className="flex-1 relative flex flex-col items-center group cursor-pointer"
                            onClick={() => onStageSelect(stage.id)}
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
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
