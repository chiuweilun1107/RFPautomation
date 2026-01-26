/**
 * Event Handlers Utilities Test Suite
 *
 * Coverage: Toggle expand, delete operations, inline edit, reorder
 */

import { EventHandlers } from '@/components/workspace/proposal-editor/utils/eventHandlers';
import type { Section, Task } from '@/components/workspace/proposal-editor/types';
import { toast } from 'sonner';

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('EventHandlers', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn(() => ({
        delete: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
      storage: {
        from: jest.fn(() => ({
          remove: jest.fn().mockResolvedValue({ error: null }),
        })),
      },
    };
  });

  // ============ handleToggleExpand Tests ============

  describe('handleToggleExpand', () => {
    it('should add id to expanded set when not present', () => {
      const expandedSet = new Set<string>();
      const setExpandedSet = jest.fn();

      EventHandlers.handleToggleExpand('section-1', expandedSet, setExpandedSet);

      expect(setExpandedSet).toHaveBeenCalled();
      const newSet = setExpandedSet.mock.calls[0][0];
      expect(newSet.has('section-1')).toBe(true);
    });

    it('should remove id from expanded set when present', () => {
      const expandedSet = new Set<string>(['section-1']);
      const setExpandedSet = jest.fn();

      EventHandlers.handleToggleExpand('section-1', expandedSet, setExpandedSet);

      expect(setExpandedSet).toHaveBeenCalled();
      const newSet = setExpandedSet.mock.calls[0][0];
      expect(newSet.has('section-1')).toBe(false);
    });

    it('should not mutate original set', () => {
      const originalSet = new Set<string>(['section-1']);
      const setExpandedSet = jest.fn();

      EventHandlers.handleToggleExpand('section-2', originalSet, setExpandedSet);

      expect(originalSet.has('section-1')).toBe(true);
      expect(originalSet.has('section-2')).toBe(false);
    });

    it('should handle multiple toggles', () => {
      let currentSet = new Set<string>();
      const setExpandedSet = jest.fn((newSet) => {
        currentSet = newSet;
      });

      // Expand
      EventHandlers.handleToggleExpand('section-1', currentSet, setExpandedSet);
      currentSet = setExpandedSet.mock.calls[0][0];
      expect(currentSet.has('section-1')).toBe(true);

      // Collapse
      EventHandlers.handleToggleExpand('section-1', currentSet, setExpandedSet);
      currentSet = setExpandedSet.mock.calls[1][0];
      expect(currentSet.has('section-1')).toBe(false);
    });
  });

  // ============ handleDeleteSection Tests ============

  describe('handleDeleteSection', () => {
    it('should delete section successfully', async () => {
      const deleteMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      }));

      const sections: Section[] = [
        { id: 'section-1', title: 'Section 1', order_index: 1 },
        { id: 'section-2', title: 'Section 2', order_index: 2 },
      ];
      const setSections = jest.fn();

      await EventHandlers.handleDeleteSection('section-1', sections, setSections, mockSupabase);

      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', 'section-1');
      expect(setSections).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Chapter deleted');

      const newSections = setSections.mock.calls[0][0];
      expect(newSections).toHaveLength(1);
      expect(newSections[0].id).toBe('section-2');
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Delete failed');
      mockSupabase.from = jest.fn(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: dbError }),
      }));

      const sections: Section[] = [
        { id: 'section-1', title: 'Section 1', order_index: 1 },
      ];
      const setSections = jest.fn();

      await EventHandlers.handleDeleteSection('section-1', sections, setSections, mockSupabase);

      expect(toast.error).toHaveBeenCalledWith(`Delete failed: ${dbError.message}`);
      expect(setSections).not.toHaveBeenCalled();
    });

    it('should handle deleting non-existent section', async () => {
      const deleteMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      }));

      const sections: Section[] = [
        { id: 'section-1', title: 'Section 1', order_index: 1 },
      ];
      const setSections = jest.fn();

      await EventHandlers.handleDeleteSection('non-existent', sections, setSections, mockSupabase);

      expect(setSections).toHaveBeenCalled();
      const newSections = setSections.mock.calls[0][0];
      expect(newSections).toHaveLength(1);
      expect(newSections[0].id).toBe('section-1');
    });
  });

  // ============ handleDeleteTask Tests ============

  describe('handleDeleteTask', () => {
    it('should delete task successfully', async () => {
      const deleteMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      }));

      const sections: Section[] = [
        {
          id: 'section-1',
          title: 'Section 1',
          order_index: 1,
          tasks: [
            { id: 'task-1', requirement_text: 'Task 1', status: 'pending', section_id: 'section-1' },
            { id: 'task-2', requirement_text: 'Task 2', status: 'pending', section_id: 'section-1' },
          ],
        },
      ];
      const setSections = jest.fn();

      await EventHandlers.handleDeleteTask('task-1', 'section-1', sections, setSections, mockSupabase);

      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', 'task-1');
      expect(setSections).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Task deleted');

      const newSections = setSections.mock.calls[0][0];
      expect(newSections[0].tasks).toHaveLength(1);
      expect(newSections[0].tasks![0].id).toBe('task-2');
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Delete failed');
      mockSupabase.from = jest.fn(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: dbError }),
      }));

      const sections: Section[] = [
        {
          id: 'section-1',
          title: 'Section 1',
          order_index: 1,
          tasks: [
            { id: 'task-1', requirement_text: 'Task 1', status: 'pending', section_id: 'section-1' },
          ],
        },
      ];
      const setSections = jest.fn();

      await EventHandlers.handleDeleteTask('task-1', 'section-1', sections, setSections, mockSupabase);

      expect(toast.error).toHaveBeenCalledWith(`Delete failed: ${dbError.message}`);
      expect(setSections).not.toHaveBeenCalled();
    });

    it('should handle section without tasks', async () => {
      const deleteMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      }));

      const sections: Section[] = [
        {
          id: 'section-1',
          title: 'Section 1',
          order_index: 1,
        },
      ];
      const setSections = jest.fn();

      await EventHandlers.handleDeleteTask('task-1', 'section-1', sections, setSections, mockSupabase);

      expect(setSections).toHaveBeenCalled();
      const newSections = setSections.mock.calls[0][0];
      expect(newSections[0].tasks).toEqual([]);
    });

    it('should not affect other sections', async () => {
      const deleteMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      }));

      const sections: Section[] = [
        {
          id: 'section-1',
          title: 'Section 1',
          order_index: 1,
          tasks: [
            { id: 'task-1', requirement_text: 'Task 1', status: 'pending', section_id: 'section-1' },
          ],
        },
        {
          id: 'section-2',
          title: 'Section 2',
          order_index: 2,
          tasks: [
            { id: 'task-2', requirement_text: 'Task 2', status: 'pending', section_id: 'section-2' },
          ],
        },
      ];
      const setSections = jest.fn();

      await EventHandlers.handleDeleteTask('task-1', 'section-1', sections, setSections, mockSupabase);

      const newSections = setSections.mock.calls[0][0];
      expect(newSections[0].tasks).toHaveLength(0);
      expect(newSections[1].tasks).toHaveLength(1);
    });
  });

  // ============ handleDeleteImage Tests ============

  describe('handleDeleteImage', () => {
    it('should delete image successfully', async () => {
      const deleteMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      const removeMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      }));
      mockSupabase.storage.from = jest.fn(() => ({
        remove: removeMock,
      }));

      const onSuccess = jest.fn();

      await EventHandlers.handleDeleteImage(
        'image-1',
        'https://example.com/storage/proposal-images/test.png',
        mockSupabase,
        onSuccess
      );

      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', 'image-1');
      expect(removeMock).toHaveBeenCalledWith(['test.png']);
      expect(toast.success).toHaveBeenCalledWith('Image deleted');
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should handle database delete errors', async () => {
      const dbError = new Error('Delete failed');
      mockSupabase.from = jest.fn(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: dbError }),
      }));

      const onSuccess = jest.fn();

      await EventHandlers.handleDeleteImage('image-1', 'https://example.com/test.png', mockSupabase, onSuccess);

      expect(toast.error).toHaveBeenCalledWith(`Delete failed: ${dbError.message}`);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should continue even if storage delete fails', async () => {
      const deleteMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      const removeMock = jest.fn().mockRejectedValue(new Error('Storage error'));

      mockSupabase.from = jest.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      }));
      mockSupabase.storage.from = jest.fn(() => ({
        remove: removeMock,
      }));

      const onSuccess = jest.fn();

      await EventHandlers.handleDeleteImage(
        'image-1',
        'https://example.com/storage/proposal-images/test.png',
        mockSupabase,
        onSuccess
      );

      expect(toast.success).toHaveBeenCalledWith('Image deleted');
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should handle invalid image URL', async () => {
      const deleteMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      }));

      const onSuccess = jest.fn();

      await EventHandlers.handleDeleteImage('image-1', '', mockSupabase, onSuccess);

      expect(toast.success).toHaveBeenCalledWith('Image deleted');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  // ============ handleSaveInlineEdit Tests ============

  describe('handleSaveInlineEdit', () => {
    it('should save section edit successfully', async () => {
      const updateMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn(() => ({
        update: updateMock,
        eq: eqMock,
      }));

      const onSuccess = jest.fn();

      await EventHandlers.handleSaveInlineEdit('section', 'section-1', 'Updated Title', mockSupabase, onSuccess);

      expect(mockSupabase.from).toHaveBeenCalledWith('sections');
      expect(updateMock).toHaveBeenCalledWith({ title: 'Updated Title' });
      expect(eqMock).toHaveBeenCalledWith('id', 'section-1');
      expect(toast.success).toHaveBeenCalledWith('Chapter updated');
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should save task edit successfully', async () => {
      const updateMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn(() => ({
        update: updateMock,
        eq: eqMock,
      }));

      const onSuccess = jest.fn();

      await EventHandlers.handleSaveInlineEdit('task', 'task-1', 'Updated Task', mockSupabase, onSuccess);

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(updateMock).toHaveBeenCalledWith({ requirement_text: 'Updated Task' });
      expect(eqMock).toHaveBeenCalledWith('id', 'task-1');
      expect(toast.success).toHaveBeenCalledWith('Task updated');
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should reject empty content', async () => {
      const onSuccess = jest.fn();

      await EventHandlers.handleSaveInlineEdit('section', 'section-1', '', mockSupabase, onSuccess);

      expect(toast.error).toHaveBeenCalledWith('Content cannot be empty');
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should reject whitespace-only content', async () => {
      const onSuccess = jest.fn();

      await EventHandlers.handleSaveInlineEdit('section', 'section-1', '   ', mockSupabase, onSuccess);

      expect(toast.error).toHaveBeenCalledWith('Content cannot be empty');
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Update failed');
      mockSupabase.from = jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: dbError }),
      }));

      const onSuccess = jest.fn();

      await EventHandlers.handleSaveInlineEdit('section', 'section-1', 'Updated', mockSupabase, onSuccess);

      expect(toast.error).toHaveBeenCalledWith(`Update failed: ${dbError.message}`);
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  // ============ handleReorder Tests ============

  describe('handleReorder', () => {
    it('should reorder sections successfully', async () => {
      const updateMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn(() => ({
        update: updateMock,
        eq: eqMock,
      }));

      const sections: Section[] = [
        { id: 'section-1', title: 'Section 1', order_index: 2 },
        { id: 'section-2', title: 'Section 2', order_index: 1 },
      ];

      const onSuccess = jest.fn();

      await EventHandlers.handleReorder('section', sections, mockSupabase, onSuccess);

      expect(mockSupabase.from).toHaveBeenCalledWith('sections');
      expect(updateMock).toHaveBeenCalledTimes(2);
      expect(toast.success).toHaveBeenCalledWith('Reordered successfully');
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should reorder tasks successfully', async () => {
      const updateMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn(() => ({
        update: updateMock,
        eq: eqMock,
      }));

      const tasks: Task[] = [
        { id: 'task-1', requirement_text: 'Task 1', status: 'pending', section_id: 'section-1', order_index: 2 },
        { id: 'task-2', requirement_text: 'Task 2', status: 'pending', section_id: 'section-1', order_index: 1 },
      ];

      const onSuccess = jest.fn();

      await EventHandlers.handleReorder('task', tasks, mockSupabase, onSuccess);

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(updateMock).toHaveBeenCalledTimes(2);
      expect(toast.success).toHaveBeenCalledWith('Reordered successfully');
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should handle database errors during reorder', async () => {
      const dbError = new Error('Reorder failed');
      mockSupabase.from = jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: dbError }),
      }));

      const sections: Section[] = [
        { id: 'section-1', title: 'Section 1', order_index: 1 },
      ];

      const onSuccess = jest.fn();

      await EventHandlers.handleReorder('section', sections, mockSupabase, onSuccess);

      expect(toast.error).toHaveBeenCalledWith(`Reorder failed: ${dbError.message}`);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should handle empty items array', async () => {
      const updateMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn(() => ({
        update: updateMock,
        eq: eqMock,
      }));

      const onSuccess = jest.fn();

      await EventHandlers.handleReorder('section', [], mockSupabase, onSuccess);

      expect(updateMock).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Reordered successfully');
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should update order_index sequentially', async () => {
      const updateMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn(() => ({
        update: updateMock,
        eq: eqMock,
      }));

      const sections: Section[] = [
        { id: 'section-1', title: 'Section 1', order_index: 100 },
        { id: 'section-2', title: 'Section 2', order_index: 50 },
        { id: 'section-3', title: 'Section 3', order_index: 25 },
      ];

      await EventHandlers.handleReorder('section', sections, mockSupabase);

      expect(updateMock).toHaveBeenNthCalledWith(1, { order_index: 0 });
      expect(updateMock).toHaveBeenNthCalledWith(2, { order_index: 1 });
      expect(updateMock).toHaveBeenNthCalledWith(3, { order_index: 2 });
    });
  });

  // ============ Edge Cases ============

  describe('edge cases', () => {
    it('should handle concurrent delete operations gracefully', async () => {
      const deleteMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      }));

      const sections: Section[] = [
        { id: 'section-1', title: 'Section 1', order_index: 1 },
        { id: 'section-2', title: 'Section 2', order_index: 2 },
      ];
      const setSections = jest.fn();

      await Promise.all([
        EventHandlers.handleDeleteSection('section-1', sections, setSections, mockSupabase),
        EventHandlers.handleDeleteSection('section-2', sections, setSections, mockSupabase),
      ]);

      expect(setSections).toHaveBeenCalledTimes(2);
    });

    it('should handle optional onSuccess callback', async () => {
      const deleteMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      }));

      // No onSuccess callback
      await EventHandlers.handleDeleteImage('image-1', 'https://example.com/test.png', mockSupabase);

      expect(toast.success).toHaveBeenCalledWith('Image deleted');
    });
  });
});
