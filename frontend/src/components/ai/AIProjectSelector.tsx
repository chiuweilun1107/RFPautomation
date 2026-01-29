'use client';

import { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { FolderOpen, Check, X, FileText } from 'lucide-react';
import { SourceSelectionDialog } from '@/components/workspace/dialogs/SourceSelectionDialog';

interface Project {
  id: string;
  [key: string]: any; // 允許任意欄位，自動適應
}

interface AIProjectSelectorProps {
  onProjectChange?: (projectId: string | null) => void;
}

// 智能查找欄位值（自動適應不同的欄位名稱）
function getProjectField(project: Project, fieldType: 'name' | 'agency' | 'deadline'): string | undefined {
  if (!project) return undefined;

  const fieldMaps = {
    name: ['name', 'title', 'project_name', 'tender_name', 'tender_title'],
    agency: ['agency_entity', 'agency', 'agency_name', 'organization'],
    deadline: ['deadline_sequence', 'deadline', 'deadline_date', 'due_date', 'end_date']
  };

  const possibleFields = fieldMaps[fieldType];

  for (const field of possibleFields) {
    if (project[field]) {
      return project[field];
    }
  }

  return undefined;
}

/**
 * AI 專案選擇器
 *
 * 浮動在編輯器右上角，讓用戶選擇 AI 要參考的專案
 */
export function AIProjectSelector({ onProjectChange }: AIProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);

  // Draggable 狀態
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [defaultPos, setDefaultPos] = useState({ x: 0, y: 20 });

  // 從資料庫讀取上次選擇的專案和文件
  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await fetch('/api/user/ai-preferences');
        const data = await response.json();

        if (data.selectedProjectId && data.selectedProjectId !== 'null') {
          setSelectedProjectId(data.selectedProjectId);
          console.log('[AI Project Selector] Loaded project from database:', data.selectedProjectId);

          // 同步到 localStorage（供 OnlyOffice 配置腳本使用）
          localStorage.setItem('ai_selected_project_id', data.selectedProjectId);
        } else {
          // 如果資料庫中沒有專案，確保 localStorage 也是清空的
          console.log('[AI Project Selector] No project in database, clearing localStorage');
          localStorage.removeItem('ai_selected_project_id');
          localStorage.removeItem('ai_selected_source_ids');
          setSelectedProjectId(null);
          setSelectedProject(null);
          setSelectedSourceIds([]);
        }

        if (data.selectedProjectId && data.selectedSourceIds && Array.isArray(data.selectedSourceIds)) {
          setSelectedSourceIds(data.selectedSourceIds);
          console.log('[AI Project Selector] Loaded sources from database:', data.selectedSourceIds.length);

          // 同步到 localStorage
          localStorage.setItem('ai_selected_source_ids', JSON.stringify(data.selectedSourceIds));
        }

        // **關鍵**：保存 user_id 到 localStorage，供 OnlyOffice AI 配置使用
        if (data.userId) {
          localStorage.setItem('ai_user_id', data.userId);
          console.log('[AI Project Selector] Saved user ID for OnlyOffice AI:', data.userId);
        }
      } catch (error) {
        console.warn('[AI Project Selector] Failed to load preferences from database:', error);

        // 降級到 localStorage
        const savedProjectId = localStorage.getItem('ai_selected_project_id');
        if (savedProjectId && savedProjectId !== 'null') {
          setSelectedProjectId(savedProjectId);
        }

        const savedSourceIds = localStorage.getItem('ai_selected_source_ids');
        if (savedSourceIds) {
          try {
            const sourceIds = JSON.parse(savedSourceIds);
            if (Array.isArray(sourceIds)) {
              setSelectedSourceIds(sourceIds);
            }
          } catch (e) {
            console.warn('[AI Project Selector] Failed to parse saved source IDs:', e);
          }
        }
      }
    }

    loadPreferences();
  }, []);

  // 獲取專案列表
  useEffect(() => {
    async function fetchProjects() {
      try {
        console.log('[AI Project Selector] Fetching projects...');

        // 使用伺服器端 API 獲取專案（繞過 RLS）
        const response = await fetch('/api/projects/list');
        const result = await response.json();

        if (!response.ok) {
          console.error('[AI Project Selector] API error:', result.error);
          return;
        }

        console.log('[AI Project Selector] Fetched projects:', result.projects?.length || 0);
        setProjects(result.projects || []);

        // 如果有選中的專案，找出完整資訊
        if (selectedProjectId && result.projects) {
          const project = result.projects.find((p: Project) => p.id === selectedProjectId);
          if (project) {
            setSelectedProject(project);
            console.log('[AI Project Selector] Restored selected project:', project.name);
          }
        }
      } catch (error) {
        console.error('[AI Project Selector] Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [selectedProjectId]);

  // 選擇專案
  const handleSelectProject = async (project: Project | null) => {
    const projectId = project?.id || null;

    if (!projectId) {
      // 如果取消選擇專案，清除所有設置
      setSelectedProjectId(null);
      setSelectedProject(null);
      setSelectedSourceIds([]);
      setOpen(false);
      localStorage.removeItem('ai_selected_project_id');
      localStorage.removeItem('ai_selected_source_ids');
      localStorage.removeItem('ai_user_id');
      document.cookie = 'ai_project_id=; path=/; max-age=0';
      document.cookie = 'ai_source_ids=; path=/; max-age=0';

      // **關鍵**：通知後端清除資料庫中的偏好設置
      try {
        await fetch('/api/user/ai-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: null,
            sourceIds: []
          }),
        });
        console.log('[AI Project Selector] ✅ 已清除資料庫中的偏好設置');
      } catch (error) {
        console.warn('[AI Project Selector] 清除偏好設置失敗:', error);
      }

      // 觸發重新配置
      window.dispatchEvent(new CustomEvent('ai-project-changed', {
        detail: { projectId: null, sourceIds: [] }
      }));

      onProjectChange?.(null);
      console.log('[AI Project Selector] 已清除所有專案選擇');
      return;
    }

    setSelectedProjectId(projectId);
    setSelectedProject(project);
    setOpen(false);

    console.log('[AI Project Selector] Selected project:', projectId, project ? getProjectField(project, 'name') : 'null');

    // 打開文件選擇對話框
    setIsSourceDialogOpen(true);
  };

  // 確認選擇的文件
  const handleConfirmSources = async (sourceIds: string[]) => {
    console.log('[AI Project Selector] Selected sources:', sourceIds.length > 0 ? sourceIds : '無（僅使用專案基本資訊）');

    setSelectedSourceIds(sourceIds);

    // 儲存到 localStorage 和 cookie
    if (selectedProjectId) {
      localStorage.setItem('ai_selected_project_id', selectedProjectId);
      localStorage.setItem('ai_selected_source_ids', JSON.stringify(sourceIds));

      // 設置 cookie（支援跨域傳遞）
      const isSecure = window.location.protocol === 'https:';
      const projectCookie = `ai_project_id=${selectedProjectId}; path=/; max-age=2592000; ${isSecure ? 'Secure; SameSite=None' : 'SameSite=Lax'}`;
      const sourcesCookie = `ai_source_ids=${encodeURIComponent(JSON.stringify(sourceIds))}; path=/; max-age=2592000; ${isSecure ? 'Secure; SameSite=None' : 'SameSite=Lax'}`;

      document.cookie = projectCookie;
      document.cookie = sourcesCookie;

      console.log('[AI Project Selector] Cookies set');
    }

    // 通知後端（儲存用戶偏好）
    try {
      await fetch('/api/user/ai-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          sourceIds
        }),
      });
    } catch (error) {
      console.warn('[AI Project Selector] Failed to save preference:', error);
    }

    // 觸發 OnlyOffice AI 重新配置
    try {
      window.dispatchEvent(new CustomEvent('ai-project-changed', {
        detail: { projectId: selectedProjectId, sourceIds }
      }));
      console.log('[AI Project Selector] 已觸發 AI 重新配置事件');
    } catch (error) {
      console.warn('[AI Project Selector] 無法觸發重新配置:', error);
    }

    // 通知父組件
    onProjectChange?.(selectedProjectId);

    // 調試：驗證設置已保存
    setTimeout(() => {
      const savedProjectId = localStorage.getItem('ai_selected_project_id');
      const savedSourceIds = localStorage.getItem('ai_selected_source_ids');
      console.log('[AI Project Selector] ✅ 驗證設置已保存:');
      console.log('  - Project ID:', savedProjectId);
      console.log('  - Source IDs:', savedSourceIds);
    }, 100);
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('zh-TW');
    } catch {
      return dateString;
    }
  };

  // 初始化客戶端掛載狀態
  useEffect(() => {
    setIsMounted(true);
    // 設置初始位置（右上角）
    setDefaultPos({ x: window.innerWidth - 420, y: 20 });
    console.log('[AI Project Selector] Component mounted, window width:', window.innerWidth, 'defaultPos:', { x: window.innerWidth - 420, y: 20 });
  }, []);

  // 等待客戶端掛載
  if (!isMounted) {
    return null;
  }

  console.log('[AI Project Selector] Rendering at position:', defaultPos);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <Draggable
        nodeRef={nodeRef}
        handle=".drag-handle"
        bounds="parent"
        defaultPosition={defaultPos}
      >
        <div
          ref={nodeRef}
          className="pointer-events-auto bg-white dark:bg-zinc-950 border-2 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)] flex flex-col overflow-hidden"
          style={{
            position: 'absolute',
            width: 'auto',
            maxWidth: '500px'
          }}
        >
          {/* 紅色拖曳條 - Header / Drag Handle */}
          <div className="drag-handle cursor-move p-2 border-b-2 border-black dark:border-white bg-[#FA4028] text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider font-mono">AI_PROJECT_SELECTOR</span>
            </div>
          </div>

          {/* 內容區域 */}
          <div className="flex gap-2 items-center p-3 bg-white dark:bg-zinc-950">
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={selectedProject ? "default" : "outline"}
                  size="sm"
                  className="gap-2 rounded-none border-black dark:border-white hover:bg-[#FA4028] hover:text-white hover:border-[#FA4028]"
                >
                  <FolderOpen className="w-4 h-4" />
                  {selectedProject ? (
                    <span className="max-w-[200px] truncate font-bold text-xs uppercase">
                      {getProjectField(selectedProject, 'name') || '未命名專案'}
                    </span>
                  ) : (
                    <span className="font-bold text-xs uppercase">AI 參考專案</span>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-[350px] max-h-[500px] overflow-y-auto rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] font-mono">
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase font-bold">
                  選擇 AI 要參考的專案資料
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-black/10 dark:bg-white/10" />

                {loading ? (
                  <div className="py-6 text-center text-sm text-muted-foreground uppercase font-bold">
                    載入專案列表...
                  </div>
                ) : projects.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground uppercase font-bold">
                    尚無專案
                  </div>
                ) : (
                  <>
                    {projects.map((project) => (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => handleSelectProject(project)}
                        className="flex flex-col items-start gap-1 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900"
                      >
                        <div className="flex items-start justify-between w-full">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate uppercase">
                              {getProjectField(project, 'name') || '未命名專案'}
                            </div>
                            {getProjectField(project, 'agency') && (
                              <div className="text-xs text-muted-foreground truncate">
                                {getProjectField(project, 'agency')}
                              </div>
                            )}
                            {getProjectField(project, 'deadline') && (
                              <div className="text-xs text-muted-foreground mt-1">
                                📅 {formatDate(getProjectField(project, 'deadline'))}
                              </div>
                            )}
                          </div>
                          {selectedProjectId === project.id && (
                            <Check className="w-4 h-4 text-[#FA4028] ml-2 flex-shrink-0" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}

                    <DropdownMenuSeparator className="bg-black/10 dark:bg-white/10" />

                    <DropdownMenuItem
                      onClick={() => handleSelectProject(null)}
                      className="flex items-center justify-between gap-2 cursor-pointer text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">不使用專案資料</span>
                      </div>
                      {!selectedProjectId && (
                        <Check className="w-4 h-4 text-[#FA4028]" />
                      )}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 顯示選中的文件數量或提示選擇文件 */}
            {selectedProject && (
              <Button
                variant={selectedSourceIds.length > 0 ? "default" : "outline"}
                size="sm"
                className="gap-2 rounded-none border-black dark:border-white hover:bg-[#FA4028] hover:text-white hover:border-[#FA4028]"
                onClick={() => setIsSourceDialogOpen(true)}
              >
                <FileText className="w-4 h-4" />
                <span className="font-bold text-xs uppercase">
                  {selectedSourceIds.length > 0
                    ? `${selectedSourceIds.length} 份文件`
                    : '選擇文件'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </Draggable>

      {/* 文件選擇對話框 */}
      {selectedProjectId && (
        <SourceSelectionDialog
          open={isSourceDialogOpen}
          onOpenChange={setIsSourceDialogOpen}
          projectId={selectedProjectId}
          onConfirm={handleConfirmSources}
          title="選擇 AI 參考文件"
          description="選擇要讓 AI 參考的標案文件（可不選，僅使用專案基本資訊）"
        />
      )}
    </div>
  );
}
