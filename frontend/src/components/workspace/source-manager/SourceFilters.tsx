"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Filter } from "lucide-react";

interface SourceFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filterType?: string;
    onFilterChange?: (type: string) => void;
    availableTypes?: string[];
}

/**
 * 源文献过滤器 - 搜索和过滤源文献
 */
export function SourceFilters({
    searchQuery,
    onSearchChange,
    filterType,
    onFilterChange,
    availableTypes = ["pdf", "docx", "web", "markdown"],
}: SourceFiltersProps) {
    return (
        <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            {/* Search box */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    type="text"
                    placeholder="Search sources..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 h-9"
                />
                {searchQuery && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Filter buttons */}
            {onFilterChange && (
                <div className="flex gap-2 flex-wrap">
                    <Button
                        size="sm"
                        variant={!filterType ? "default" : "outline"}
                        onClick={() => onFilterChange("")}
                        className="h-8"
                    >
                        <Filter className="w-3 h-3 mr-1" />
                        All
                    </Button>
                    {availableTypes.map((type) => (
                        <Button
                            key={type}
                            size="sm"
                            variant={filterType === type ? "default" : "outline"}
                            onClick={() => onFilterChange(type)}
                            className="h-8"
                        >
                            {type.toUpperCase()}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}
