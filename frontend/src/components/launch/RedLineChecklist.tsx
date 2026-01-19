"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RedLineChecklistProps {
    requirements: any;
}

export function RedLineChecklist({ requirements }: RedLineChecklistProps) {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    // Safely extract red lines
    const qualificationCheck = requirements?.red_lines?.qualification_check || {};
    const teamRequirements = requirements?.red_lines?.team_requirements || [];
    const generalConstraints = requirements?.red_lines?.constraints || {};

    const toggleItem = (key: string) => {
        setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (!requirements?.red_lines) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>尚未分析出關鍵紅線，請確認 AI 分析是否完成。</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* 1. Qualification Check */}
            {(Object.keys(qualificationCheck).length > 0) && (
                <div className="space-y-4">
                    <h3 className="text-base font-serif font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        資格門檻
                    </h3>
                    <div className="grid gap-3">
                        {Object.entries(qualificationCheck).map(([key, val]: [string, any]) => (
                            <CheckItem
                                key={key}
                                id={`qual-${key}`}
                                label={formatLabel(key)}
                                value={String(val)}
                                checked={!!checkedItems[`qual-${key}`]}
                                onToggle={() => toggleItem(`qual-${key}`)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 2. General Constraints */}
            {(Object.keys(generalConstraints).length > 0) && (
                <div className="space-y-4">
                    <h3 className="text-base font-serif font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        硬性指標
                    </h3>
                    <div className="grid gap-3">
                        {Object.entries(generalConstraints).map(([key, val]: [string, any]) => (
                            <CheckItem
                                key={key}
                                id={`const-${key}`}
                                label={formatLabel(key)}
                                value={String(val)}
                                checked={!!checkedItems[`const-${key}`]}
                                onToggle={() => toggleItem(`const-${key}`)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 3. Team Requirements */}
            {(teamRequirements.length > 0) && (
                <div className="space-y-4">
                    <h3 className="text-base font-serif font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        人力需求
                    </h3>
                    <div className="grid gap-3">
                        {teamRequirements.map((req: any, idx: number) => {
                            const label = req.role || `Role ${idx + 1}`;
                            const details = [
                                req.min_years ? `${req.min_years}年經驗` : null,
                                req.certs?.join(', '),
                                req.custom_constraints
                            ].filter(Boolean).join(" · ");

                            return (
                                <CheckItem
                                    key={idx}
                                    id={`team-${idx}`}
                                    label={label}
                                    value={details || "無特殊要求"}
                                    checked={!!checkedItems[`team-${idx}`]}
                                    onToggle={() => toggleItem(`team-${idx}`)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function CheckItem({ id, label, value, checked, onToggle }: any) {
    return (
        <div
            className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-accent/50",
                checked ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-900" : "bg-card border-border"
            )}
            onClick={onToggle}
        >
            <Checkbox id={id} checked={checked} className="mt-1" />
            <div className="flex-1 space-y-1">
                <label
                    htmlFor={id}
                    className={cn(
                        "text-sm font-medium leading-none cursor-pointer",
                        checked && "text-green-700 dark:text-green-400"
                    )}
                >
                    {label}
                </label>
                <p className="text-xs text-muted-foreground">{value}</p>
            </div>
            {checked && <CheckCircle2 className="w-4 h-4 text-green-600 animate-in fade-in zoom-in" />}
        </div>
    );
}

function formatLabel(key: string) {
    const map: Record<string, string> = {
        capital_min: "最低資本額",
        track_record_years: "實績年資",
        iso_certified: "ISO 認證要求",
        page_limit: "頁數限制",
        budget_ceiling: "預算上限"
    };
    return map[key] || key.replace(/_/g, ' ');
}
