/**
 * useProposalDialogs Hook Test Suite
 *
 * Coverage: Dialog state management, open/close logic, batch operations
 */

import { renderHook, act } from '@testing-library/react';
import { useProposalDialogs } from '@/components/workspace/proposal-editor/hooks/useProposalDialogs';

describe('useProposalDialogs', () => {
  // ============ Initialization Tests ============

  describe('initialization', () => {
    it('should initialize all dialogs as closed', () => {
      const { result } = renderHook(() => useProposalDialogs());

      expect(result.current.isAddSectionOpen).toBe(false);
      expect(result.current.isAddTaskOpen).toBe(false);
      expect(result.current.isAddSubsectionOpen).toBe(false);
      expect(result.current.isGenerateSubsectionOpen).toBe(false);
      expect(result.current.imageGenDialogOpen).toBe(false);
      expect(result.current.isContentGenerationDialogOpen).toBe(false);
      expect(result.current.isAddSourceDialogOpen).toBe(false);
      expect(result.current.isConflictDialogOpen).toBe(false);
      expect(result.current.isSubsectionConflictDialogOpen).toBe(false);
      expect(result.current.isContentConflictDialogOpen).toBe(false);
      expect(result.current.isTemplateDialogOpen).toBe(false);
    });

    it('should initialize input values as empty strings', () => {
      const { result } = renderHook(() => useProposalDialogs());

      expect(result.current.dialogInputValue).toBe('');
      expect(result.current.subsectionInputValue).toBe('');
    });

    it('should initialize context values as null', () => {
      const { result } = renderHook(() => useProposalDialogs());

      expect(result.current.taskConflictContext).toBeNull();
      expect(result.current.contentGenerationTarget).toBeNull();
      expect(result.current.selectedTaskForImage).toBeNull();
      expect(result.current.subsectionTargetSection).toBeNull();
      expect(result.current.structureWarningSection).toBeNull();
    });

    it('should initialize UI states with defaults', () => {
      const { result } = renderHook(() => useProposalDialogs());

      expect(result.current.showSourceSelector).toBe(false);
    });

    it('should initialize pending operations as null', () => {
      const { result } = renderHook(() => useProposalDialogs());

      expect(result.current.pendingSubsectionArgs).toBeNull();
      expect(result.current.pendingContentGeneration).toBeNull();
    });
  });

  // ============ Individual Dialog Open/Close Tests ============

  describe('addSection dialog', () => {
    it('should open addSection dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openAddSection();
      });

      expect(result.current.isAddSectionOpen).toBe(true);
    });

    it('should close addSection dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openAddSection();
      });

      act(() => {
        result.current.closeAddSection();
      });

      expect(result.current.isAddSectionOpen).toBe(false);
    });

    it('should use setter to toggle addSection dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.setIsAddSectionOpen(true);
      });

      expect(result.current.isAddSectionOpen).toBe(true);

      act(() => {
        result.current.setIsAddSectionOpen(false);
      });

      expect(result.current.isAddSectionOpen).toBe(false);
    });
  });

  describe('addTask dialog', () => {
    it('should open addTask dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openAddTask();
      });

      expect(result.current.isAddTaskOpen).toBe(true);
    });

    it('should close addTask dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openAddTask();
      });

      act(() => {
        result.current.closeAddTask();
      });

      expect(result.current.isAddTaskOpen).toBe(false);
    });
  });

  describe('addSubsection dialog', () => {
    it('should open addSubsection dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openAddSubsection();
      });

      expect(result.current.isAddSubsectionOpen).toBe(true);
    });

    it('should close addSubsection dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openAddSubsection();
      });

      act(() => {
        result.current.closeAddSubsection();
      });

      expect(result.current.isAddSubsectionOpen).toBe(false);
    });
  });

  describe('generateSubsection dialog', () => {
    it('should open generateSubsection dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openGenerateSubsection();
      });

      expect(result.current.isGenerateSubsectionOpen).toBe(true);
    });

    it('should close generateSubsection dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openGenerateSubsection();
      });

      act(() => {
        result.current.closeGenerateSubsection();
      });

      expect(result.current.isGenerateSubsectionOpen).toBe(false);
    });
  });

  describe('imageGeneration dialog', () => {
    it('should open imageGeneration dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openImageGeneration();
      });

      expect(result.current.imageGenDialogOpen).toBe(true);
    });

    it('should close imageGeneration dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openImageGeneration();
      });

      act(() => {
        result.current.closeImageGeneration();
      });

      expect(result.current.imageGenDialogOpen).toBe(false);
    });
  });

  describe('contentGeneration dialog', () => {
    it('should open contentGeneration dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openContentGeneration();
      });

      expect(result.current.isContentGenerationDialogOpen).toBe(true);
    });

    it('should close contentGeneration dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openContentGeneration();
      });

      act(() => {
        result.current.closeContentGeneration();
      });

      expect(result.current.isContentGenerationDialogOpen).toBe(false);
    });
  });

  describe('addSource dialog', () => {
    it('should open addSource dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openAddSource();
      });

      expect(result.current.isAddSourceDialogOpen).toBe(true);
    });

    it('should close addSource dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openAddSource();
      });

      act(() => {
        result.current.closeAddSource();
      });

      expect(result.current.isAddSourceDialogOpen).toBe(false);
    });
  });

  describe('conflict dialogs', () => {
    it('should open conflict dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openConflictDialog();
      });

      expect(result.current.isConflictDialogOpen).toBe(true);
    });

    it('should close conflict dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openConflictDialog();
      });

      act(() => {
        result.current.closeConflictDialog();
      });

      expect(result.current.isConflictDialogOpen).toBe(false);
    });

    it('should open subsectionConflict dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openSubsectionConflictDialog();
      });

      expect(result.current.isSubsectionConflictDialogOpen).toBe(true);
    });

    it('should close subsectionConflict dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openSubsectionConflictDialog();
      });

      act(() => {
        result.current.closeSubsectionConflictDialog();
      });

      expect(result.current.isSubsectionConflictDialogOpen).toBe(false);
    });

    it('should open contentConflict dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openContentConflictDialog();
      });

      expect(result.current.isContentConflictDialogOpen).toBe(true);
    });

    it('should close contentConflict dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openContentConflictDialog();
      });

      act(() => {
        result.current.closeContentConflictDialog();
      });

      expect(result.current.isContentConflictDialogOpen).toBe(false);
    });
  });

  describe('template dialog', () => {
    it('should open template dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openTemplateDialog();
      });

      expect(result.current.isTemplateDialogOpen).toBe(true);
    });

    it('should close template dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openTemplateDialog();
      });

      act(() => {
        result.current.closeTemplateDialog();
      });

      expect(result.current.isTemplateDialogOpen).toBe(false);
    });
  });

  // ============ Input Value Management Tests ============

  describe('input values', () => {
    it('should update dialogInputValue', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.setDialogInputValue('New section title');
      });

      expect(result.current.dialogInputValue).toBe('New section title');
    });

    it('should update subsectionInputValue', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.setSubsectionInputValue('New subsection title');
      });

      expect(result.current.subsectionInputValue).toBe('New subsection title');
    });

    it('should clear input values', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.setDialogInputValue('Some text');
        result.current.setSubsectionInputValue('Some subsection text');
      });

      act(() => {
        result.current.setDialogInputValue('');
        result.current.setSubsectionInputValue('');
      });

      expect(result.current.dialogInputValue).toBe('');
      expect(result.current.subsectionInputValue).toBe('');
    });
  });

  // ============ Context Management Tests ============

  describe('context management', () => {
    it('should update taskConflictContext', () => {
      const { result } = renderHook(() => useProposalDialogs());

      const context = {
        type: 'all' as const,
        sourceIds: ['source-1', 'source-2'],
        workflowType: 'technical' as const,
      };

      act(() => {
        result.current.setTaskConflictContext(context);
      });

      expect(result.current.taskConflictContext).toEqual(context);
    });

    it('should update contentGenerationTarget', () => {
      const { result } = renderHook(() => useProposalDialogs());

      const target = {
        task: { id: 'task-1', requirement_text: 'Task 1', status: 'pending', section_id: 'section-1' },
        section: { id: 'section-1', title: 'Section 1', order_index: 1 },
        sourceIds: ['source-1'],
      };

      act(() => {
        result.current.setContentGenerationTarget(target);
      });

      expect(result.current.contentGenerationTarget).toEqual(target);
    });

    it('should update selectedTaskForImage', () => {
      const { result } = renderHook(() => useProposalDialogs());

      const task = {
        id: 'task-1',
        requirement_text: 'Generate flowchart',
        status: 'pending',
        section_id: 'section-1',
      };

      act(() => {
        result.current.setSelectedTaskForImage(task);
      });

      expect(result.current.selectedTaskForImage).toEqual(task);
    });

    it('should update subsectionTargetSection', () => {
      const { result } = renderHook(() => useProposalDialogs());

      const section = {
        id: 'section-1',
        title: 'Parent Section',
        order_index: 1,
      };

      act(() => {
        result.current.setSubsectionTargetSection(section);
      });

      expect(result.current.subsectionTargetSection).toEqual(section);
    });

    it('should update structureWarningSection', () => {
      const { result } = renderHook(() => useProposalDialogs());

      const section = {
        id: 'section-1',
        title: 'Warning Section',
        order_index: 1,
      };

      act(() => {
        result.current.setStructureWarningSection(section);
      });

      expect(result.current.structureWarningSection).toEqual(section);
    });

    it('should clear context values', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.setTaskConflictContext({ type: 'all', sourceIds: [] });
        result.current.setContentGenerationTarget({} as any);
      });

      act(() => {
        result.current.setTaskConflictContext(null);
        result.current.setContentGenerationTarget(null);
      });

      expect(result.current.taskConflictContext).toBeNull();
      expect(result.current.contentGenerationTarget).toBeNull();
    });
  });

  // ============ UI State Tests ============

  describe('UI state', () => {
    it('should toggle showSourceSelector', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.setShowSourceSelector(true);
      });

      expect(result.current.showSourceSelector).toBe(true);

      act(() => {
        result.current.setShowSourceSelector(false);
      });

      expect(result.current.showSourceSelector).toBe(false);
    });
  });

  // ============ Pending Operations Tests ============

  describe('pending operations', () => {
    it('should update pendingSubsectionArgs', () => {
      const { result } = renderHook(() => useProposalDialogs());

      const args = {
        sectionId: 'section-1',
        title: 'New Subsection',
        sourceIds: ['source-1'],
      };

      act(() => {
        result.current.setPendingSubsectionArgs(args);
      });

      expect(result.current.pendingSubsectionArgs).toEqual(args);
    });

    it('should update pendingContentGeneration', () => {
      const { result } = renderHook(() => useProposalDialogs());

      const pending = {
        taskId: 'task-1',
        sectionId: 'section-1',
        sourceIds: ['source-1'],
      };

      act(() => {
        result.current.setPendingContentGeneration(pending);
      });

      expect(result.current.pendingContentGeneration).toEqual(pending);
    });

    it('should clear pending operations', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.setPendingSubsectionArgs({ some: 'data' });
        result.current.setPendingContentGeneration({ some: 'data' });
      });

      act(() => {
        result.current.setPendingSubsectionArgs(null);
        result.current.setPendingContentGeneration(null);
      });

      expect(result.current.pendingSubsectionArgs).toBeNull();
      expect(result.current.pendingContentGeneration).toBeNull();
    });
  });

  // ============ Batch Operations Tests ============

  describe('closeAllDialogs', () => {
    it('should close all dialogs at once', () => {
      const { result } = renderHook(() => useProposalDialogs());

      // Open all dialogs
      act(() => {
        result.current.openAddSection();
        result.current.openAddTask();
        result.current.openAddSubsection();
        result.current.openGenerateSubsection();
        result.current.openImageGeneration();
        result.current.openContentGeneration();
        result.current.openAddSource();
        result.current.openConflictDialog();
        result.current.openSubsectionConflictDialog();
        result.current.openContentConflictDialog();
        result.current.openTemplateDialog();
      });

      // Verify all are open
      expect(result.current.isAddSectionOpen).toBe(true);
      expect(result.current.isAddTaskOpen).toBe(true);
      expect(result.current.isConflictDialogOpen).toBe(true);

      // Close all
      act(() => {
        result.current.closeAllDialogs();
      });

      // Verify all are closed
      expect(result.current.isAddSectionOpen).toBe(false);
      expect(result.current.isAddTaskOpen).toBe(false);
      expect(result.current.isAddSubsectionOpen).toBe(false);
      expect(result.current.isGenerateSubsectionOpen).toBe(false);
      expect(result.current.imageGenDialogOpen).toBe(false);
      expect(result.current.isContentGenerationDialogOpen).toBe(false);
      expect(result.current.isAddSourceDialogOpen).toBe(false);
      expect(result.current.isConflictDialogOpen).toBe(false);
      expect(result.current.isSubsectionConflictDialogOpen).toBe(false);
      expect(result.current.isContentConflictDialogOpen).toBe(false);
      expect(result.current.isTemplateDialogOpen).toBe(false);
    });
  });

  describe('closeConflictDialogs', () => {
    it('should close only conflict dialogs', () => {
      const { result } = renderHook(() => useProposalDialogs());

      // Open mix of dialogs
      act(() => {
        result.current.openAddSection();
        result.current.openConflictDialog();
        result.current.openSubsectionConflictDialog();
        result.current.openContentConflictDialog();
      });

      // Close conflict dialogs
      act(() => {
        result.current.closeConflictDialogs();
      });

      // Verify only conflict dialogs are closed
      expect(result.current.isConflictDialogOpen).toBe(false);
      expect(result.current.isSubsectionConflictDialogOpen).toBe(false);
      expect(result.current.isContentConflictDialogOpen).toBe(false);

      // Verify other dialogs remain open
      expect(result.current.isAddSectionOpen).toBe(true);
    });
  });

  describe('closeGenerationDialogs', () => {
    it('should close only generation dialogs', () => {
      const { result } = renderHook(() => useProposalDialogs());

      // Open mix of dialogs
      act(() => {
        result.current.openAddTask();
        result.current.openGenerateSubsection();
        result.current.openImageGeneration();
        result.current.openContentGeneration();
      });

      // Close generation dialogs
      act(() => {
        result.current.closeGenerationDialogs();
      });

      // Verify only generation dialogs are closed
      expect(result.current.isGenerateSubsectionOpen).toBe(false);
      expect(result.current.imageGenDialogOpen).toBe(false);
      expect(result.current.isContentGenerationDialogOpen).toBe(false);

      // Verify other dialogs remain open
      expect(result.current.isAddTaskOpen).toBe(true);
    });
  });

  // ============ Complex Scenarios ============

  describe('complex scenarios', () => {
    it('should handle rapid open/close sequences', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openAddSection();
        result.current.closeAddSection();
        result.current.openAddSection();
      });

      expect(result.current.isAddSectionOpen).toBe(true);
    });

    it('should handle multiple dialogs open simultaneously', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openAddSection();
        result.current.openAddTask();
        result.current.openContentGeneration();
      });

      expect(result.current.isAddSectionOpen).toBe(true);
      expect(result.current.isAddTaskOpen).toBe(true);
      expect(result.current.isContentGenerationDialogOpen).toBe(true);
    });

    it('should maintain state consistency across re-renders', () => {
      const { result, rerender } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openAddSection();
        result.current.setDialogInputValue('Test Input');
      });

      rerender();

      expect(result.current.isAddSectionOpen).toBe(true);
      expect(result.current.dialogInputValue).toBe('Test Input');
    });

    it('should handle workflow: open dialog, set context, close dialog', () => {
      const { result } = renderHook(() => useProposalDialogs());

      // Open dialog
      act(() => {
        result.current.openContentGeneration();
      });

      // Set context
      act(() => {
        result.current.setContentGenerationTarget({
          task: { id: 'task-1', requirement_text: 'Task', status: 'pending', section_id: 'section-1' },
          section: { id: 'section-1', title: 'Section', order_index: 1 },
          sourceIds: ['source-1'],
        });
      });

      expect(result.current.isContentGenerationDialogOpen).toBe(true);
      expect(result.current.contentGenerationTarget).not.toBeNull();

      // Close dialog
      act(() => {
        result.current.closeContentGeneration();
      });

      expect(result.current.isContentGenerationDialogOpen).toBe(false);
      // Context should persist after dialog close
      expect(result.current.contentGenerationTarget).not.toBeNull();
    });
  });

  // ============ Edge Cases ============

  describe('edge cases', () => {
    it('should handle closing already closed dialogs', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.closeAddSection();
        result.current.closeAddTask();
      });

      expect(result.current.isAddSectionOpen).toBe(false);
      expect(result.current.isAddTaskOpen).toBe(false);
    });

    it('should handle opening already open dialogs', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.openAddSection();
        result.current.openAddSection();
      });

      expect(result.current.isAddSectionOpen).toBe(true);
    });

    it('should handle direct setter with same value', () => {
      const { result } = renderHook(() => useProposalDialogs());

      act(() => {
        result.current.setIsAddSectionOpen(false);
        result.current.setIsAddSectionOpen(false);
      });

      expect(result.current.isAddSectionOpen).toBe(false);
    });
  });
});
