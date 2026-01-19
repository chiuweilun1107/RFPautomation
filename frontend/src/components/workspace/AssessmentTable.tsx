
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CitationRenderer } from "./CitationRenderer";
import { Evidence } from "./CitationBadge";
import { SourceDetailPanel } from "./SourceDetailPanel";
import { Loader2, AlertCircle, FileSearch, Sparkles } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { n8nApi } from "@/features/n8n/api/n8nApi";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RecursiveAssessmentRenderer } from "./RecursiveAssessmentRenderer";
import { createPortal } from "react-dom";


interface AssessmentTableProps {
    projectId: string;
}

export function AssessmentTable({ projectId }: AssessmentTableProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any | null>(null);
    const [evidences, setEvidences] = useState<Record<string, Evidence>>({});
    const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // State for Draggable Dialog
    const [position, setPosition] = useState({ x: 40, y: 150 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const supabase = createClient();

    const fetchData = async () => {
        console.log("[AssessmentTable] Fetching data for project:", projectId);
        try {
            const { data: assessmentData, error: assessmentError } = await supabase
                .from('project_assessments')
                .select('*')
                .eq('project_id', projectId)
                .maybeSingle();

            if (assessmentError) throw assessmentError;

            if (assessmentData) {
                console.log("[AssessmentTable] Data found, processing citations...");
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
                setIsAnalyzing(false);
            } else {
                console.log("[AssessmentTable] No data found for project:", projectId);
                setData(null);
            }
        } catch (err: any) {
            console.error("[AssessmentTable] Fetch error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Subscribe to Realtime changes for this project
        console.log("[AssessmentTable] Subscribing to Realtime changes for project:", projectId);
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
                    console.log("[AssessmentTable] Realtime update detected!", payload);
                    fetchData(); // Re-fetch the full object to ensure we have all fields
                    toast.success("Intelligence Sequence Updated", {
                        description: "New analysis results have been received."
                    });
                }
            )
            .subscribe();

        return () => {
            console.log("[AssessmentTable] Unsubscribing from Realtime");
            supabase.removeChannel(channel);
        };
    }, [projectId, supabase]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
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

    const handleCitationClick = (evidence: Evidence) => {
        setSelectedEvidence(evidence);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 font-mono">
                <Loader2 className="h-8 w-8 animate-spin text-[#FA4028]" />
                <p className="text-[10px] uppercase tracking-widest font-black">Retrieving_Analysis_Payload...</p>
            </div>
        );
    }

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
        const handleStartAnalysis = async () => {
            console.log("[AssessmentTable] Starting analysis for project:", projectId);
            setIsAnalyzing(true);
            try {
                await n8nApi.evaluateProject(projectId);

                console.log("[AssessmentTable] API call successful");
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
                setIsAnalyzing(false);
            }
        };

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

    return (
        <>
            <ScrollArea className="h-full w-full rounded-none [&_[data-orientation=vertical]]:hidden">
                <div className="flex w-full min-h-full gap-8 relative font-mono">
                    {/* Main Content Area */}
                    <div className="flex-1">
                        <Tabs defaultValue="summary" className="w-full">
                            {/* Sticky Header Container */}
                            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-8 pb-4 mb-8 border-b border-black/5 dark:border-white/5">
                                {/* Centered Heading */}
                                <div className="flex flex-col items-center mb-8">
                                    <div className="bg-[#FA4028] text-white px-10 py-4 flex flex-col items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]">
                                        <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                                            ASSESSMENT_REPORT
                                        </h2>
                                    </div>
                                </div>

                                {/* Centered Tabs List */}
                                <div className="flex justify-center">
                                    <TabsList className="h-auto bg-transparent rounded-none p-0 gap-10">
                                        {displayKeys.map((key) => {
                                            const label = data[key]?.label || key.replace(/_/g, ' ').toUpperCase();
                                            const displayLabel = label.split('_')[0];

                                            return (
                                                <TabsTrigger
                                                    key={key}
                                                    value={key}
                                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FA4028] data-[state=active]:bg-transparent data-[state=active]:text-[#FA4028] px-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:text-[#FA4028] bg-transparent shadow-none italic opacity-60 data-[state=active]:opacity-100"
                                                >
                                                    {displayLabel}
                                                </TabsTrigger>
                                            );
                                        })}
                                    </TabsList>
                                </div>
                            </div>

                            {/* Content Area with Single Focused Card */}
                            {displayKeys.map((key) => (
                                <TabsContent key={key} value={key} className="mt-0 outline-none">
                                    <Card className="rounded-none border-2 border-black dark:border-white bg-background shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.05)]">
                                        <CardContent className="pt-12 pb-16 px-8 md:px-12">
                                            <div className="max-w-4xl mx-auto">
                                                <ScrollArea className="h-full w-full rounded-none [&_[data-orientation=vertical]]:hidden">
                                                    <RecursiveAssessmentRenderer
                                                        data={data[key]?.content || data[key]}
                                                        evidences={evidences}
                                                        onCitationClick={handleCitationClick}
                                                    />
                                                </ScrollArea>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </div>
            </ScrollArea>

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
                    <div className="pointer-events-auto border-2 border-black dark:border-white rounded-none bg-white dark:bg-black font-mono shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] dark:shadow-[24px_24px_0px_0px_rgba(255,255,255,0.2)] w-[580px]">
                        <div
                            className="bg-[#FA4028] h-4 cursor-move hover:h-6 transition-all flex items-center justify-center border-b-2 border-black dark:border-white"
                            onMouseDown={handleMouseDown}
                        >
                            <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                            </div>
                        </div>
                        <SourceDetailPanel
                            evidence={selectedEvidence}
                            onClose={() => setSelectedEvidence(null)}
                        />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
