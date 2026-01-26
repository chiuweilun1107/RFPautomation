/**
 * GenerationBadge Component
 *
 * Displays a badge indicating how a chapter/section was generated (manual, AI, or template).
 * Includes visual indicators for modified content.
 */

import { memo } from 'react';
import { cn } from "@/lib/utils";

interface GenerationBadgeProps {
    /** Generation method type */
    method?: 'manual' | 'ai_gen' | 'template';
    /** Whether the item has been manually modified after generation */
    isModified?: boolean;
    /** Use compact styling (smaller text) */
    compact?: boolean;
}

/**
 * Badge component showing generation method with brutalist styling
 */
function GenerationBadgeComponent({ method, isModified, compact = false }: GenerationBadgeProps) {
    if (!method) return null;

    const labelMap = {
        manual: 'MANUAL',
        ai_gen: 'AI_GEN',
        template: 'TEMPLATE'
    };

    const colorMap = {
        manual: 'text-black border-black bg-zinc-100 dark:bg-zinc-800 dark:text-white dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]',
        ai_gen: 'text-white border-black bg-[#FA4028] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
        template: 'text-white border-black bg-blue-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
    };

    return (
        <span className={cn(
            "font-mono font-bold uppercase border px-1.5 py-0.5 select-none transition-all",
            compact ? "text-[7px] leading-none py-0.5" : "text-[9px] tracking-widest",
            colorMap[method]
        )}>
            {labelMap[method] || 'MANUAL'}{isModified ? '*' : ''}
        </span>
    );
}

/**
 * Memoized GenerationBadge
 * Simple pure component, only re-renders when props change
 */
export const GenerationBadge = memo(
    GenerationBadgeComponent,
    (prevProps, nextProps) => {
        return (
            prevProps.method === nextProps.method &&
            prevProps.isModified === nextProps.isModified &&
            prevProps.compact === nextProps.compact
        );
    }
);
