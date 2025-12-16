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
    { id: 0, label: "標案初評" },
    { id: 1, label: "領標啟動" },
    { id: 2, label: "標書規劃" },
    { id: 3, label: "文件撰寫" },
    { id: 4, label: "簡報評選" },
    { id: 5, label: "決標移交" },
];

export function ProjectWorkflowStepper({ currentStage, className, onStageSelect }: ProjectWorkflowStepperProps) {
    return (
        <div className={cn("w-full py-4", className)}>
            <div className="flex items-start w-full">
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
                                    <div className="absolute top-4 left-[50%] w-full h-[2px] bg-gray-200 dark:bg-gray-700" />

                                    {/* Colored Active Line */}
                                    <div
                                        className={cn(
                                            "absolute top-4 left-[50%] w-full h-[2px] bg-primary transition-all duration-500 origin-left scale-x-0",
                                            isCompleted && "scale-x-100"
                                        )}
                                    />
                                </>
                            )}

                            {/* Step Circle */}
                            <div
                                className={cn(
                                    "relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 bg-background z-10 group-hover:border-primary/50",
                                    isCompleted && "bg-primary border-primary text-primary-foreground",
                                    isCurrent && "border-primary text-primary ring-4 ring-primary/20",
                                    !isCompleted && !isCurrent && "border-muted text-muted-foreground"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <span className="text-xs font-semibold">{index + 1}</span>
                                )}
                            </div>

                            {/* Label */}
                            <span
                                className={cn(
                                    "mt-2 text-[10px] md:text-xs font-medium whitespace-nowrap transition-colors duration-300",
                                    isCompleted && "text-primary/80",
                                    isCurrent && "text-primary font-bold",
                                    !isCompleted && !isCurrent && "text-muted-foreground"
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
