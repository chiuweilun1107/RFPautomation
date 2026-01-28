/**
 * useDialogState Hook
 *
 * Manages all dialog states for TenderPlanning component.
 * Handles method selection, generation modes, and source selection dialogs.
 */

import { useState } from 'react';
import type { DialogContext, TaskGenerationContext, SourceSelectionContext, TaskGenerationMode, GenerationMode, Task } from '../types';

interface UseDialogStateReturn {
    // Method Dialog
    isMethodDialogOpen: boolean;
    setIsMethodDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    methodDialogContext: DialogContext;
    setMethodDialogContext: React.Dispatch<React.SetStateAction<DialogContext>>;
    activeSectionChapterIndex: number | null;
    setActiveSectionChapterIndex: React.Dispatch<React.SetStateAction<number | null>>;

    // Template Dialog
    isTemplateDialogOpen: boolean;
    setIsTemplateDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;

    // Generation Mode Dialog
    isGenerationModeDialogOpen: boolean;
    setIsGenerationModeDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;

    // Task Mode Dialog
    isTaskModeDialogOpen: boolean;
    setIsTaskModeDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    taskGenerationContext: TaskGenerationContext | null;
    setTaskGenerationContext: React.Dispatch<React.SetStateAction<TaskGenerationContext | null>>;

    // Source Selection Dialog
    isSourceSelectionOpen: boolean;
    setIsSourceSelectionOpen: React.Dispatch<React.SetStateAction<boolean>>;
    sourceSelectionContext: SourceSelectionContext | null;
    setSourceSelectionContext: React.Dispatch<React.SetStateAction<SourceSelectionContext | null>>;

    // Task Generation Type Dialog (WF11 Project Type Selection)
    isTaskGenerationDialogOpen: boolean;
    setIsTaskGenerationDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    taskGenerationTypeContext: { sectionTitle: string; sectionId: string; mode: TaskGenerationMode; conflictMode: GenerationMode; sourceIds: string[] } | null;
    setTaskGenerationTypeContext: React.Dispatch<React.SetStateAction<{ sectionTitle: string; sectionId: string; mode: TaskGenerationMode; conflictMode: GenerationMode; sourceIds: string[] } | null>>;

    // Image Generation Dialog
    isImageGenDialogOpen: boolean;
    setIsImageGenDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    imageGenTask: Task | null;
    setImageGenTask: React.Dispatch<React.SetStateAction<Task | null>>;
}

/**
 * Centralized dialog state management
 */
export function useDialogState(): UseDialogStateReturn {
    // Method Dialog States
    const [isMethodDialogOpen, setIsMethodDialogOpen] = useState(false);
    const [methodDialogContext, setMethodDialogContext] = useState<DialogContext>('chapter');
    const [activeSectionChapterIndex, setActiveSectionChapterIndex] = useState<number | null>(null);

    // Template Dialog
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

    // Generation Mode Dialog
    const [isGenerationModeDialogOpen, setIsGenerationModeDialogOpen] = useState(false);

    // Task Mode Dialog
    const [isTaskModeDialogOpen, setIsTaskModeDialogOpen] = useState(false);
    const [taskGenerationContext, setTaskGenerationContext] = useState<TaskGenerationContext | null>(null);

    // Source Selection Dialog
    const [isSourceSelectionOpen, setIsSourceSelectionOpen] = useState(false);
    const [sourceSelectionContext, setSourceSelectionContext] = useState<SourceSelectionContext | null>(null);

    // Task Generation Type Dialog (WF11 Project Type Selection)
    const [isTaskGenerationDialogOpen, setIsTaskGenerationDialogOpen] = useState(false);
    const [taskGenerationTypeContext, setTaskGenerationTypeContext] = useState<{ sectionTitle: string; sectionId: string; mode: TaskGenerationMode; conflictMode: GenerationMode; sourceIds: string[] } | null>(null);

    // Image Generation Dialog
    const [isImageGenDialogOpen, setIsImageGenDialogOpen] = useState(false);
    const [imageGenTask, setImageGenTask] = useState<Task | null>(null);

    return {
        isMethodDialogOpen,
        setIsMethodDialogOpen,
        methodDialogContext,
        setMethodDialogContext,
        activeSectionChapterIndex,
        setActiveSectionChapterIndex,
        isTemplateDialogOpen,
        setIsTemplateDialogOpen,
        isGenerationModeDialogOpen,
        setIsGenerationModeDialogOpen,
        isTaskModeDialogOpen,
        setIsTaskModeDialogOpen,
        taskGenerationContext,
        setTaskGenerationContext,
        isSourceSelectionOpen,
        setIsSourceSelectionOpen,
        sourceSelectionContext,
        setSourceSelectionContext,
        isTaskGenerationDialogOpen,
        setIsTaskGenerationDialogOpen,
        taskGenerationTypeContext,
        setTaskGenerationTypeContext,
        isImageGenDialogOpen,
        setIsImageGenDialogOpen,
        imageGenTask,
        setImageGenTask,
    };
}
