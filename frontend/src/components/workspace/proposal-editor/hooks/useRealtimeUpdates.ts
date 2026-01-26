/**
 * useRealtimeUpdates Hook
 *
 * Manages Supabase realtime subscriptions for sections, tasks, and sources
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '../../../../lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { UseSectionStateReturn } from './useSectionState';
import type { Section, Task, Source } from '../types';

// 數據庫 payload 類型
interface DbSection {
  id: string;
  project_id: string;
  parent_id: string | null;
  title?: string;
  content?: string;
  order_index: number;
  citation_source_id?: string | null;
  citation_page?: number | null;
  citation_quote?: string | null;
  last_integrated_at?: string | null;
  created_at: string;
}

interface DbTask {
  id: string;
  section_id: string;
  requirement_text: string;
  title?: string;
  status: string;
  assigned_to?: string;
  citation_source_id?: string | null;
  citation_page?: number | null;
  citation_quote?: string | null;
  order_index?: number;
  created_at: string;
  updated_at: string;
}

interface DbProjectSource {
  project_id: string;
  source_id: string;
  created_at: string;
}

/**
 * 實時訂閱 Hook
 *
 * 負責訂閱 Supabase 實時變更並自動更新本地狀態
 */
export function useRealtimeUpdates(
  projectId: string,
  sectionState: UseSectionStateReturn
) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;

  // 將 DbSection 轉換為 Section
  const convertDbSectionToSection = useCallback((dbSection: DbSection): Section => {
    return {
      id: dbSection.id,
      title: dbSection.title || '',
      order_index: dbSection.order_index,
      parent_id: dbSection.parent_id,
      content: dbSection.content,
      citation_source_id: dbSection.citation_source_id,
      citation_page: dbSection.citation_page,
      citation_quote: dbSection.citation_quote,
      last_integrated_at: dbSection.last_integrated_at,
    };
  }, []);

  // 將 DbTask 轉換為 Task
  const convertDbTaskToTask = useCallback((dbTask: DbTask): Task => {
    return {
      id: dbTask.id,
      section_id: dbTask.section_id,
      requirement_text: dbTask.requirement_text,
      title: dbTask.title,
      status: dbTask.status,
      assignee: dbTask.assigned_to,
      citation_source_id: dbTask.citation_source_id,
      citation_page: dbTask.citation_page,
      citation_quote: dbTask.citation_quote,
      order_index: dbTask.order_index,
    };
  }, []);

  // 處理 sections 表變更
  const handleSectionChange = useCallback(
    (payload: RealtimePostgresChangesPayload<DbSection>) => {
      sectionState.setSections((prevSections) => {
        switch (payload.eventType) {
          case 'INSERT': {
            if (!payload.new) return prevSections;
            const newSection = convertDbSectionToSection(payload.new);

            // 避免重複插入
            if (prevSections.some((s) => s.id === newSection.id)) {
              return prevSections;
            }

            return [...prevSections, newSection];
          }

          case 'UPDATE': {
            if (!payload.new) return prevSections;
            const updatedSection = convertDbSectionToSection(payload.new);

            return prevSections.map((section) =>
              section.id === updatedSection.id
                ? { ...section, ...updatedSection }
                : section
            );
          }

          case 'DELETE': {
            if (!payload.old) return prevSections;

            return prevSections.filter((section) => section.id !== payload.old.id);
          }

          default:
            return prevSections;
        }
      });
    },
    [sectionState, convertDbSectionToSection]
  );

  // 處理 tasks 表變更
  const handleTaskChange = useCallback(
    (payload: RealtimePostgresChangesPayload<DbTask>) => {
      sectionState.setSections((prevSections) => {
        switch (payload.eventType) {
          case 'INSERT': {
            if (!payload.new) return prevSections;
            const newTask = convertDbTaskToTask(payload.new);

            return prevSections.map((section) => {
              if (section.id === newTask.section_id) {
                const existingTasks = section.tasks || [];

                // 避免重複插入
                if (existingTasks.some((t) => t.id === newTask.id)) {
                  return section;
                }

                return {
                  ...section,
                  tasks: [...existingTasks, newTask],
                };
              }
              return section;
            });
          }

          case 'UPDATE': {
            if (!payload.new) return prevSections;
            const updatedTask = convertDbTaskToTask(payload.new);

            return prevSections.map((section) => {
              if (!section.tasks) return section;

              const hasTask = section.tasks.some((t) => t.id === updatedTask.id);
              if (!hasTask) return section;

              return {
                ...section,
                tasks: section.tasks.map((task) =>
                  task.id === updatedTask.id ? { ...task, ...updatedTask } : task
                ),
              };
            });
          }

          case 'DELETE': {
            if (!payload.old) return prevSections;

            return prevSections.map((section) => {
              if (!section.tasks) return section;

              return {
                ...section,
                tasks: section.tasks.filter((task) => task.id !== payload.old.id),
              };
            });
          }

          default:
            return prevSections;
        }
      });
    },
    [sectionState, convertDbTaskToTask]
  );

  // 處理 project_sources 表變更
  const handleProjectSourceChange = useCallback(
    (payload: RealtimePostgresChangesPayload<DbProjectSource>) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const newSourceId = payload.new.source_id;

        // 更新 linkedSourceIds
        sectionState.setLinkedSourceIds((prev) => {
          if (prev.includes(newSourceId)) {
            return prev;
          }
          return [...prev, newSourceId];
        });

        // 獲取完整的 source 資料
        supabase
          .from('sources')
          .select('*')
          .eq('id', newSourceId)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('[Realtime] Error fetching source:', error);
              return;
            }

            if (data) {
              sectionState.setSources((prev) => {
                if (prev.some((s) => s.id === data.id)) {
                  return prev;
                }
                return [...prev, data as Source];
              });
            }
          });
      } else if (payload.eventType === 'DELETE' && payload.old) {
        const deletedSourceId = payload.old.source_id;

        sectionState.setLinkedSourceIds((prev) =>
          prev.filter((id) => id !== deletedSourceId)
        );

        sectionState.setSources((prev) =>
          prev.filter((source) => source.id !== deletedSourceId)
        );
      }
    },
    [sectionState, supabase]
  );

  // 處理連接錯誤和重連
  const handleConnectionError = useCallback((error: Error) => {
    console.error('[Realtime] Connection error:', error);

    if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttemptsRef.current += 1;

      reconnectTimeoutRef.current = setTimeout(() => {
        // 清理舊連接
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }

        // 重新訂閱
        setupSubscriptions();
      }, RECONNECT_DELAY);
    } else {
      console.error('[Realtime] Max reconnection attempts reached. Please refresh the page.');
    }
  }, []);

  // 設置訂閱
  const setupSubscriptions = useCallback(() => {
    try {
      // 創建頻道
      const channel = supabase.channel(`project-${projectId}-realtime`, {
        config: {
          broadcast: { self: false },
          presence: { key: '' },
        },
      });

      // 訂閱 sections 表變更
      channel.on<DbSection>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sections',
          filter: `project_id=eq.${projectId}`,
        },
        handleSectionChange
      );

      // 訂閱 tasks 表變更
      channel.on<DbTask>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        handleTaskChange
      );

      // 訂閱 project_sources 表變更
      channel.on<DbProjectSource>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_sources',
          filter: `project_id=eq.${projectId}`,
        },
        handleProjectSourceChange
      );

      // 訂閱頻道
      channel.subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
          reconnectAttemptsRef.current = 0; // 重置重連計數
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error:', error);
          if (error) handleConnectionError(error as Error);
        } else if (status === 'TIMED_OUT') {
          console.error('[Realtime] Connection timed out');
          handleConnectionError(new Error('Connection timed out'));
        }
      });

      channelRef.current = channel;
    } catch (error) {
      console.error('[Realtime] Error setting up subscriptions:', error);
      handleConnectionError(error as Error);
    }
  }, [
    projectId,
    supabase,
    handleSectionChange,
    handleTaskChange,
    handleProjectSourceChange,
    handleConnectionError,
  ]);

  // 主要 effect - 設置和清理訂閱
  useEffect(() => {
    if (!projectId) {
      console.warn('[Realtime] No project ID provided, skipping subscriptions');
      return;
    }

    setupSubscriptions();

    // 清理函數
    return () => {
      // 清理重連 timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // 取消訂閱並移除頻道
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // 重置重連計數
      reconnectAttemptsRef.current = 0;
    };
  }, [projectId, setupSubscriptions, supabase]);
}
