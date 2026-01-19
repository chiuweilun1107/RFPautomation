/**
 * useDialogState Hook
 *
 * Manages all dialog open/close states
 */

import { useState } from 'react';
import type { DialogState } from '../types';

export interface UseDialogStateReturn extends DialogState {
  // Section Dialog Actions
  openAddSectionDialog: () => void;
  closeAddSectionDialog: () => void;
  openAddSubsectionDialog: () => void;
  closeAddSubsectionDialog: () => void;
  openGenerateSubsectionDialog: () => void;
  closeGenerateSubsectionDialog: () => void;
  setIsSubsectionConflictDialogOpen: (open: boolean) => void;

  // Task Dialog Actions
  openAddTaskDialog: () => void;
  closeAddTaskDialog: () => void;

  // Conflict Dialog Actions
  setIsConflictDialogOpen: (open: boolean) => void;
  setIsContentConflictDialogOpen: (open: boolean) => void;

  // Other Dialog Actions
  setIsTemplateDialogOpen: (open: boolean) => void;
  setIsContentGenerationDialogOpen: (open: boolean) => void;
  setIsAddSourceDialogOpen: (open: boolean) => void;
  setImageGenDialogOpen: (open: boolean) => void;
}

export function useDialogState(): UseDialogStateReturn {
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isAddSubsectionOpen, setIsAddSubsectionOpen] = useState(false);
  const [isGenerateSubsectionOpen, setIsGenerateSubsectionOpen] = useState(false);
  const [isSubsectionConflictDialogOpen, setIsSubsectionConflictDialogOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [isContentConflictDialogOpen, setIsContentConflictDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isContentGenerationDialogOpen, setIsContentGenerationDialogOpen] = useState(false);
  const [isAddSourceDialogOpen, setIsAddSourceDialogOpen] = useState(false);
  const [imageGenDialogOpen, setImageGenDialogOpen] = useState(false);

  return {
    isAddSectionOpen,
    isAddSubsectionOpen,
    isGenerateSubsectionOpen,
    isSubsectionConflictDialogOpen,
    isAddTaskOpen,
    isConflictDialogOpen,
    isContentConflictDialogOpen,
    isTemplateDialogOpen,
    isContentGenerationDialogOpen,
    isAddSourceDialogOpen,
    imageGenDialogOpen,

    openAddSectionDialog: () => setIsAddSectionOpen(true),
    closeAddSectionDialog: () => setIsAddSectionOpen(false),
    openAddSubsectionDialog: () => setIsAddSubsectionOpen(true),
    closeAddSubsectionDialog: () => setIsAddSubsectionOpen(false),
    openGenerateSubsectionDialog: () => setIsGenerateSubsectionOpen(true),
    closeGenerateSubsectionDialog: () => setIsGenerateSubsectionOpen(false),
    setIsSubsectionConflictDialogOpen,
    openAddTaskDialog: () => setIsAddTaskOpen(true),
    closeAddTaskDialog: () => setIsAddTaskOpen(false),
    setIsConflictDialogOpen,
    setIsContentConflictDialogOpen,
    setIsTemplateDialogOpen,
    setIsContentGenerationDialogOpen,
    setIsAddSourceDialogOpen,
    setImageGenDialogOpen,
  };
}
