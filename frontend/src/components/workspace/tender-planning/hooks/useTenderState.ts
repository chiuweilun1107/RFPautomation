/**
 * useTenderState Hook
 *
 * Core state management for TenderPlanning component.
 * Manages outline structure, loading states, and UI states.
 */

import { useState } from 'react';
import type { Chapter } from '../types';

interface UseTenderStateReturn {
    // Data State
    outline: Chapter[];
    setOutline: React.Dispatch<React.SetStateAction<Chapter[]>>;
    deletedSectionIds: string[];
    setDeletedSectionIds: React.Dispatch<React.SetStateAction<string[]>>;

    // Loading States
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    saving: boolean;
    setSaving: React.Dispatch<React.SetStateAction<boolean>>;
    generating: boolean;
    setGenerating: React.Dispatch<React.SetStateAction<boolean>>;

    // UI States
    isHeaderExpanded: boolean;
    setIsHeaderExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Manages all state for TenderPlanning component
 */
export function useTenderState(): UseTenderStateReturn {
    // Data State
    const [outline, setOutline] = useState<Chapter[]>([]);
    const [deletedSectionIds, setDeletedSectionIds] = useState<string[]>([]);

    // Loading States
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

    // UI States
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

    return {
        outline,
        setOutline,
        deletedSectionIds,
        setDeletedSectionIds,
        loading,
        setLoading,
        saving,
        setSaving,
        generating,
        setGenerating,
        isHeaderExpanded,
        setIsHeaderExpanded,
    };
}
