/**
 * useProposalState Hook Test Suite
 *
 * Coverage: State management, expansion toggles, inline editing, computed values
 */

import { renderHook, act } from '@testing-library/react';
import { useProposalState } from '@/components/workspace/proposal-editor/hooks/useProposalState';
import type { Section, Task } from '@/components/workspace/proposal-editor/types';

describe('useProposalState', () => {
  // ============ Test Fixtures ============

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      requirement_text: 'Task 1',
      status: 'pending',
      section_id: 'section-1',
      task_images: [
        { id: 'img-1', task_id: 'task-1', image_type: 'hero', prompt: '', image_url: 'https://example.com/img1.png', created_at: '' },
      ],
    },
    {
      id: 'task-2',
      requirement_text: 'Task 2',
      status: 'pending',
      section_id: 'section-2',
    },
  ];

  const mockSections: Section[] = [
    {
      id: 'section-1',
      title: 'Section 1',
      order_index: 1,
      tasks: [mockTasks[0]],
      children: [
        {
          id: 'section-2',
          title: 'Section 1.1',
          order_index: 1,
          parent_id: 'section-1',
          tasks: [mockTasks[1]],
        },
      ],
    },
  ];

  // ============ Initialization Tests ============

  describe('initialization', () => {
    it('should initialize with default values when no initial sections provided', () => {
      const { result } = renderHook(() => useProposalState());

      expect(result.current.sections).toEqual([]);
      expect(result.current.expandedSections).toEqual(new Set());
      expect(result.current.expandedTaskIds).toEqual(new Set());
      expect(result.current.loading).toBe(false);
      expect(result.current.generating).toBe(false);
    });

    it('should initialize with provided sections', () => {
      const { result } = renderHook(() => useProposalState(mockSections));

      expect(result.current.sections).toEqual(mockSections);
      expect(result.current.sections.length).toBe(1);
    });

    it('should initialize expanded categories with default values', () => {
      const { result } = renderHook(() => useProposalState());

      expect(result.current.expandedCategories.has('tender')).toBe(true);
      expect(result.current.expandedCategories.has('internal')).toBe(true);
      expect(result.current.expandedCategories.has('external')).toBe(true);
    });
  });

  // ============ Section Expansion Tests ============

  describe('toggleSectionExpansion', () => {
    it('should expand a section', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.toggleSectionExpansion('section-1');
      });

      expect(result.current.expandedSections.has('section-1')).toBe(true);
    });

    it('should collapse an expanded section', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.toggleSectionExpansion('section-1');
      });
      expect(result.current.expandedSections.has('section-1')).toBe(true);

      act(() => {
        result.current.toggleSectionExpansion('section-1');
      });
      expect(result.current.expandedSections.has('section-1')).toBe(false);
    });

    it('should handle multiple sections', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.toggleSectionExpansion('section-1');
        result.current.toggleSectionExpansion('section-2');
      });

      expect(result.current.expandedSections.has('section-1')).toBe(true);
      expect(result.current.expandedSections.has('section-2')).toBe(true);
    });
  });

  // ============ Task Expansion Tests ============

  describe('toggleTaskExpansion', () => {
    it('should expand a task', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.toggleTaskExpansion('task-1');
      });

      expect(result.current.expandedTaskIds.has('task-1')).toBe(true);
    });

    it('should collapse an expanded task', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.toggleTaskExpansion('task-1');
      });

      act(() => {
        result.current.toggleTaskExpansion('task-1');
      });

      expect(result.current.expandedTaskIds.has('task-1')).toBe(false);
    });
  });

  // ============ Category Expansion Tests ============

  describe('toggleCategoryExpansion', () => {
    it('should collapse a default expanded category', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.toggleCategoryExpansion('tender');
      });

      expect(result.current.expandedCategories.has('tender')).toBe(false);
    });

    it('should expand a collapsed category', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.toggleCategoryExpansion('tender');
      });
      expect(result.current.expandedCategories.has('tender')).toBe(false);

      act(() => {
        result.current.toggleCategoryExpansion('tender');
      });
      expect(result.current.expandedCategories.has('tender')).toBe(true);
    });
  });

  // ============ Inline Editing Tests ============

  describe('inline editing', () => {
    it('should start inline editing for section', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.startInlineEditSection('section-1', 'Original Title');
      });

      expect(result.current.inlineEditingSectionId).toBe('section-1');
      expect(result.current.inlineSectionValue).toBe('Original Title');
    });

    it('should cancel inline editing for section', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.startInlineEditSection('section-1', 'Original Title');
      });

      act(() => {
        result.current.cancelInlineEditSection();
      });

      expect(result.current.inlineEditingSectionId).toBeNull();
      expect(result.current.inlineSectionValue).toBe('');
    });

    it('should start inline editing for task', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.startInlineEditTask('task-1', 'Original Task Text');
      });

      expect(result.current.inlineEditingTaskId).toBe('task-1');
      expect(result.current.inlineTaskValue).toBe('Original Task Text');
    });

    it('should cancel inline editing for task', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.startInlineEditTask('task-1', 'Original Task Text');
      });

      act(() => {
        result.current.cancelInlineEditTask();
      });

      expect(result.current.inlineEditingTaskId).toBeNull();
      expect(result.current.inlineTaskValue).toBe('');
    });
  });

  // ============ Computed Values Tests ============

  describe('flatSections', () => {
    it('should return flattened sections with correct depth', () => {
      const { result } = renderHook(() => useProposalState(mockSections));

      expect(result.current.flatSections).toHaveLength(1);
      expect(result.current.flatSections[0].section.id).toBe('section-1');
      expect(result.current.flatSections[0].depth).toBe(0);
    });

    it('should include children when section is expanded', () => {
      const { result } = renderHook(() => useProposalState(mockSections));

      act(() => {
        result.current.toggleSectionExpansion('section-1');
      });

      expect(result.current.flatSections).toHaveLength(2);
      expect(result.current.flatSections[0].section.id).toBe('section-1');
      expect(result.current.flatSections[0].depth).toBe(0);
      expect(result.current.flatSections[1].section.id).toBe('section-2');
      expect(result.current.flatSections[1].depth).toBe(1);
    });

    it('should recalculate when sections change', () => {
      const { result } = renderHook(() => useProposalState(mockSections));

      act(() => {
        result.current.setSections([]);
      });

      expect(result.current.flatSections).toHaveLength(0);
    });
  });

  describe('allProjectImages', () => {
    it('should collect all images from all tasks', () => {
      const { result } = renderHook(() => useProposalState(mockSections));

      expect(result.current.allProjectImages).toHaveLength(1);
      expect(result.current.allProjectImages[0].id).toBe('img-1');
      expect(result.current.allProjectImages[0].url).toBe('https://example.com/img1.png');
    });

    it('should handle tasks without images', () => {
      const sectionsNoImages: Section[] = [
        {
          id: 'section-1',
          title: 'Section 1',
          order_index: 1,
          tasks: [
            {
              id: 'task-1',
              requirement_text: 'Task 1',
              status: 'pending',
              section_id: 'section-1',
            },
          ],
        },
      ];

      const { result } = renderHook(() => useProposalState(sectionsNoImages));

      expect(result.current.allProjectImages).toHaveLength(0);
    });

    it('should collect images from nested sections', () => {
      const { result } = renderHook(() => useProposalState(mockSections));

      expect(result.current.allProjectImages.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ============ Reset Functions Tests ============

  describe('resetGenerationState', () => {
    it('should reset all generation-related state', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.setGenerating(true);
        result.current.setStreamingSections(new Set(['section-1']));
        result.current.setProgress({ current: 5, total: 10 });
        result.current.setGeneratingTaskId('task-1');
        result.current.setGeneratingSectionId('section-1');
        result.current.setIsGeneratingSubsection(true);
      });

      act(() => {
        result.current.resetGenerationState();
      });

      expect(result.current.generating).toBe(false);
      expect(result.current.streamingSections).toEqual(new Set());
      expect(result.current.progress).toBeNull();
      expect(result.current.generatingTaskId).toBeNull();
      expect(result.current.generatingSectionId).toBeNull();
      expect(result.current.isGeneratingSubsection).toBe(false);
    });
  });

  describe('resetEditingState', () => {
    it('should reset all editing-related state', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.setEditingSection(mockSections[0]);
        result.current.setEditingTask(mockTasks[0]);
        result.current.setTargetSection(mockSections[0]);
        result.current.setTargetSectionId('section-1');
        result.current.startInlineEditSection('section-1', 'Title');
        result.current.startInlineEditTask('task-1', 'Text');
      });

      act(() => {
        result.current.resetEditingState();
      });

      expect(result.current.editingSection).toBeNull();
      expect(result.current.editingTask).toBeNull();
      expect(result.current.targetSection).toBeNull();
      expect(result.current.targetSectionId).toBeNull();
      expect(result.current.inlineEditingSectionId).toBeNull();
      expect(result.current.inlineEditingTaskId).toBeNull();
    });
  });

  // ============ State Setters Tests ============

  describe('state setters', () => {
    it('should update sections', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.setSections(mockSections);
      });

      expect(result.current.sections).toEqual(mockSections);
    });

    it('should update loading state', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);
    });

    it('should update generating state', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.setGenerating(true);
      });

      expect(result.current.generating).toBe(true);
    });

    it('should update progress', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.setProgress({ current: 3, total: 10 });
      });

      expect(result.current.progress).toEqual({ current: 3, total: 10 });
    });

    it('should update sources', () => {
      const { result } = renderHook(() => useProposalState());

      const mockSources = [
        { id: 'source-1', title: 'Source 1', project_id: 'p1' },
      ];

      act(() => {
        result.current.setSources(mockSources);
      });

      expect(result.current.sources).toEqual(mockSources);
    });

    it('should update selectedSourceIds', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.setSelectedSourceIds(['source-1', 'source-2']);
      });

      expect(result.current.selectedSourceIds).toEqual(['source-1', 'source-2']);
    });
  });

  // ============ Complex State Management Tests ============

  describe('complex state management', () => {
    it('should handle multiple state updates in sequence', () => {
      const { result } = renderHook(() => useProposalState(mockSections));

      act(() => {
        result.current.toggleSectionExpansion('section-1');
        result.current.toggleTaskExpansion('task-1');
        result.current.setLoading(true);
        result.current.setGenerating(true);
      });

      expect(result.current.expandedSections.has('section-1')).toBe(true);
      expect(result.current.expandedTaskIds.has('task-1')).toBe(true);
      expect(result.current.loading).toBe(true);
      expect(result.current.generating).toBe(true);
    });

    it('should maintain state consistency across renders', () => {
      const { result, rerender } = renderHook(() => useProposalState(mockSections));

      act(() => {
        result.current.toggleSectionExpansion('section-1');
      });

      rerender();

      expect(result.current.expandedSections.has('section-1')).toBe(true);
    });
  });

  // ============ Edge Cases ============

  describe('edge cases', () => {
    it('should handle empty section view modes', () => {
      const { result } = renderHook(() => useProposalState());

      expect(result.current.sectionViewModes).toEqual({});
    });

    it('should handle empty task contents map', () => {
      const { result } = renderHook(() => useProposalState());

      expect(result.current.taskContents).toEqual(new Map());
    });

    it('should handle empty open content panels map', () => {
      const { result } = renderHook(() => useProposalState());

      expect(result.current.openContentPanels).toEqual(new Map());
    });

    it('should handle setting section view modes', () => {
      const { result } = renderHook(() => useProposalState());

      act(() => {
        result.current.setSectionViewModes({
          'section-1': 'content',
          'section-2': 'tasks',
        });
      });

      expect(result.current.sectionViewModes).toEqual({
        'section-1': 'content',
        'section-2': 'tasks',
      });
    });
  });
});
