"use client";

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Criteria {
    id: string;
    group_name: string;
    title: string;
    weight: number;
    description: string;
}

export function CriteriaList() {
    const [criteria, setCriteria] = useState<Criteria[]>([]);
    const supabase = createClient();

    useEffect(() => {
        const fetchCriteria = async () => {
            const { data } = await supabase
                .from('criteria')
                .select('*')
                .order('group_name', { ascending: true });

            if (data) setCriteria(data as any[]);
        };

        fetchCriteria();
    }, []);

    const grouped = criteria.reduce((acc, curr) => {
        const group = curr.group_name || 'General';
        if (!acc[group]) acc[group] = [];
        acc[group].push(curr);
        return acc;
    }, {} as Record<string, Criteria[]>);

    const totalWeight = criteria.reduce((sum, item) => sum + (item.weight || 0), 0);

    return (
        <Card className="h-full border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    Grading Criteria
                    <Badge variant={totalWeight === 100 ? "outline" : "destructive"} className="ml-auto font-normal">
                        Total: {totalWeight}%
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                    {criteria.length === 0 && (
                        <div className="text-muted-foreground text-sm py-4">
                            No criteria extracted yet.
                        </div>
                    )}
                    <div className="space-y-6">
                        {Object.entries(grouped).map(([group, items]) => (
                            <div key={group}>
                                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                    {group} Group
                                </h3>
                                <div className="space-y-3">
                                    {items.map(item => (
                                        <div key={item.id} className="p-3 border rounded-lg bg-card/50 hover:bg-card transition-colors">
                                            <div className="flex items-start justify-between mb-1">
                                                <span className="font-medium text-sm">{item.title}</span>
                                                <Badge variant="secondary" className="text-xs">{item.weight}%</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
