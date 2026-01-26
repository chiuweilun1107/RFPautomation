/**
 * useRealtimeUpdates Hook 使用示例
 *
 * 展示如何在不同場景下使用實時訂閱功能
 */

import React, { useEffect, useState } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';
import { useSectionState } from './useSectionState';
import type { Section } from '../types';

// ============================================================
// 示例 1: 基本用法
// ============================================================

interface BasicExampleProps {
  projectId: string;
}

export function BasicExample({ projectId }: BasicExampleProps) {
  // 初始化狀態管理
  const sectionState = useSectionState(projectId);

  // 加載初始數據
  useEffect(() => {
    sectionState.fetchData();
  }, [projectId]);

  // 啟用實時訂閱
  useRealtimeUpdates(projectId, sectionState);

  return (
    <div>
      <h2>章節列表</h2>
      {sectionState.loading && <p>加載中...</p>}
      <ul>
        {sectionState.sections.map((section) => (
          <li key={section.id}>{section.title}</li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// 示例 2: 與現有 useProposalState 整合
// ============================================================

import { useProposalState } from './useProposalState';
import type { UseSectionStateReturn } from './useSectionState';

interface IntegrationExampleProps {
  projectId: string;
}

export function IntegrationExample({ projectId }: IntegrationExampleProps) {
  const state = useProposalState();

  // 創建適配器，將 useProposalState 的狀態映射到 UseSectionStateReturn
  const sectionStateAdapter: UseSectionStateReturn = {
    sections: state.sections,
    setSections: state.setSections,
    sources: state.sources,
    setSources: state.setSources,
    linkedSourceIds: state.linkedSourceIds,
    setLinkedSourceIds: state.setLinkedSourceIds,
    taskContents: state.taskContents,
    setTaskContents: state.setTaskContents,
    loading: state.loading,
    setLoading: state.setLoading,

    // 實現數據獲取方法
    fetchData: async () => {
      // 在這裡實現數據獲取邏輯
      // 例如：從 Supabase 獲取 sections、sources 等
      console.log('Fetching data for project:', projectId);
    },

    fetchTaskContents: async () => {
      // 在這裡實現任務內容獲取邏輯
      console.log('Fetching task contents');
    },
  };

  // 啟用實時訂閱
  useRealtimeUpdates(projectId, sectionStateAdapter);

  return (
    <div>
      <h2>提案編輯器</h2>
      <SectionTree sections={state.sections} />
    </div>
  );
}

// ============================================================
// 示例 3: 帶有連接狀態指示器
// ============================================================

interface ConnectionStatusExampleProps {
  projectId: string;
}

export function ConnectionStatusExample({ projectId }: ConnectionStatusExampleProps) {
  const sectionState = useSectionState(projectId);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    sectionState.fetchData();
  }, [projectId]);

  // 監聽控制台日誌（生產環境中應該使用更好的方式）
  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      if (args[0]?.includes?.('[Realtime] Successfully subscribed')) {
        setIsConnected(true);
        setReconnectAttempts(0);
      } else if (args[0]?.includes?.('[Realtime] Attempting to reconnect')) {
        setIsConnected(false);
        const match = args[0].match(/\((\d+)\/\d+\)/);
        if (match) {
          setReconnectAttempts(parseInt(match[1]));
        }
      }
      originalConsoleLog(...args);
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  useRealtimeUpdates(projectId, sectionState);

  return (
    <div>
      <ConnectionIndicator
        isConnected={isConnected}
        reconnectAttempts={reconnectAttempts}
      />
      <h2>章節列表</h2>
      <ul>
        {sectionState.sections.map((section) => (
          <li key={section.id}>{section.title}</li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// 示例 4: 多項目同時訂閱
// ============================================================

interface MultiProjectExampleProps {
  projectIds: string[];
}

export function MultiProjectExample({ projectIds }: MultiProjectExampleProps) {
  return (
    <div>
      <h2>多項目監控面板</h2>
      {projectIds.map((projectId) => (
        <ProjectMonitor key={projectId} projectId={projectId} />
      ))}
    </div>
  );
}

function ProjectMonitor({ projectId }: { projectId: string }) {
  const sectionState = useSectionState(projectId);

  useEffect(() => {
    sectionState.fetchData();
  }, [projectId]);

  useRealtimeUpdates(projectId, sectionState);

  return (
    <div className="border p-4 m-2">
      <h3>項目: {projectId}</h3>
      <p>章節數量: {sectionState.sections.length}</p>
      <p>來源數量: {sectionState.sources.length}</p>
    </div>
  );
}

// ============================================================
// 示例 5: 自定義事件處理
// ============================================================

interface CustomEventHandlingProps {
  projectId: string;
  onSectionAdded?: (section: Section) => void;
  onTaskUpdated?: (taskId: string) => void;
}

export function CustomEventHandlingExample({
  projectId,
  onSectionAdded,
  onTaskUpdated,
}: CustomEventHandlingProps) {
  const sectionState = useSectionState(projectId);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    sectionState.fetchData();
  }, [projectId]);

  // 監控 sections 變更
  useEffect(() => {
    const prevSectionIds = new Set(
      sectionState.sections.map((s) => s.id)
    );

    // 檢測新增的章節
    sectionState.sections.forEach((section) => {
      if (!prevSectionIds.has(section.id)) {
        setLastUpdate(`新章節: ${section.title}`);
        onSectionAdded?.(section);
      }
    });
  }, [sectionState.sections, onSectionAdded]);

  useRealtimeUpdates(projectId, sectionState);

  return (
    <div>
      <h2>實時更新監控</h2>
      {lastUpdate && (
        <div className="bg-blue-100 p-2 mb-4">
          最新更新: {lastUpdate}
        </div>
      )}
      <SectionTree sections={sectionState.sections} />
    </div>
  );
}

// ============================================================
// 輔助組件
// ============================================================

interface ConnectionIndicatorProps {
  isConnected: boolean;
  reconnectAttempts: number;
}

function ConnectionIndicator({
  isConnected,
  reconnectAttempts,
}: ConnectionIndicatorProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-100">
      <div
        className={`w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span>
        {isConnected
          ? '已連接'
          : reconnectAttempts > 0
          ? `重連中 (${reconnectAttempts}/5)...`
          : '未連接'}
      </span>
    </div>
  );
}

interface SectionTreeProps {
  sections: Section[];
}

function SectionTree({ sections }: SectionTreeProps) {
  const renderSection = (section: Section, depth: number = 0) => (
    <div key={section.id} style={{ marginLeft: `${depth * 20}px` }}>
      <div className="flex items-center gap-2 p-2 border-b">
        <span className="font-medium">{section.title}</span>
        {section.tasks && (
          <span className="text-sm text-gray-500">
            ({section.tasks.length} 任務)
          </span>
        )}
      </div>
      {section.children?.map((child) => renderSection(child, depth + 1))}
    </div>
  );

  return (
    <div className="border rounded">
      {sections.length === 0 ? (
        <p className="p-4 text-gray-500">暫無章節</p>
      ) : (
        sections.map((section) => renderSection(section))
      )}
    </div>
  );
}

// ============================================================
// 使用建議
// ============================================================

/*
建議的使用方式：

1. 基本場景：使用示例 1
   - 簡單的實時數據展示
   - 不需要複雜的狀態管理

2. 與現有代碼整合：使用示例 2
   - 已經在使用 useProposalState
   - 需要添加實時訂閱功能

3. 需要連接狀態反饋：使用示例 3
   - 用戶需要知道實時連接狀態
   - 處理網絡不穩定情況

4. 多項目管理：使用示例 4
   - 管理員面板
   - 多項目監控需求

5. 自定義事件處理：使用示例 5
   - 需要在特定事件發生時執行自定義邏輯
   - 集成第三方通知系統

注意事項：

- ✅ 始終在組件樹的較高層級調用 useRealtimeUpdates
- ✅ 確保在啟用訂閱前已加載初始數據
- ✅ 監控連接狀態並提供用戶反饋
- ❌ 不要在列表項或循環中使用此 hook
- ❌ 不要頻繁切換 projectId
- ❌ 不要忘記處理錯誤情況

性能優化：

1. 使用 React.memo 避免不必要的重新渲染
2. 使用虛擬滾動處理大量數據
3. 實現防抖/節流處理高頻更新
4. 考慮使用 Web Worker 處理大量數據轉換

調試技巧：

1. 檢查瀏覽器控制台的 [Realtime] 日誌
2. 使用 React DevTools 檢查狀態變更
3. 使用 Supabase Dashboard 查看實時連接
4. 在開發環境啟用詳細日誌記錄
*/
