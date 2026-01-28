
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CitationRenderer } from "./CitationRenderer";
import { Evidence } from "./CitationBadge";
import { SourceDetailPanel } from "./SourceDetailPanel";
import { Loader2, AlertCircle, FileSearch, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { n8nApi } from "@/features/n8n/api/n8nApi";

import { RecursiveAssessmentRenderer } from "./RecursiveAssessmentRenderer";
import { createPortal } from "react-dom";


interface AssessmentTableProps {
    projectId: string;
    onNextStage?: () => void;
}

export function AssessmentTable({ projectId, onNextStage }: AssessmentTableProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any | null>(null);
    const [evidences, setEvidences] = useState<Record<string, Evidence>>({});
    const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
    const [selectedSource, setSelectedSource] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('summary');
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

    // State for Draggable Dialog
    const [position, setPosition] = useState({ x: 40, y: 150 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const supabase = createClient();

    const fetchData = async () => {
        try {
            const { data: assessmentData, error: assessmentError } = await supabase
                .from('project_assessments')
                .select('*')
                .eq('project_id', projectId)
                .maybeSingle();

            if (assessmentError) throw assessmentError;

            if (assessmentData) {
                const keys = Object.keys(assessmentData).filter(k => !['id', 'project_id', 'created_at', 'updated_at', 'model_used', 'criteria'].includes(k));
                if (keys.length > 0) setActiveTab(keys[0]);
                setData(assessmentData);

                // Recursive function to collect citations from JSONB
                const collectedEvidences: Record<string, Evidence> = {};
                const citationMap = new Map<string, number>(); // Track unique citations: "sourceId-page-quote" -> id
                let citationCounter = 1;

                const collectCitations = (obj: any) => {
                    if (!obj || typeof obj !== 'object') return;

                    if (obj.citations && Array.isArray(obj.citations)) {
                        const ids: number[] = [];
                        obj.citations.forEach((cit: any) => {
                            const key = `${cit.source_id}-${cit.page}-${cit.quote || ''}`;
                            let id: number;

                            if (citationMap.has(key)) {
                                id = citationMap.get(key)!;
                            } else {
                                id = citationCounter++;
                                citationMap.set(key, id);
                                collectedEvidences[id] = {
                                    id,
                                    source_id: cit.source_id,
                                    page: cit.page,
                                    source_title: cit.title,
                                    quote: cit.quote
                                };
                            }
                            ids.push(id);
                        });
                        // Attach citation IDs to the object so the renderer knows which badges to show
                        obj.citationIds = ids;
                    }

                    Object.values(obj).forEach(val => collectCitations(val));
                };

                collectCitations(assessmentData);
                setEvidences(collectedEvidences);
                // Only stop analyzing if we actually have data that isn't just a skeleton (if we had a status flag)
                // For now, we trust the Realtime update to set this to false when new data arrives
                // setIsAnalyzing(false); 
            } else {
                setData(null);
            }
        } catch (err: any) {
            console.error("[AssessmentTable] Fetch error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            await n8nApi.evaluateProject(projectId);

            toast.success("AI Analysis Started", {
                description: "The deconstruction process has been initiated. This may take a few minutes."
            });
            // Optimistically fetch, though Realtime will likely catch it later
            setTimeout(() => fetchData(), 2000);
        } catch (err: any) {
            console.error("[AssessmentTable] Catch error:", err);
            toast.error("Analysis Failed", {
                description: err.message || "Could not initiate the AI workflow. Please try again."
            });
        } finally {
            // DO NOT setIsAnalyzing(false) here, we wait for Realtime update
            // setIsAnalyzing(false); 
        }
    };

    useEffect(() => {
        fetchData();

        // Subscribe to Realtime changes for this project
        const channel = supabase
            .channel(`project_assessments_${projectId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'project_assessments',
                    filter: `project_id=eq.${projectId}`
                },
                (payload) => {
                    fetchData(); // Re-fetch the full object to ensure we have all fields
                    setIsAnalyzing(false); // Stop loading when real update arrives
                    toast.success("Intelligence Sequence Updated", {
                        description: "New analysis results have been received."
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId, supabase]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            // Define window constraints
            const dialogWidth = 580;
            const handleHeight = 24; // Height of the draggable handle area

            let newX = e.clientX - dragOffset.x;
            let newY = e.clientY - dragOffset.y;

            // Clamp X position
            newX = Math.max(0, Math.min(newX, window.innerWidth - dialogWidth));

            // Clamp Y position (Ensure handle at top is always visible)
            // We allow pulling from top (y=0) to near bottom (leaving the handle visible at least)
            newY = Math.max(0, Math.min(newY, window.innerHeight - handleHeight));

            setPosition({
                x: newX,
                y: newY
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleCitationClick = async (evidence: Evidence) => {
        setSelectedEvidence(evidence);

        // Fetch full source data
        try {
            const { data: sourceData, error: sourceError } = await supabase
                .from('sources')
                .select('*')
                .eq('id', evidence.source_id)
                .maybeSingle();

            if (sourceError) {
                console.error("[AssessmentTable] Error fetching source:", sourceError);
                setSelectedSource(null);
            } else {
                setSelectedSource(sourceData);
            }
        } catch (err) {
            console.error("[AssessmentTable] Catch error fetching source:", err);
            setSelectedSource(null);
        }

        // Set popup position (consistent with SourceManager)
        setPosition({ x: 40, y: 150 });
    };

    // Loading state is handled by page-level loading.tsx
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

    if (!data) {
        // handleStartAnalysis is now defined at component scope

        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] border border-black dark:border-white bg-white dark:bg-black p-12 text-center font-mono relative overflow-hidden group">
                {/* Decorative Grid Background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                {/* Visual Asset */}
                <div className="relative w-72 h-72 mb-12 grayscale hover:grayscale-0 transition-all duration-700 ease-in-out">
                    <div className="absolute inset-0 border border-black/10 dark:border-white/10 -m-4 group-hover:m-0 transition-all duration-500"></div>
                    <Image
                        src="/carousel-2-analysis-retro.png"
                        fill
                        className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        alt="AI Analysis Engine"
                    />
                </div>

                <h3 className="text-4xl font-black uppercase tracking-tighter mb-4 italic flex items-center gap-3">
                    <Sparkles className="h-8 w-8 text-[#FA4028]" />
                    Ready_for_Intelligence
                </h3>

                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] leading-loose max-w-md mb-8">
                    System_Status: Awaiting_Data_Ingestion
                    <br />
                    No active assessment sequence detected for this project identifier.
                    <br />
                    The AI engine is primed and ready to deconstruct your documentation.
                </p>

                <Button
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing}
                    className="rounded-none bg-[#FA4028] hover:bg-black text-white px-12 py-7 font-black italic text-lg tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            ANALYZING...
                        </>
                    ) : (
                        "START_AI_DECONSTRUCTION"
                    )}
                </Button>

                <div className="mt-8 text-[8px] opacity-30 uppercase tracking-widest font-mono">
                    Protocol: WF02-EVALUATION // Auth: Verified
                </div>
            </div>
        );
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    // Dynamic keys to render from assessment data
    const excludedKeys = ['id', 'project_id', 'created_at', 'updated_at', 'model_used', 'criteria'];
    const displayKeys = Object.keys(data).filter(k => !excludedKeys.includes(k));


    // Ensure activeTab is valid when data changes


    return (
        <>
            <div className="h-full w-full">
                <div className="flex w-full min-h-full gap-8 relative font-mono text-black dark:text-white pb-20">
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
                                        {/* Re-analyze Button (Left) */}
                                        <div className="absolute -left-20 top-1/2 -translate-y-1/2">
                                            <button
                                                onClick={handleStartAnalysis}
                                                disabled={isAnalyzing}
                                                title="RE-ANALYZE"
                                                className="group relative w-12 h-12 border-2 border-black dark:border-white bg-white dark:bg-black transition-all hover:translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[-4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[-8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[-8px_8px_0px_0px_rgba(255,255,255,1)] active:shadow-none flex items-center justify-center overflow-hidden"
                                            >
                                                {isAnalyzing ? (
                                                    <Loader2 className="w-5 h-5 animate-spin text-black dark:text-white" />
                                                ) : (
                                                    <Sparkles className="w-6 h-6 text-black dark:text-white transition-transform group-hover:scale-110" />
                                                )}
                                                <div className="absolute inset-0 bg-[#FA4028] translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10 opacity-10" />
                                            </button>
                                        </div>

                                        {/* Title Block */}
                                        <div className="bg-[#FA4028] text-white px-10 py-4 flex flex-col items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]">
                                            <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                                                PROJECT_ASSESSMENT
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
                                        Stage 01 // Requirement Analysis & Strategy
                                    </p>
                                </div>
                            </div>

                            {/* Centered Tabs List - Always Visible */}
                            <div className="flex justify-center w-full overflow-x-auto pb-2">
                                <div className="h-auto bg-transparent rounded-none p-0 gap-10 flex">
                                    {displayKeys.map((key) => {
                                        const label = data[key]?.label || key.replace(/_/g, ' ').toUpperCase();
                                        const displayLabel = label.split('_')[0];
                                        const isActive = activeTab === key;

                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setActiveTab(key)}
                                                className={`
                                                rounded-none border-b-2 px-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all bg-transparent shadow-none italic 
                                                ${isActive
                                                        ? 'border-[#FA4028] text-[#FA4028] opacity-100'
                                                        : 'border-transparent text-foreground hover:text-[#FA4028] opacity-60'
                                                    }
                                            `}
                                            >
                                                {displayLabel}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Content Area with Single Focused Card */}
                        {displayKeys.map((key) => {
                            if (activeTab !== key) return null;
                            return (
                                <div key={key} className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Card className="rounded-none border-0 bg-transparent shadow-none">
                                        <CardContent className="pt-12 pb-16 px-0 md:px-4">
                                            <div className="max-w-4xl mx-auto">
                                                {isAnalyzing && (
                                                    <div className="mb-8 p-4 bg-[#FA4028]/5 border-l-4 border-[#FA4028] flex items-center gap-3 animate-pulse">
                                                        <Loader2 className="w-4 h-4 animate-spin text-[#FA4028]" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#FA4028]">
                                                            Analysis in Progress // background sequence active
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="h-full w-full">
                                                    <RecursiveAssessmentRenderer
                                                        data={data[key]?.content || data[key]}
                                                        evidences={evidences}
                                                        onCitationClick={handleCitationClick}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Draggable Non-modal Dialog for Citation Details moved OUTSIDE ScrollArea and into a PORTAL */}
            {selectedEvidence && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        transition: isDragging ? 'none' : 'all 0.2s ease-out'
                    }}
                >
                    <div className="pointer-events-auto border-2 border-black dark:border-white rounded-none bg-white dark:bg-black font-mono shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] dark:shadow-[24px_24px_0px_0px_rgba(255,255,255,0.2)] w-[580px] h-[80vh] flex flex-col shadow-xl">
                        <div
                            className="bg-[#FA4028] h-4 cursor-move hover:h-6 transition-all flex items-center justify-center border-b-2 border-black dark:border-white shrink-0"
                            onMouseDown={handleMouseDown}
                        >
                            <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <SourceDetailPanel
                                evidence={selectedEvidence}
                                source={selectedSource}
                                onClose={() => {
                                    setSelectedEvidence(null);
                                    setSelectedSource(null);
                                }}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
