"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, FileText, ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ContentSkeleton } from "@/components/ui/skeletons/ContentSkeleton";
import { useWritingTableData } from "./hooks/useWritingTableData";

const SectionList = dynamic(
    () => import("@/components/editor/SectionList").then((mod) => ({ default: mod.SectionList })),
    { ssr: false }
);

const TableOfContentsGenerator = dynamic(
    () => import("@/components/editor/TableOfContentsGenerator").then((mod) => ({ default: mod.TableOfContentsGenerator })),
    { ssr: false }
);

interface WritingTableProps {
    projectId: string;
}

export function WritingTable({ projectId }: WritingTableProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<string>('summary');
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

    const { loading, error, chapters, flatSections } = useWritingTableData({ projectId });

    if (error) {
        return (
            <div className="border border-red-600 p-8 flex flex-col items-center justify-center space-y-4 bg-red-50 dark:bg-red-950/20 font-mono">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="text-center">
                    <p className="text-red-600 font-black uppercase tracking-tighter">System_Error: Connection_Failed</p>
                    <p className="text-[10px] opacity-60 mt-2">{error}</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-full flex flex-col p-8 md:px-12">
                <ContentSkeleton />
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <div className="flex w-full min-h-full gap-8 relative font-mono">
                {/* Main Content Area */}
                <div className="flex-1">
                    {/* Sticky Header Container */}
                    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-4 pb-0 mb-4 border-b border-black/5 dark:border-white/5 transition-all duration-300">
                        {/* Collapse Toggle Button */}
                        <div className="absolute top-4 right-8 z-30">
                            <button
                                onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                            >
                                {isHeaderExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-black/40 dark:text-white/40" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-black/40 dark:text-white/40" />
                                )}
                            </button>
                        </div>

                        {/* Collapsible Title Area */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isHeaderExpanded ? 'max-h-[200px] opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0'}`}>
                            <div className="flex flex-col items-center">
                                <div className="relative inline-flex items-center">
                                    {/* Back Navigation Arrow */}
                                    <div className="absolute -left-20 top-1/2 -translate-y-1/2">
                                        <button
                                            onClick={() => router.push(`/dashboard/${projectId}/planning`)}
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

                                    <div className="bg-[#FA4028] text-white px-10 py-4 flex flex-col items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]">
                                        <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                                            PROPOSAL_WRITING
                                        </h2>
                                    </div>

                                    {/* Next Navigation Arrow */}
                                    <div className="absolute -right-20 top-1/2 -translate-y-1/2">
                                        <button
                                            onClick={() => router.push(`/dashboard/${projectId}/presentation`)}
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
                                </div>
                                <p className="mt-4 text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">
                                    Stage 04 // Content Generation & Drafting
                                </p>
                            </div>
                        </div>

                        {/* Centered Tabs List */}
                        <div className="flex justify-center w-full overflow-x-auto pb-2">
                            <div className="h-auto bg-transparent rounded-none p-0 gap-6 flex flex-nowrap min-w-min px-4">
                                <button
                                    onClick={() => setActiveTab('summary')}
                                    className={`
                                        rounded-none border-b-2 px-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all bg-transparent shadow-none italic whitespace-nowrap
                                        ${activeTab === 'summary'
                                            ? 'border-[#FA4028] text-[#FA4028] opacity-100'
                                            : 'border-transparent text-foreground hover:text-[#FA4028] opacity-60'
                                        }
                                    `}
                                >
                                    SUMMARY_&_TOC
                                </button>
                                {chapters.map((chapter) => (
                                    <button
                                        key={chapter.id}
                                        onClick={() => setActiveTab(chapter.id)}
                                        className={`
                                            rounded-none border-b-2 px-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all bg-transparent shadow-none italic whitespace-nowrap
                                            ${activeTab === chapter.id
                                                ? 'border-[#FA4028] text-[#FA4028] opacity-100'
                                                : 'border-transparent text-foreground hover:text-[#FA4028] opacity-60'
                                            }
                                        `}
                                    >
                                        {(chapter.title || chapter.content || 'UNTITLED').substring(0, 20)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="pb-20 px-4 md:px-0">
                        {/* Summary Tab */}
                        {activeTab === 'summary' && (
                            <div className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                                <div className="space-y-8">
                                    <TableOfContentsGenerator
                                        projectId={projectId}
                                        sections={flatSections}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Chapter Tabs */}
                        {chapters.map((chapter) => {
                            if (activeTab !== chapter.id) return null;

                            return (
                                <div key={chapter.id} className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                                    <SectionList sections={[chapter]} projectId={projectId} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
