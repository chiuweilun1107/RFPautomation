"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamFormationCardProps {
    requirements: any;
}

export function TeamFormationCard({ requirements }: TeamFormationCardProps) {
    const [resources, setResources] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<Record<number, string>>({}); // role index -> resource id
    const supabase = createClient();

    // Fetch team requirements
    const neededRoles = requirements?.red_lines?.team_requirements || [];

    useEffect(() => {
        const fetchResources = async () => {
            const { data } = await supabase
                .from('resources')
                .select('*')
                .order('name');
            if (data) setResources(data);
        };
        fetchResources();
    }, []);

    const handleAssign = (roleIndex: number, resourceId: string) => {
        setAssignments(prev => ({ ...prev, [roleIndex]: resourceId }));
    };

    if (neededRoles.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-50" />
                <p>AI 分析顯示本案無特定人力硬性要求。</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {neededRoles.map((roleReq: any, idx: number) => {
                const assignedId = assignments[idx];
                const assignedPerson = resources.find(r => r.id === assignedId);
                const isWarning = assignedPerson && roleReq.certs &&
                    !roleReq.certs.every((c: string) => assignedPerson.certificates?.includes(c));

                return (
                    <div key={idx} className="flex flex-col gap-2 p-3 border rounded-lg bg-white dark:bg-gray-950">
                        {/* Header: Role Title & Requirements */}
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="font-semibold text-sm flex items-center gap-2">
                                    {roleReq.role || `Role ${idx + 1}`}
                                    {roleReq.is_full_time && <Badge variant="outline" className="text-[10px]">專任</Badge>}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {roleReq.min_years && (
                                        <Badge variant="secondary" className="text-[10px] text-gray-500">
                                            {roleReq.min_years}年+
                                        </Badge>
                                    )}
                                    {roleReq.certs?.map((c: string) => (
                                        <Badge key={c} variant="secondary" className="text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                            {c}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Assignment Selector */}
                        <div className="mt-2">
                            <Select onValueChange={(val) => handleAssign(idx, val)} value={assignedId}>
                                <SelectTrigger className="w-full h-9">
                                    <SelectValue placeholder="選擇人員..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {resources.map(r => (
                                        <SelectItem key={r.id} value={r.id}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-5 h-5">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.name}`} />
                                                    <AvatarFallback>{r.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <span>{r.name}</span>
                                                <span className="text-xs text-muted-foreground">({r.role})</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                    <div className="p-2 border-t mt-1">
                                        <button className="flex items-center gap-2 text-xs text-blue-600 w-full hover:bg-blue-50 p-1 rounded">
                                            <UserPlus className="w-3 h-3" />
                                            新增人員...
                                        </button>
                                    </div>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Validation Warning */}
                        {isWarning && (
                            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                <AlertCircle className="w-3 h-3" />
                                警示：該人員可能缺少必要證照 ({roleReq.certs?.join(', ')})
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
