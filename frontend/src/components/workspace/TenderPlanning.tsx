
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Save, ArrowRight, ArrowLeft, Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TenderPlanningProps {
    projectId: string;
    onNextStage?: () => void;
    onPrevStage?: () => void;
}

interface Chapter {
    id: string;
    title: string;
    sections?: string[]; // Simplified for now, just a list of section titles
}

// Fallback initial outline if none exists
const DEFAULT_OUTLINE: Chapter[] = [
    { id: "1", title: "壹、計畫緣起與目的", sections: ["1.1 計畫緣起", "1.2 專案目標"] },
    { id: "2", title: "貳、專案管理與執行團隊", sections: ["2.1 組織架構", "2.2 人力配置"] },
    { id: "3", title: "參、服務建議書內容", sections: ["3.1 核心服務說明", "3.2 執行方法"] },
    { id: "4", title: "肆、預期效益", sections: [] },
];

export function TenderPlanning({ projectId, onNextStage, onPrevStage }: TenderPlanningProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [outline, setOutline] = useState<Chapter[]>([]);
    const [originalRequirements, setOriginalRequirements] = useState<any>(null); // Keep full object to avoid overwriting other fields

    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('project_assessments')
                    .select('requirements')
                    .eq('project_id', projectId)
                    .single();

                if (data?.requirements) {
                    setOriginalRequirements(data.requirements);
                    if (data.requirements.proposal_outline && Array.isArray(data.requirements.proposal_outline) && data.requirements.proposal_outline.length > 0) {
                        setOutline(data.requirements.proposal_outline);
                    } else {
                        // Use default if nothing found in DB
                        setOutline(DEFAULT_OUTLINE);
                    }
                } else {
                    setOutline(DEFAULT_OUTLINE);
                }
            } catch (error) {
                console.error("Error fetching assessment data:", error);
                toast.error("Failed to load proposal outline");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Merge with existing requirements
            const updatedRequirements = {
                ...originalRequirements,
                proposal_outline: outline
            };

            const { error } = await supabase
                .from('project_assessments')
                .update({ requirements: updatedRequirements })
                .eq('project_id', projectId);

            if (error) throw error;

            setOriginalRequirements(updatedRequirements);
            toast.success("Proposal Outline Saved", {
                description: "Your changes have been committed to the database."
            });
        } catch (error: any) {
            console.error("Error saving outline:", error);
            toast.error("Save Failed", {
                description: error.message
            });
        } finally {
            setSaving(false);
        }
    };

    const updateChapterTitle = (index: number, newTitle: string) => {
        const newOutline = [...outline];
        newOutline[index].title = newTitle;
        setOutline(newOutline);
    };

    const updateSectionTitle = (chapterIndex: number, sectionIndex: number, newTitle: string) => {
        const newOutline = [...outline];
        if (!newOutline[chapterIndex].sections) newOutline[chapterIndex].sections = [];
        newOutline[chapterIndex].sections![sectionIndex] = newTitle;
        setOutline(newOutline);
    };

    const addChapter = () => {
        setOutline([...outline, { id: crypto.randomUUID(), title: "New Chapter", sections: [] }]);
    };

    const deleteChapter = (index: number) => {
        const newOutline = [...outline];
        newOutline.splice(index, 1);
        setOutline(newOutline);
    };

    const addSection = (chapterIndex: number) => {
        const newOutline = [...outline];
        if (!newOutline[chapterIndex].sections) newOutline[chapterIndex].sections = [];
        newOutline[chapterIndex].sections!.push("New Section");
        setOutline(newOutline);
    };

    const deleteSection = (chapterIndex: number, sectionIndex: number) => {
        const newOutline = [...outline];
        newOutline[chapterIndex].sections!.splice(sectionIndex, 1);
        setOutline(newOutline);
    };

    if (loading) return <LoadingSpinner size="lg" text="Loading proposal structure..." />;

    return (
        <ScrollArea className="h-full w-full rounded-none [&_[data-orientation=vertical]]:hidden">
            <div className="flex w-full min-h-full gap-8 relative font-mono text-black dark:text-white pb-20">
                {/* Main Content Area */}
                <div className="flex-1 px-8 md:px-12">

                    {/* Sticky Header Container */}
                    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-8 pb-4 mb-4 border-b border-black/5 dark:border-white/5">
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

                            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">
                                Stage 03 // Structure Definition & Strategy
                            </p>
                        </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex justify-end mb-8 max-w-4xl mx-auto">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-none bg-black text-white hover:bg-[#FA4028] dark:bg-white dark:text-black dark:hover:bg-[#FA4028] transition-colors border-2 border-transparent hover:border-black font-bold uppercase tracking-wider"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    SAVING...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    SAVE_STRUCTURE
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Editable Outline Card */}
                    <div className="max-w-4xl mx-auto pb-12">
                        <Card className="rounded-none border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
                            <CardHeader className="border-b border-black dark:border-white bg-black/5 dark:bg-white/5 py-4">
                                <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                    <GripVertical className="h-5 w-5 opacity-40" />
                                    SERVICE_PROPOSAL_OUTLINE
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                {outline.map((chapter, cIndex) => (
                                    <div key={chapter.id || cIndex} className="group/chapter relative pl-4 border-l-2 border-black/10 dark:border-white/10 hover:border-[#FA4028] transition-colors">

                                        {/* Chapter Row */}
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-1 block">Chapter {cIndex + 1}</label>
                                                <Input
                                                    value={chapter.title}
                                                    onChange={(e) => updateChapterTitle(cIndex, e.target.value)}
                                                    className="font-bold text-lg rounded-none border-x-0 border-t-0 border-b-2 border-black/20 focus:border-[#FA4028] bg-transparent px-0 h-auto py-1 focus:ring-0"
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteChapter(cIndex)}
                                                className="opacity-0 group-hover/chapter:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 rounded-none"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Sections List */}
                                        <div className="pl-8 space-y-3">
                                            {chapter.sections?.map((section, sIndex) => (
                                                <div key={sIndex} className="flex items-center gap-3 group/section">
                                                    <div className="w-2 h-2 bg-black/20 dark:bg-white/20 rounded-none transform rotate-45" />
                                                    <Input
                                                        value={section}
                                                        onChange={(e) => updateSectionTitle(cIndex, sIndex, e.target.value)}
                                                        className="flex-1 text-sm rounded-none border-x-0 border-t-0 border-b border-black/10 focus:border-[#FA4028] bg-transparent px-0 h-8 focus:ring-0"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteSection(cIndex, sIndex)}
                                                        className="h-6 w-6 opacity-0 group-hover/section:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 rounded-none"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}

                                            {/* Add Section Button */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => addSection(cIndex)}
                                                className="h-8 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-[#FA4028] hover:bg-transparent pl-0 mt-2"
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add Section
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Chapter Button */}
                                <Button
                                    variant="outline"
                                    onClick={addChapter}
                                    className="w-full py-6 border-dashed border-2 border-black/20 hover:border-[#FA4028] hover:text-[#FA4028] rounded-none uppercase tracking-widest font-bold"
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Add New Chapter
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
}
