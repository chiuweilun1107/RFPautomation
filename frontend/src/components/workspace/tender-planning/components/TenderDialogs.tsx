/**
 * TenderDialogs Component
 *
 * Container for all dialog components used in TenderPlanning.
 * Manages dialog states and callbacks.
 */

import { AddChapterMethodDialog } from "../../dialogs/AddChapterMethodDialog";
import { GenerationModeDialog } from "../../dialogs/GenerationModeDialog";
import { TemplateUploadDialog } from "@/components/templates/TemplateUploadDialog";
import { SourceSelectionDialog } from "../../dialogs/SourceSelectionDialog";
import { TaskGenerationDialog, TaskGenerationOptions } from "../../dialogs/TaskGenerationDialog";
import { ImageGenerationDialog } from "../../dialogs/ImageGenerationDialog";
import type { DialogContext, GenerationMode, Task } from "../types";

interface TenderDialogsProps {
    /** Project ID for dialogs */
    projectId: string;
    /** Method selection dialog state */
    isMethodDialogOpen: boolean;
    /** Method dialog context */
    methodDialogContext: DialogContext;
    /** Method dialog change handler */
    onMethodDialogChange: (open: boolean) => void;
    /** Method selection handler */
    onMethodSelect: (method: 'manual' | 'ai' | 'template') => void;
    /** Generation mode dialog state */
    isGenerationModeDialogOpen: boolean;
    /** Generation mode dialog change handler */
    onGenerationModeDialogChange: (open: boolean) => void;
    /** Generation mode confirmation handler */
    onGenerationModeConfirm: (mode: GenerationMode) => void;
    /** Template upload dialog state */
    isTemplateDialogOpen: boolean;
    /** Template dialog close handler */
    onTemplateDialogClose: () => void;
    /** Template upload success handler */
    onTemplateSuccess: () => void;
    /** Task mode dialog state */
    isTaskModeDialogOpen: boolean;
    /** Task mode dialog change handler */
    onTaskModeDialogChange: (open: boolean) => void;
    /** Task mode confirmation handler */
    onTaskModeConfirm: (mode: GenerationMode) => void;
    /** Source selection dialog state */
    isSourceSelectionOpen: boolean;
    /** Source selection dialog change handler */
    onSourceSelectionChange: (open: boolean) => void;
    /** Source selection confirmation handler */
    onSourceSelectionConfirm: (sourceIds: string[]) => void;
    /** Task generation dialog state */
    isTaskGenerationDialogOpen: boolean;
    /** Task generation dialog change handler */
    onTaskGenerationDialogChange: (open: boolean) => void;
    /** Task generation section title */
    taskGenerationSectionTitle: string;
    /** Task generation confirmation handler */
    onTaskGenerationConfirm: (options: TaskGenerationOptions) => Promise<void>;
    /** Image generation dialog state */
    isImageGenDialogOpen: boolean;
    /** Image generation dialog change handler */
    onImageGenDialogChange: (open: boolean) => void;
    /** Task for image generation */
    imageGenTask: Task | null;
    /** Image generation confirmation handler */
    onImageGenConfirm: (options: any) => Promise<void>;
    /** Project-wide images for gallery selection */
    projectImages?: Array<{ id: string, url: string }>;
}

/**
 * All dialog components for TenderPlanning
 */
export function TenderDialogs({
    projectId,
    isMethodDialogOpen,
    methodDialogContext,
    onMethodDialogChange,
    onMethodSelect,
    isGenerationModeDialogOpen,
    onGenerationModeDialogChange,
    onGenerationModeConfirm,
    isTemplateDialogOpen,
    onTemplateDialogClose,
    onTemplateSuccess,
    isTaskModeDialogOpen,
    onTaskModeDialogChange,
    onTaskModeConfirm,
    isSourceSelectionOpen,
    onSourceSelectionChange,
    onSourceSelectionConfirm,
    isTaskGenerationDialogOpen,
    onTaskGenerationDialogChange,
    taskGenerationSectionTitle,
    onTaskGenerationConfirm,
    isImageGenDialogOpen,
    onImageGenDialogChange,
    imageGenTask,
    onImageGenConfirm,
    projectImages = []
}: TenderDialogsProps) {
    return (
        <>
            {/* Add Chapter/Section Method Dialog */}
            <AddChapterMethodDialog
                open={isMethodDialogOpen}
                onOpenChange={onMethodDialogChange}
                onSelectMethod={onMethodSelect}
                title={methodDialogContext === 'chapter' ? 'ADD_NEW_CHAPTER' : 'ADD_NEW_SECTION'}
                context={methodDialogContext}
            />

            {/* Generation Mode Dialog (Replace vs Append) */}
            <GenerationModeDialog
                open={isGenerationModeDialogOpen}
                onOpenChange={onGenerationModeDialogChange}
                onConfirm={onGenerationModeConfirm}
            />

            {/* Template Upload Dialog */}
            <TemplateUploadDialog
                open={isTemplateDialogOpen}
                onClose={onTemplateDialogClose}
                projectId={projectId}
                onSuccess={onTemplateSuccess}
            />

            {/* Task Generation Mode Dialog */}
            <GenerationModeDialog
                open={isTaskModeDialogOpen}
                onOpenChange={onTaskModeDialogChange}
                onConfirm={onTaskModeConfirm}
                title="TASK_GENERATION_MODE"
                description="Existing tasks detected. Choose how to proceed with AI generation."
                itemLabel="任務"
            />

            {/* Source Selection Dialog */}
            <SourceSelectionDialog
                open={isSourceSelectionOpen}
                onOpenChange={onSourceSelectionChange}
                projectId={projectId}
                onConfirm={onSourceSelectionConfirm}
            />

            {/* Task Generation Type Dialog (WF11 Project Type Selection) */}
            <TaskGenerationDialog
                open={isTaskGenerationDialogOpen}
                onOpenChange={onTaskGenerationDialogChange}
                sectionTitle={taskGenerationSectionTitle}
                onGenerate={onTaskGenerationConfirm}
            />

            {/* Image Generation Dialog */}
            <ImageGenerationDialog
                open={isImageGenDialogOpen}
                onOpenChange={onImageGenDialogChange}
                task={imageGenTask}
                onGenerate={onImageGenConfirm}
                projectImages={projectImages}
            />
        </>
    );
}
