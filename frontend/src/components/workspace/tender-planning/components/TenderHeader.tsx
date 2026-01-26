/**
 * TenderHeader Component
 *
 * Collapsible header section with navigation arrows and stage information.
 * Features brutalist styling with shadow effects.
 */

import { ChevronUp, ChevronDown, Plus } from "lucide-react";

interface TenderHeaderProps {
    /** Whether header content is expanded */
    isExpanded: boolean;
    /** Toggle header expansion */
    onToggleExpanded: () => void;
    /** Navigate to previous stage */
    onPrevStage?: () => void;
    /** Navigate to next stage */
    onNextStage?: () => void;
}

/**
 * Brutalist-styled page header with collapsible content
 */
export function TenderHeader({
    isExpanded,
    onToggleExpanded,
    onPrevStage,
    onNextStage
}: TenderHeaderProps) {
    return (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-4 pb-0 mb-4 border-b border-black/5 dark:border-white/5 transition-all duration-300">

            {/* Collapse Toggle Button */}
            <div className="absolute top-4 right-8 z-30">
                <button
                    onClick={onToggleExpanded}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-black/40 dark:text-white/40" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-black/40 dark:text-white/40" />
                    )}
                </button>
            </div>

            {/* Collapsible Title Area */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[200px] opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0'}`}>
                <div className="flex flex-col items-center">
                    <div className="relative inline-flex items-center">
                        {/* Back Navigation Arrow */}
                        {onPrevStage && (
                            <div className="absolute -left-20 top-1/2 -translate-y-1/2">
                                <button
                                    onClick={onPrevStage}
                                    className="group relative w-12 h-12 border-2 border-black dark:border-white bg-white dark:bg-black transition-all hover:translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] active:shadow-none flex items-center justify-center overflow-hidden"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        className="w-6 h-6 fill-none stroke-black dark:stroke-white stroke-[3] transition-transform group-hover:-translate-x-1"
                                    >
                                        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="square" strokeLinejoin="miter" />
                                    </svg>
                                    <div className="absolute inset-0 bg-[#FA4028] translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10 opacity-10" />
                                </button>
                            </div>
                        )}

                        <div className="bg-[#FA4028] text-white px-10 py-4 flex flex-col items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]">
                            <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                                PROPOSAL_PLANNING
                            </h2>
                        </div>

                        {/* Next Navigation Arrow */}
                        {onNextStage && (
                            <div className="absolute -right-20 top-1/2 -translate-y-1/2">
                                <button
                                    onClick={onNextStage}
                                    className="group relative w-12 h-12 border-2 border-black dark:border-white bg-white dark:bg-black transition-all hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] active:shadow-none flex items-center justify-center overflow-hidden"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        className="w-6 h-6 fill-none stroke-black dark:stroke-white stroke-[3] transition-transform group-hover:translate-x-1"
                                    >
                                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="square" strokeLinejoin="miter" />
                                    </svg>
                                    <div className="absolute inset-0 bg-[#FA4028] translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10 opacity-10" />
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="mt-4 text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">
                        Stage 03 // Structure Definition & Strategy
                    </p>
                </div>
            </div>
        </div>
    );
}
