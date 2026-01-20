"use client"

import * as React from 'react';
import { Search } from 'lucide-react';

interface DashboardSearchBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export function DashboardSearchBar({ searchQuery, onSearchChange }: DashboardSearchBarProps) {
    return (
        <div className="relative w-full md:w-[320px] group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-[#FA4028]" />
            <input
                type="text"
                placeholder="SEARCH_PROJECTS..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 bg-background border border-black dark:border-white rounded-none font-mono text-xs focus:outline-none focus:border-[#FA4028] transition-colors h-10"
            />
        </div>
    );
}
