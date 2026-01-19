"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VirtualizedList } from "@/components/common/VirtualizedList";

import { getSourceType, Source as SharedSource } from '@/lib/sourceUtils';

interface Source extends SharedSource {
    // Add any specific props if needed, or just extend SharedSource
}

interface SourceSelectionListProps {
    sources: Source[];
    selectedSourceIds: string[];
    onSelectionChange: (selectedIds: string[]) => void;
    onAddSource?: () => void;
}

export function SourceSelectionList({ sources, selectedSourceIds, onSelectionChange, onAddSource }: SourceSelectionListProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['tender', 'internal', 'external']));

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) next.delete(category);
            else next.add(category);
            return next;
        });
    };

    // Render source item for virtualized list
    const renderSourceItem = (source: Source) => {
        const isSelected = selectedSourceIds.includes(source.id);
        return (
            <label
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-blue-50 border-blue-200 shadow-sm dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-transparent hover:bg-white hover:shadow-sm dark:bg-gray-950 dark:hover:bg-gray-900'}`}
            >
                <div className="flex items-center h-5">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                            if (e.target.checked) {
                                onSelectionChange([...selectedSourceIds, source.id]);
                            } else {
                                onSelectionChange(selectedSourceIds.filter(id => id !== source.id));
                            }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate" title={source.title}>{source.title}</span>
                    </div>
                    {source.origin_url && <span className="text-[11px] text-gray-400 truncate mt-0.5">{source.origin_url}</span>}
                </div>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-gray-100 dark:bg-gray-800 text-gray-500">
                    {source.type?.substring(0, 4).toUpperCase() || 'DOC'}
                </Badge>
            </label>
        );
    };

    return (
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-black">
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {['tender', 'internal', 'external'].map((category) => {
                    const categoryLabel = {
                        tender: '標案文件',
                        internal: '內部知識',
                        external: '外部知識庫'
                    }[category as 'tender' | 'internal' | 'external'];

                    // Mapping source_type to categories
                    const group = sources.filter(s => getSourceType(s) === category);

                    if (group.length === 0) return null;

                    const isExpanded = expandedCategories.has(category);
                    const groupIds = group.map(s => s.id);
                    const allSelected = groupIds.every(id => selectedSourceIds.includes(id));
                    const someSelected = groupIds.some(id => selectedSourceIds.includes(id)) && !allSelected;

                    // Use virtualization for categories with 50+ items
                    const shouldVirtualize = group.length >= 50;

                    return (
                        <div key={category} className="border-b last:border-b-0">
                            <div
                                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => toggleCategory(category)}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 flex items-center justify-center rounded-md group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                                    </div>
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                        {categoryLabel}
                                        <span className="ml-1.5 font-normal text-gray-400">({group.length})</span>
                                    </span>
                                </div>
                                <div
                                    className="flex items-center px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (allSelected) {
                                            onSelectionChange(selectedSourceIds.filter(id => !groupIds.includes(id)));
                                        } else {
                                            onSelectionChange(Array.from(new Set([...selectedSourceIds, ...groupIds])));
                                        }
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                        onChange={() => { }} // Controlled by parent div click
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                                    />
                                </div>
                            </div>

                            {isExpanded && (
                                shouldVirtualize ? (
                                    <div className="bg-gray-50/50 dark:bg-gray-900/50 p-2">
                                        <VirtualizedList
                                            items={group}
                                            renderItem={renderSourceItem}
                                            height={400}
                                            estimateSize={80}
                                            overscan={5}
                                            itemKey={(source) => source.id}
                                            gap={4}
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-gray-50/50 dark:bg-gray-900/50 p-2 space-y-1">
                                        {group.map(source => (
                                            <div key={source.id}>
                                                {renderSourceItem(source)}
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    );
                })}

                {onAddSource && (
                    <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 text-xs font-medium"
                            onClick={onAddSource}
                        >
                            <Plus className="w-3.5 h-3.5 mr-2" />
                            新增來源 (Add Source)
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
