/**
 * useProposalOperations Hook Test Suite
 *
 * Coverage: Section CRUD, Task CRUD, Drag and Drop, AI Generation
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useProposalOperations } from '@/components/workspace/proposal-editor/hooks/useProposalOperations';
import type { Section, Task } from '@/components/workspace/proposal-editor/types';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock Supabase client
let mockSupabaseClient: any;

describe('useProposalOperations', () => {
  const projectId = 'test-project-id';
  const mockFetchData = jest.fn().mockResolvedValue(undefined);

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      requirement_text: 'Task 1',
      status: 'pending',
      section_id: 'section-1',
      order_index: 1,
    },
    {
      id: 'task-2',
      requirement_text: 'Task 2',
      status: 'pending',
      section_id: 'section-1',
      order_index: 2,
    },
  ];

  const mockSections: Section[] = [
    {
      id: 'section-1',
      title: 'Section 1',
      order_index: 1,
      tasks: mockTasks,
    },
    {
      id: 'section-2',
      title: 'Section 2',
      order_index: 2,
      tasks: [],
    },
  ];

  let setSections: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setSections = jest.fn();

    // Setup mock Supabase client
    mockSupabaseClient = {
      from: jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
        select: jest.fn().mockReturnThis(),
      })),
    };
  });

  // ============ Section Operations Tests ============

  describe('addSection', () => {
    it('should add a new section successfully', async () => {
      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        await result.current.addSection('New Section');
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('sections');
      expect(toast.success).toHaveBeenCalledWith('章節已添加');
      expect(mockFetchData).toHaveBeenCalled();
    });

    it('should add a subsection with parent_id', async () => {
      const insertMock = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn(() => ({
        insert: insertMock,
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        await result.current.addSection('New Subsection', 'parent-section-id');
      });

      expect(insertMock).toHaveBeenCalledWith({
        project_id: projectId,
        title: 'New Subsection',
        parent_id: 'parent-section-id',
        order_index: 0,
      });
      expect(toast.success).toHaveBeenCalledWith('章節已添加');
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database error');
      mockSupabaseClient.from = jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({ error: dbError }),
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await expect(
        act(async () => {
          await result.current.addSection('New Section');
        })
      ).rejects.toThrow();

      expect(toast.error).toHaveBeenCalledWith(`添加失敗: ${dbError.message}`);
      expect(mockFetchData).not.toHaveBeenCalled();
    });
  });

  describe('editSection', () => {
    it('should edit a section successfully', async () => {
      const updateMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn(() => ({
        update: updateMock,
        eq: eqMock,
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        await result.current.editSection('section-1', 'Updated Title');
      });

      expect(updateMock).toHaveBeenCalledWith({ title: 'Updated Title' });
      expect(eqMock).toHaveBeenCalledWith('id', 'section-1');
      expect(toast.success).toHaveBeenCalledWith('章節已更新');
      expect(mockFetchData).toHaveBeenCalled();
    });

    it('should handle edit errors', async () => {
      const dbError = new Error('Update failed');
      mockSupabaseClient.from = jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: dbError }),
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await expect(
        act(async () => {
          await result.current.editSection('section-1', 'Updated Title');
        })
      ).rejects.toThrow();

      expect(toast.error).toHaveBeenCalledWith(`更新失敗: ${dbError.message}`);
    });
  });

  describe('deleteSection', () => {
    it('should delete a section after confirmation', async () => {
      global.confirm = jest.fn(() => true);

      const deleteMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        await result.current.deleteSection('section-1');
      });

      expect(global.confirm).toHaveBeenCalled();
      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', 'section-1');
      expect(toast.success).toHaveBeenCalledWith('章節已刪除');
      expect(mockFetchData).toHaveBeenCalled();
    });

    it('should not delete if user cancels confirmation', async () => {
      global.confirm = jest.fn(() => false);

      const deleteMock = jest.fn();
      mockSupabaseClient.from = jest.fn(() => ({
        delete: deleteMock,
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        await result.current.deleteSection('section-1');
      });

      expect(global.confirm).toHaveBeenCalled();
      expect(deleteMock).not.toHaveBeenCalled();
      expect(mockFetchData).not.toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      global.confirm = jest.fn(() => true);
      const dbError = new Error('Delete failed');
      mockSupabaseClient.from = jest.fn(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: dbError }),
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await expect(
        act(async () => {
          await result.current.deleteSection('section-1');
        })
      ).rejects.toThrow();

      expect(toast.error).toHaveBeenCalledWith(`刪除失敗: ${dbError.message}`);
    });
  });

  // ============ Task Operations Tests ============

  describe('addTask', () => {
    it('should add a new task successfully', async () => {
      const insertMock = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn(() => ({
        insert: insertMock,
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        await result.current.addTask('section-1', 'New Task');
      });

      expect(insertMock).toHaveBeenCalledWith({
        project_id: projectId,
        section_id: 'section-1',
        requirement_text: 'New Task',
        status: 'pending',
      });
      expect(toast.success).toHaveBeenCalledWith('任務已添加');
      expect(mockFetchData).toHaveBeenCalled();
    });

    it('should handle add task errors', async () => {
      const dbError = new Error('Insert failed');
      mockSupabaseClient.from = jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({ error: dbError }),
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await expect(
        act(async () => {
          await result.current.addTask('section-1', 'New Task');
        })
      ).rejects.toThrow();

      expect(toast.error).toHaveBeenCalledWith(`添加失敗: ${dbError.message}`);
    });
  });

  describe('editTask', () => {
    it('should edit a task successfully', async () => {
      const updateMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn(() => ({
        update: updateMock,
        eq: eqMock,
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        await result.current.editTask('task-1', 'Updated Task');
      });

      expect(updateMock).toHaveBeenCalledWith({ requirement_text: 'Updated Task' });
      expect(eqMock).toHaveBeenCalledWith('id', 'task-1');
      expect(toast.success).toHaveBeenCalledWith('任務已更新');
      expect(mockFetchData).toHaveBeenCalled();
    });

    it('should handle edit task errors', async () => {
      const dbError = new Error('Update failed');
      mockSupabaseClient.from = jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: dbError }),
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await expect(
        act(async () => {
          await result.current.editTask('task-1', 'Updated Task');
        })
      ).rejects.toThrow();

      expect(toast.error).toHaveBeenCalledWith(`更新失敗: ${dbError.message}`);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task after confirmation and update local state', async () => {
      global.confirm = jest.fn(() => true);

      const deleteMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        await result.current.deleteTask('task-1');
      });

      expect(global.confirm).toHaveBeenCalled();
      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', 'task-1');
      expect(toast.success).toHaveBeenCalledWith('任務已刪除');
      expect(setSections).toHaveBeenCalled();
    });

    it('should not delete if user cancels confirmation', async () => {
      global.confirm = jest.fn(() => false);

      const deleteMock = jest.fn();
      mockSupabaseClient.from = jest.fn(() => ({
        delete: deleteMock,
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        await result.current.deleteTask('task-1');
      });

      expect(global.confirm).toHaveBeenCalled();
      expect(deleteMock).not.toHaveBeenCalled();
    });

    it('should handle delete task errors', async () => {
      global.confirm = jest.fn(() => true);
      const dbError = new Error('Delete failed');
      mockSupabaseClient.from = jest.fn(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: dbError }),
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await expect(
        act(async () => {
          await result.current.deleteTask('task-1');
        })
      ).rejects.toThrow();

      expect(toast.error).toHaveBeenCalledWith(`刪除失敗: ${dbError.message}`);
    });

    it('should remove task from nested sections', async () => {
      global.confirm = jest.fn(() => true);
      mockSupabaseClient.from = jest.fn(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }));

      const nestedSections: Section[] = [
        {
          id: 'parent',
          title: 'Parent',
          order_index: 1,
          children: [
            {
              id: 'child',
              title: 'Child',
              order_index: 1,
              parent_id: 'parent',
              tasks: [
                {
                  id: 'nested-task',
                  requirement_text: 'Nested Task',
                  status: 'pending',
                  section_id: 'child',
                },
              ],
            },
          ],
        },
      ];

      const { result } = renderHook(() =>
        useProposalOperations(projectId, nestedSections, setSections, mockFetchData)
      );

      await act(async () => {
        await result.current.deleteTask('nested-task');
      });

      expect(setSections).toHaveBeenCalled();
      const updateFn = setSections.mock.calls[0][0];
      const updatedSections = updateFn(nestedSections);
      expect(updatedSections[0].children![0].tasks).toHaveLength(0);
    });
  });

  // ============ Drag and Drop Tests ============

  describe('handleDragEnd', () => {
    it('should handle task drag within same section', async () => {
      const updateMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn(() => ({
        update: updateMock,
        eq: eqMock,
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      const dragEvent = {
        active: {
          id: 'task-1',
          data: {
            current: {
              type: 'task',
              sectionId: 'section-1',
            },
          },
        },
        over: {
          id: 'task-2',
          data: {
            current: {
              type: 'task',
              sectionId: 'section-1',
            },
          },
        },
      };

      await act(async () => {
        await result.current.handleDragEnd(dragEvent);
      });

      expect(setSections).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalled();
    });

    it('should handle task drag to different section', async () => {
      const updateMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn(() => ({
        update: updateMock,
        eq: eqMock,
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      const dragEvent = {
        active: {
          id: 'task-1',
          data: {
            current: {
              type: 'task',
              sectionId: 'section-1',
            },
          },
        },
        over: {
          id: 'section-2',
          data: {
            current: {
              type: 'section',
            },
          },
        },
      };

      await act(async () => {
        await result.current.handleDragEnd(dragEvent);
      });

      expect(setSections).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalled();
    });

    it('should handle drag to empty section', async () => {
      const updateMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn(() => ({
        update: updateMock,
        eq: eqMock,
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      const dragEvent = {
        active: {
          id: 'task-1',
          data: {
            current: {
              type: 'task',
              sectionId: 'section-1',
            },
          },
        },
        over: {
          id: 'empty-indicator',
          data: {
            current: {
              type: 'empty-section',
              sectionId: 'section-2',
            },
          },
        },
      };

      await act(async () => {
        await result.current.handleDragEnd(dragEvent);
      });

      expect(setSections).toHaveBeenCalled();
    });

    it('should rollback on drag update error', async () => {
      const dbError = new Error('Update failed');
      mockSupabaseClient.from = jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: dbError }),
      }));

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      const dragEvent = {
        active: {
          id: 'task-1',
          data: {
            current: {
              type: 'task',
              sectionId: 'section-1',
            },
          },
        },
        over: {
          id: 'task-2',
          data: {
            current: {
              type: 'task',
              sectionId: 'section-1',
            },
          },
        },
      };

      await act(async () => {
        await result.current.handleDragEnd(dragEvent);
      });

      expect(toast.error).toHaveBeenCalledWith('拖拽更新失敗');
      expect(mockFetchData).toHaveBeenCalled(); // Rollback
    });

    it('should ignore drag when no over target', async () => {
      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      const dragEvent = {
        active: {
          id: 'task-1',
          data: {
            current: {
              type: 'task',
              sectionId: 'section-1',
            },
          },
        },
        over: null,
      };

      await act(async () => {
        await result.current.handleDragEnd(dragEvent);
      });

      expect(setSections).not.toHaveBeenCalled();
    });

    it('should ignore drag when active and over are same', async () => {
      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      const dragEvent = {
        active: {
          id: 'task-1',
          data: {
            current: {
              type: 'task',
              sectionId: 'section-1',
            },
          },
        },
        over: {
          id: 'task-1',
          data: {
            current: {
              type: 'task',
              sectionId: 'section-1',
            },
          },
        },
      };

      await act(async () => {
        await result.current.handleDragEnd(dragEvent);
      });

      expect(setSections).not.toHaveBeenCalled();
    });
  });

  // ============ Generation Operations Tests ============

  describe('generateTasks', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should generate tasks successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, taskCount: 5 }),
      });

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        await result.current.generateTasks(
          'section-1',
          ['source-1', 'source-2'],
          'Generate tasks for testing',
          'technical'
        );
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/webhook/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          sectionId: 'section-1',
          sourceIds: ['source-1', 'source-2'],
          userDescription: 'Generate tasks for testing',
          workflowType: 'technical',
        }),
      });
      expect(toast.success).toHaveBeenCalledWith('已生成 5 個任務');
      expect(mockFetchData).toHaveBeenCalled();
    });

    it('should handle generation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Generation failed' }),
      });

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        try {
          await result.current.generateTasks('section-1', ['source-1']);
        } catch (error) {
          // Expected error
        }
      });

      expect(toast.error).toHaveBeenCalled();
    });

    it('should use default workflow type', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, taskCount: 3 }),
      });

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        await result.current.generateTasks('section-1', ['source-1']);
      });

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.workflowType).toBe('technical');
    });
  });

  describe('generateTaskContent', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should generate task content successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, wordCount: 500 }),
      });

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        const res = await result.current.generateTaskContent(
          'task-1',
          'section-1',
          'Section Title',
          'Task Text',
          ['source-1'],
          ['Section 1', 'Section 2']
        );
        expect(res).toEqual({ success: true, wordCount: 500 });
      });

      expect(toast.success).toHaveBeenCalledWith('內容生成成功！(500字)');
    });

    it('should handle content generation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await expect(
        act(async () => {
          await result.current.generateTaskContent(
            'task-1',
            'section-1',
            'Section Title',
            'Task Text',
            ['source-1'],
            []
          );
        })
      ).rejects.toThrow();

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('integrateSection', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should integrate section content successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ integratedContent: 'Integrated content here' }),
      });

      const updateMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn(() => ({
        update: updateMock,
        eq: eqMock,
      }));

      const taskContentsMap = new Map();
      taskContentsMap.set('task-1', { content: 'Task 1 content' });
      taskContentsMap.set('task-2', { content: 'Task 2 content' });

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        await result.current.integrateSection(mockSections[0], taskContentsMap);
      });

      expect(toast.info).toHaveBeenCalledWith('正在整合 2 篇任務內容...');
      expect(updateMock).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('整合成功且已儲存！');
      expect(mockFetchData).toHaveBeenCalled();
    });

    it('should handle section with no tasks', async () => {
      const emptySection: Section = {
        id: 'empty',
        title: 'Empty Section',
        order_index: 1,
        tasks: [],
      };

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        await result.current.integrateSection(emptySection, new Map());
      });

      expect(toast.error).toHaveBeenCalledWith('此章節無任務可供整合');
    });

    it('should handle section with no generated content', async () => {
      const taskContentsMap = new Map();

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        await result.current.integrateSection(mockSections[0], taskContentsMap);
      });

      expect(toast.error).toHaveBeenCalledWith('找不到已生成的任務內容，請先為任務生成內容');
    });

    it('should handle integration API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Integration failed' }),
      });

      const taskContentsMap = new Map();
      taskContentsMap.set('task-1', { content: 'Content' });

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        try {
          await result.current.integrateSection(mockSections[0], taskContentsMap);
        } catch (error) {
          // Expected error
        }
      });

      expect(toast.error).toHaveBeenCalled();
    });

    it('should handle database save errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ integratedContent: 'Content' }),
      });

      const dbError = new Error('Save failed');
      mockSupabaseClient.from = jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: dbError }),
      }));

      const taskContentsMap = new Map();
      taskContentsMap.set('task-1', { content: 'Content' });

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await expect(
        act(async () => {
          await result.current.integrateSection(mockSections[0], taskContentsMap);
        })
      ).rejects.toThrow();
    });
  });

  describe('generateImage', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should generate image successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, imageUrl: 'https://example.com/image.png' }),
      });

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        const res = await result.current.generateImage('task-1', {
          prompt: 'Generate a flowchart',
          style: 'technical',
        });
        expect(res).toEqual({ success: true, imageUrl: 'https://example.com/image.png' });
      });

      expect(toast.success).toHaveBeenCalledWith('圖片已生成');
      expect(mockFetchData).toHaveBeenCalled();
    });

    it('should handle image generation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await expect(
        act(async () => {
          await result.current.generateImage('task-1', { prompt: 'Test' });
        })
      ).rejects.toThrow();

      expect(toast.error).toHaveBeenCalled();
    });
  });

  // ============ Edge Cases ============

  describe('edge cases', () => {
    it('should handle concurrent operations', async () => {
      const { result } = renderHook(() =>
        useProposalOperations(projectId, mockSections, setSections, mockFetchData)
      );

      await act(async () => {
        await Promise.all([
          result.current.addSection('Section A'),
          result.current.addSection('Section B'),
          result.current.addTask('section-1', 'Task A'),
        ]);
      });

      expect(mockFetchData).toHaveBeenCalledTimes(3);
    });

    it('should handle operations with missing sections', async () => {
      const { result } = renderHook(() =>
        useProposalOperations(projectId, [], setSections, mockFetchData)
      );

      const dragEvent = {
        active: {
          id: 'task-1',
          data: {
            current: {
              type: 'task',
              sectionId: 'non-existent',
            },
          },
        },
        over: {
          id: 'task-2',
          data: {
            current: {
              type: 'task',
              sectionId: 'non-existent',
            },
          },
        },
      };

      await act(async () => {
        await result.current.handleDragEnd(dragEvent);
      });

      // Should not crash
      expect(setSections).not.toHaveBeenCalled();
    });
  });
});
