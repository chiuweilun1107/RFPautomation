/**
 * Section Utilities Test Suite
 *
 * Coverage: parseChineseNumber, autoSortChildren, updateOrder, updateTaskOrder
 */

import {
  parseChineseNumber,
  updateOrder,
  updateTaskOrder,
} from '@/components/workspace/proposal-editor/utils/sectionUtils';

// Mock updateOrder for autoSortChildren tests
jest.mock('@/components/workspace/proposal-editor/utils/sectionUtils', () => {
  const actual = jest.requireActual('@/components/workspace/proposal-editor/utils/sectionUtils');
  return {
    ...actual,
    updateOrder: jest.fn().mockResolvedValue(undefined),
  };
});

describe('sectionUtils', () => {
  // ============ parseChineseNumber Tests ============

  describe('parseChineseNumber', () => {
    it('should parse single digit Chinese numerals', () => {
      expect(parseChineseNumber('一、章節')).toBe(1);
      expect(parseChineseNumber('二、章節')).toBe(2);
      expect(parseChineseNumber('三、章節')).toBe(3);
      expect(parseChineseNumber('四、章節')).toBe(4);
      expect(parseChineseNumber('五、章節')).toBe(5);
      expect(parseChineseNumber('六、章節')).toBe(6);
      expect(parseChineseNumber('七、章節')).toBe(7);
      expect(parseChineseNumber('八、章節')).toBe(8);
      expect(parseChineseNumber('九、章節')).toBe(9);
    });

    it('should parse ten (十)', () => {
      expect(parseChineseNumber('十、章節')).toBe(10);
    });

    it('should parse teens (十一 to 十九)', () => {
      expect(parseChineseNumber('十一、章節')).toBe(11);
      expect(parseChineseNumber('十二、章節')).toBe(12);
      expect(parseChineseNumber('十三、章節')).toBe(13);
      expect(parseChineseNumber('十九、章節')).toBe(19);
    });

    it('should parse zero (零)', () => {
      expect(parseChineseNumber('零、章節')).toBe(0);
    });

    it('should return Infinity for non-Chinese numerals', () => {
      expect(parseChineseNumber('Chapter 1')).toBe(Infinity);
      expect(parseChineseNumber('第一章')).toBe(Infinity);
      expect(parseChineseNumber('A. Section')).toBe(Infinity);
      expect(parseChineseNumber('1. Section')).toBe(Infinity);
    });

    it('should handle edge cases', () => {
      expect(parseChineseNumber('')).toBe(Infinity);
      expect(parseChineseNumber('、章節')).toBe(Infinity);
      expect(parseChineseNumber('abc')).toBe(Infinity);
    });

    it('should only parse first character(s)', () => {
      expect(parseChineseNumber('一二三')).toBe(1); // Only first char
      expect(parseChineseNumber('十九八')).toBe(19); // 十九
    });
  });

  // ============ autoSortChildren Tests ============

  describe('autoSortChildren', () => {
    let mockSupabase: any;
    const { autoSortChildren } = require('@/components/workspace/proposal-editor/utils/sectionUtils');
    const mockUpdateOrder = require('@/components/workspace/proposal-editor/utils/sectionUtils').updateOrder as jest.Mock;

    beforeEach(() => {
      mockUpdateOrder.mockClear();
    });

    it('should sort children by Chinese numerals', async () => {
      const mockData = [
        { id: 's1', title: '三、第三章', parent_id: 'parent', order_index: 3 },
        { id: 's2', title: '一、第一章', parent_id: 'parent', order_index: 1 },
        { id: 's3', title: '二、第二章', parent_id: 'parent', order_index: 2 },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      mockSupabase = {
        from: jest.fn(() => mockChain),
      };

      await autoSortChildren(mockSupabase, 'project-1', 'parent');

      expect(mockUpdateOrder).toHaveBeenCalled();
      // updateOrder(supabase, items) - items is second parameter (index 1)
      const callArgs = mockUpdateOrder.mock.calls[0];
      expect(callArgs.length).toBeGreaterThanOrEqual(2);
      const updateCall = callArgs[1];
      expect(updateCall[0].id).toBe('s2'); // 一
      expect(updateCall[1].id).toBe('s3'); // 二
      expect(updateCall[2].id).toBe('s1'); // 三
    });

    it('should handle empty children', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockSupabase = {
        from: jest.fn(() => mockChain),
      };

      await autoSortChildren(mockSupabase, 'project-1', 'parent');

      expect(mockUpdateOrder).not.toHaveBeenCalled();
    });

    it('should handle null data', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabase = {
        from: jest.fn(() => mockChain),
      };

      await autoSortChildren(mockSupabase, 'project-1', 'parent');

      expect(mockUpdateOrder).not.toHaveBeenCalled();
    });

    it('should skip update if order is already correct', async () => {
      const mockData = [
        { id: 's1', title: '一、第一章', parent_id: 'parent', order_index: 1 },
        { id: 's2', title: '二、第二章', parent_id: 'parent', order_index: 2 },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      mockSupabase = {
        from: jest.fn(() => mockChain),
      };

      await autoSortChildren(mockSupabase, 'project-1', 'parent');

      expect(mockUpdateOrder).not.toHaveBeenCalled();
    });

    it('should handle mixed Chinese and non-Chinese titles', async () => {
      const mockData = [
        { id: 's1', title: 'Introduction', parent_id: 'parent', order_index: 3 },
        { id: 's2', title: '一、第一章', parent_id: 'parent', order_index: 1 },
        { id: 's3', title: '二、第二章', parent_id: 'parent', order_index: 2 },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      mockSupabase = {
        from: jest.fn(() => mockChain),
      };

      await autoSortChildren(mockSupabase, 'project-1', 'parent');

      const callArgs = mockUpdateOrder.mock.calls[0];
      const updateCall = callArgs[1];
      expect(updateCall[0].id).toBe('s2'); // 一
      expect(updateCall[1].id).toBe('s3'); // 二
      expect(updateCall[2].id).toBe('s1'); // Non-Chinese at end
    });

    it('should handle database errors gracefully', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
      };
      mockSupabase = {
        from: jest.fn(() => mockChain),
      };

      // Should not throw
      await expect(autoSortChildren(mockSupabase, 'project-1', 'parent')).resolves.not.toThrow();
    });

    it('should handle teens correctly (十一, 十二)', async () => {
      const mockData = [
        { id: 's1', title: '十二、第十二章', parent_id: 'parent', order_index: 3 },
        { id: 's2', title: '十、第十章', parent_id: 'parent', order_index: 1 },
        { id: 's3', title: '十一、第十一章', parent_id: 'parent', order_index: 2 },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      mockSupabase = {
        from: jest.fn(() => mockChain),
      };

      await autoSortChildren(mockSupabase, 'project-1', 'parent');

      const callArgs = mockUpdateOrder.mock.calls[0];
      const updateCall = callArgs[1];
      expect(updateCall[0].id).toBe('s2'); // 十 (10)
      expect(updateCall[1].id).toBe('s3'); // 十一 (11)
      expect(updateCall[2].id).toBe('s1'); // 十二 (12)
    });
  });

  // ============ updateOrder Tests ============

  describe('updateOrder', () => {
    let mockSupabase: any;
    // Use actual implementation for updateOrder tests
    const { updateOrder: actualUpdateOrder } = jest.requireActual(
      '@/components/workspace/proposal-editor/utils/sectionUtils'
    );

    beforeEach(() => {
      mockSupabase = {
        from: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockResolvedValue({ error: null }),
      };
    });

    it('should update section order in database', async () => {
      const items = [
        { id: 's1', project_id: 'p1', title: 'Section 1', order_index: 1, parent_id: null },
        { id: 's2', project_id: 'p1', title: 'Section 2', order_index: 2, parent_id: null },
      ];

      await actualUpdateOrder(mockSupabase, items);

      expect(mockSupabase.from).toHaveBeenCalledWith('sections');
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        items.map(item => ({
          id: item.id,
          project_id: item.project_id,
          title: item.title,
          order_index: item.order_index,
          parent_id: item.parent_id,
        })),
        { onConflict: 'id' }
      );
    });

    it('should handle database errors', async () => {
      const dbError = { message: 'Update failed' };
      mockSupabase.upsert.mockResolvedValue({ error: dbError });

      const items = [
        { id: 's1', project_id: 'p1', title: 'Section 1', order_index: 1, parent_id: null },
      ];

      await expect(actualUpdateOrder(mockSupabase, items)).rejects.toEqual(dbError);
    });

    it('should handle empty array', async () => {
      await actualUpdateOrder(mockSupabase, []);

      expect(mockSupabase.upsert).toHaveBeenCalledWith([], { onConflict: 'id' });
    });

    it('should preserve parent_id when provided', async () => {
      const items = [
        { id: 's1', project_id: 'p1', title: 'Child', order_index: 1, parent_id: 'parent' },
      ];

      await actualUpdateOrder(mockSupabase, items);

      const upsertCall = mockSupabase.upsert.mock.calls[0][0];
      expect(upsertCall[0].parent_id).toBe('parent');
    });
  });

  // ============ updateTaskOrder Tests ============

  describe('updateTaskOrder', () => {
    let mockSupabase: any;
    const { updateTaskOrder: actualUpdateTaskOrder } = jest.requireActual(
      '@/components/workspace/proposal-editor/utils/sectionUtils'
    );

    beforeEach(() => {
      mockSupabase = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
    });

    it('should update task order in database', async () => {
      const updates = [
        { id: 't1', order_index: 1 },
        { id: 't2', order_index: 2 },
      ];

      await actualUpdateTaskOrder(mockSupabase, updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(mockSupabase.update).toHaveBeenCalledTimes(2);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 't1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 't2');
    });

    it('should update task section_id when provided', async () => {
      const updates = [
        { id: 't1', section_id: 's2', order_index: 1 },
      ];

      await actualUpdateTaskOrder(mockSupabase, updates);

      expect(mockSupabase.update).toHaveBeenCalledWith(updates[0]);
    });

    it('should handle database errors', async () => {
      const dbError = { message: 'Update failed' };
      mockSupabase.eq.mockResolvedValue({ error: dbError });

      const updates = [{ id: 't1', order_index: 1 }];

      await expect(actualUpdateTaskOrder(mockSupabase, updates)).rejects.toEqual(dbError);
    });

    it('should handle empty updates array', async () => {
      await actualUpdateTaskOrder(mockSupabase, []);

      expect(mockSupabase.update).not.toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      const updates = [
        { id: 't1', order_index: 5 }, // Only order_index
      ];

      await actualUpdateTaskOrder(mockSupabase, updates);

      expect(mockSupabase.update).toHaveBeenCalledWith({ id: 't1', order_index: 5 });
    });

    it('should process updates sequentially', async () => {
      const updates = [
        { id: 't1', order_index: 1 },
        { id: 't2', order_index: 2 },
        { id: 't3', order_index: 3 },
      ];

      await actualUpdateTaskOrder(mockSupabase, updates);

      expect(mockSupabase.update).toHaveBeenCalledTimes(3);
    });
  });
});
