"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Loader2 } from "lucide-react";
import { RedLineChecklist } from "@/components/launch/RedLineChecklist";
import { TeamFormationCard } from "@/components/launch/TeamFormationCard";

export default function LaunchPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [isLoading, setIsLoading] = useState(true);
    const [requirements, setRequirements] = useState<any>(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('project_assessments')
                .select('requirements')
                .eq('project_id', id)
                .single();

            if (data?.requirements) {
                setRequirements(data.requirements);
            }
            setIsLoading(false);
        };
        fetchAnalysis();
    }, [id]);

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="flex-1 space-y-12">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8">
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2">啟動備標</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-bold text-[10px] uppercase">Launch</span>
                            <span>確認投標資格與團隊籌組狀況</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            className="h-10 px-4 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 rounded"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                            重新分析需求
                        </Button>
                        <Button
                            size="sm"
                            className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded"
                        >
                            確認啟動投標
                        </Button>
                    </div>
                </div>

                {/* Unified Tabs */}
                <Tabs defaultValue="qualification" className="w-full">
                    <TabsList className="mb-8 w-full justify-start bg-transparent border-b rounded-none h-auto p-0 flex flex-wrap gap-x-8 gap-y-2">
                        {[
                            { key: 'qualification', label: '投標資格檢核' },
                            { key: 'team', label: '團隊籌組' }
                        ].map(tab => (
                            <TabsTrigger
                                key={tab.key}
                                value={tab.key}
                                className="text-lg font-serif font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 py-3 transition-all whitespace-nowrap"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="qualification" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                            <RedLineChecklist requirements={requirements} />
                        </div>
                    </TabsContent>

                    <TabsContent value="team" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                            <TeamFormationCard requirements={requirements} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
