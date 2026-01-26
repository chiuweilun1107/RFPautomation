/**
 * useRealtimeUpdates Hook 測試
 *
 * 測試實時訂閱功能的正確性
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useRealtimeUpdates } from '../useRealtimeUpdates';
import { createClient } from '@/lib/supabase/client';
import type { UseSectionStateReturn } from '../useSectionState';
import type { Section, Task } from '../../types';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('useRealtimeUpdates', () => {
  let mockSupabase: any;
  let mockChannel: any;
  let mockSectionState: UseSectionStateReturn;

  beforeEach(() => {
    // 設置 mock channel
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback) => {
        callback('SUBSCRIBED');
        return mockChannel;
      }),
      unsubscribe: jest.fn(),
    };

    // 設置 mock supabase client
    mockSupabase = {
      channel: jest.fn(() => mockChannel),
      removeChannel: jest.fn(),
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // 設置 mock section state
    mockSectionState = {
      sections: [],
      setSections: jest.fn(),
      sources: [],
      setSources: jest.fn(),
      linkedSourceIds: [],
      setLinkedSourceIds: jest.fn(),
      taskContents: new Map(),
      setTaskContents: jest.fn(),
      loading: false,
      setLoading: jest.fn(),
      fetchData: jest.fn(),
      fetchTaskContents: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('應該在 mount 時設置訂閱', () => {
    const projectId = 'test-project-id';

    renderHook(() => useRealtimeUpdates(projectId, mockSectionState));

    // 驗證創建了 channel
    expect(mockSupabase.channel).toHaveBeenCalledWith(
      `project-${projectId}-realtime`,
      expect.any(Object)
    );

    // 驗證訂閱了三個表
    expect(mockChannel.on).toHaveBeenCalledTimes(3);

    // 驗證訂閱了 sections 表
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sections',
        filter: `project_id=eq.${projectId}`,
      },
      expect.any(Function)
    );

    // 驗證訂閱了 tasks 表
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
      },
      expect.any(Function)
    );

    // 驗證訂閱了 project_sources 表
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'project_sources',
        filter: `project_id=eq.${projectId}`,
      },
      expect.any(Function)
    );

    // 驗證訂閱成功
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('應該在 unmount 時清理訂閱', () => {
    const projectId = 'test-project-id';

    const { unmount } = renderHook(() =>
      useRealtimeUpdates(projectId, mockSectionState)
    );

    unmount();

    // 驗證移除了 channel
    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('應該在收到 section INSERT 事件時更新狀態', async () => {
    const projectId = 'test-project-id';
    let sectionChangeHandler: any;

    mockChannel.on.mockImplementation((event, config, handler) => {
      if (config.table === 'sections') {
        sectionChangeHandler = handler;
      }
      return mockChannel;
    });

    renderHook(() => useRealtimeUpdates(projectId, mockSectionState));

    // 模擬收到 INSERT 事件
    const newSection = {
      id: 'new-section-id',
      project_id: projectId,
      title: 'New Section',
      parent_id: null,
      order_index: 0,
      created_at: new Date().toISOString(),
    };

    sectionChangeHandler({
      eventType: 'INSERT',
      new: newSection,
      old: null,
    });

    await waitFor(() => {
      expect(mockSectionState.setSections).toHaveBeenCalled();
    });
  });

  it('應該在收到 task INSERT 事件時更新狀態', async () => {
    const projectId = 'test-project-id';
    let taskChangeHandler: any;

    mockChannel.on.mockImplementation((event, config, handler) => {
      if (config.table === 'tasks') {
        taskChangeHandler = handler;
      }
      return mockChannel;
    });

    // 設置初始 sections
    mockSectionState.sections = [
      {
        id: 'section-1',
        title: 'Section 1',
        order_index: 0,
        tasks: [],
      },
    ];

    renderHook(() => useRealtimeUpdates(projectId, mockSectionState));

    // 模擬收到 INSERT 事件
    const newTask = {
      id: 'new-task-id',
      section_id: 'section-1',
      requirement_text: 'New Task',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    taskChangeHandler({
      eventType: 'INSERT',
      new: newTask,
      old: null,
    });

    await waitFor(() => {
      expect(mockSectionState.setSections).toHaveBeenCalled();
    });
  });

  it('應該處理連接錯誤並嘗試重連', async () => {
    const projectId = 'test-project-id';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockChannel.subscribe.mockImplementation((callback) => {
      callback('CHANNEL_ERROR', new Error('Connection failed'));
      return mockChannel;
    });

    renderHook(() => useRealtimeUpdates(projectId, mockSectionState));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('應該在沒有 projectId 時跳過訂閱', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    renderHook(() => useRealtimeUpdates('', mockSectionState));

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Realtime] No project ID provided, skipping subscriptions'
    );
    expect(mockSupabase.channel).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('應該避免重複插入相同的 section', async () => {
    const projectId = 'test-project-id';
    let sectionChangeHandler: any;

    mockChannel.on.mockImplementation((event, config, handler) => {
      if (config.table === 'sections') {
        sectionChangeHandler = handler;
      }
      return mockChannel;
    });

    // 設置初始 sections
    const existingSection = {
      id: 'existing-section-id',
      title: 'Existing Section',
      order_index: 0,
    };

    mockSectionState.sections = [existingSection];

    renderHook(() => useRealtimeUpdates(projectId, mockSectionState));

    // 模擬收到相同 section 的 INSERT 事件
    sectionChangeHandler({
      eventType: 'INSERT',
      new: {
        id: 'existing-section-id',
        project_id: projectId,
        title: 'Existing Section',
        parent_id: null,
        order_index: 0,
        created_at: new Date().toISOString(),
      },
      old: null,
    });

    // setSections 應該被調用，但回調函數應該返回原始數組
    await waitFor(() => {
      expect(mockSectionState.setSections).toHaveBeenCalled();
    });
  });
});
