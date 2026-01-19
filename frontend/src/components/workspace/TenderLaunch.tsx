
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DownloadCloud, FileSignature, ShieldCheck, ArrowRight, ArrowLeft, FileText, AlertTriangle, Users, AlertOctagon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface TenderLaunchProps {
    projectId: string;
    onNextStage?: () => void;
    onPrevStage?: () => void;
}

export function TenderLaunch({ projectId, onNextStage, onPrevStage }: TenderLaunchProps) {
    const [loading, setLoading] = useState(true);
    const [redLines, setRedLines] = useState<any>(null);
    const [teamReqs, setTeamReqs] = useState<any[]>([]);

    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('project_assessments')
                    .select('requirements')
                    .eq('project_id', projectId)
                    .single();

                if (data?.requirements?.red_lines) {
                    setRedLines(data.requirements.red_lines);
                    setTeamReqs(data.requirements.red_lines.team_requirements || []);
                }
            } catch (error) {
                console.error("Error fetching assessment data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId]);

    if (loading) return <LoadingSpinner size="lg" text="Loading tender safeguards..." />;

    return (
        <ScrollArea className="h-full w-full rounded-none [&_[data-orientation=vertical]]:hidden">
            <div className="flex w-full min-h-full gap-8 relative font-mono text-black dark:text-white pb-20">
                {/* Main Content Area */}
                <div className="flex-1 px-8 md:px-12">

                    {/* Sticky Header Container */}
                    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-8 pb-4 mb-12 border-b border-black/5 dark:border-white/5">
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
                                        TENDER_LAUNCH
                                    </h2>
                                </div>

                                {/* Next Navigation Arrow */}
                                {onNextStage && (
                                    <div className="absolute -right-20 top-1/2 -translate-y-1/2">
                                        <button
                                            onClick={onNextStage}
                                            className="group relative w-12 h-12 border-2 border-black dark:border-white bg-white dark:bg-black transition-all hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] active:shadow-none flex items-center justify-center overflow-hidden"
                                        >
                                            {/* Custom Brutalist Arrow SVG */}
                                            <svg
                                                viewBox="0 0 24 24"
                                                className="w-6 h-6 fill-none stroke-black dark:stroke-white stroke-[3] transition-transform group-hover:translate-x-1"
                                            >
                                                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="square" strokeLinejoin="miter" />
                                            </svg>

                                            {/* Glitch Effect Element */}
                                            <div className="absolute inset-0 bg-[#FA4028] translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10 opacity-10" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] mt-4">
                                Phase: 02 // Document_Acquisition & Team_Formation
                            </p>
                        </div>
                    </div>

                    {/* Dashboard Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">

                        {/* Column 1: Team Analysis (Dynamic from DB) */}
                        <div className="space-y-6">
                            <div className="border-b-2 border-black dark:border-white pb-2 mb-4">
                                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                                    <Users className="w-5 h-5 text-[#FA4028]" />
                                    Required_Team_Formation
                                </h3>
                            </div>

                            <div className="grid gap-4">
                                {teamReqs.length > 0 ? (
                                    teamReqs.map((req: any, i: number) => (
                                        <Card key={i} className="rounded-none border-2 border-black dark:border-white bg-white dark:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 transition-transform">
                                            <CardContent className="p-4 flex flex-col gap-2">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-lg uppercase tracking-tight">{req.role}</span>
                                                    {req.is_full_time && (
                                                        <span className="text-[10px] bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 font-bold uppercase">Full-Time</span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground font-mono space-y-1">
                                                    {req.min_years && <p>• Exp: {req.min_years}+ Years</p>}
                                                    {req.certs && req.certs.length > 0 && (
                                                        <p>• Certs: {req.certs.join(", ")}</p>
                                                    )}
                                                    {req.custom_constraints && <p className="text-[#FA4028]">• {req.custom_constraints}</p>}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-black/20 text-center">
                                        <p className="text-muted-foreground font-mono">No specific team requirements extracted.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Column 2: Tender Precautions (Red Lines) */}
                        <div className="space-y-6">
                            <div className="border-b-2 border-black dark:border-white pb-2 mb-4">
                                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                                    <AlertOctagon className="w-5 h-5 text-[#FA4028]" />
                                    Critical_Precautions
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {/* Constraints */}
                                {redLines?.constraints && Object.entries(redLines.constraints).map(([key, val]: [string, any], i: number) => (
                                    <div key={i} className="flex items-center gap-4 p-4 border border-black dark:border-white bg-[#FA4028]/5">
                                        <AlertTriangle className="w-5 h-5 text-[#FA4028] flex-shrink-0" />
                                        <div>
                                            <span className="text-xs font-bold uppercase text-muted-foreground block">{key.replace(/_/g, ' ')}</span>
                                            <span className="font-bold font-mono text-lg">{String(val)}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Qualification Checks */}
                                {redLines?.qualification_check && (
                                    <div className="p-6 border-2 border-black dark:border-white bg-white dark:bg-black">
                                        <h4 className="font-bold uppercase mb-4 border-b border-gray-200 pb-2">Qualification_Checklist</h4>
                                        <ul className="space-y-3 font-mono text-sm">
                                            {Object.entries(redLines.qualification_check).map(([key, val]: [string, any]) => (
                                                <li key={key} className="flex justify-between items-center">
                                                    <span>{key.replace(/_/g, ' ')}:</span>
                                                    <span className="font-bold">{String(val)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <Button className="w-full rounded-none bg-black text-white hover:bg-[#FA4028] transition-colors font-bold uppercase tracking-widest h-14 text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    Initiate_Team_Recruitment <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </ScrollArea>
    );
}
