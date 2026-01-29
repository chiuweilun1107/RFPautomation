'use client';

import { useState, useEffect, useRef } from 'react';
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
  [key: string]: any;
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

  // 摺疊狀態
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Native Dragging State
  const [position, setPosition] = useState({ x: 0, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const nodeRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Ref to store dimensions during drag to avoid reflows
  const dragInfoRef = useRef({
    metrics: { width: 0, height: 0 },
    window: { width: 0, height: 0 }
  });

  // 初始化並設定初始位置
  useEffect(() => {
    setIsMounted(true);
    // 設定初始位置在右上角
    setPosition({ x: window.innerWidth - 520, y: 20 });
  }, []);

  // 處理 Pointer Event 拖曳邏輯
  const handlePointerDown = (e: React.PointerEvent) => {
    // 只有左鍵可以拖曳
    if (e.button !== 0) return;
    e.preventDefault(); // 防止文字選取等預設行為

    // Cache dimensions ONCE when starting to drag
    if (nodeRef.current) {
      dragInfoRef.current = {
        metrics: {
          width: nodeRef.current.offsetWidth,
          height: nodeRef.current.offsetHeight
        },
        window: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    }

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });

    // 關鍵：鎖定 Pointer，防止滑鼠快速移動或進入 iframe 時失去焦點
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    // 使用 ref 中的數值，避免觸發 Reflow
    const { metrics, window: winMetrics } = dragInfoRef.current;

    // 計算新位置
    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;

    // 邊界檢查
    newX = Math.max(-metrics.width + 40, Math.min(newX, winMetrics.width - 40));
    newY = Math.max(0, Math.min(newY, winMetrics.height - 40));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // 忽略可能的錯誤
      }
    }
  };

  // 從資料庫讀取上次選擇的專案和文件
  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await fetch('/api/user/ai-preferences');
        const data = await response.json();

        if (data.selectedProjectId && data.selectedProjectId !== 'null') {
          setSelectedProjectId(data.selectedProjectId);
          localStorage.setItem('ai_selected_project_id', data.selectedProjectId);
        } else {
          localStorage.removeItem('ai_selected_project_id');
          localStorage.removeItem('ai_selected_source_ids');
          setSelectedProjectId(null);
          setSelectedProject(null);
          setSelectedSourceIds([]);
        }

        if (data.selectedProjectId && data.selectedSourceIds && Array.isArray(data.selectedSourceIds)) {
          setSelectedSourceIds(data.selectedSourceIds);
          localStorage.setItem('ai_selected_source_ids', JSON.stringify(data.selectedSourceIds));
        }

        if (data.userId) {
          localStorage.setItem('ai_user_id', data.userId);
        }
      } catch {
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
          } catch {
            // 靜默處理
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
        const response = await fetch('/api/projects/list');
        const result = await response.json();

        if (!response.ok) {
          return;
        }

        setProjects(result.projects || []);

        if (selectedProjectId && result.projects) {
          const project = result.projects.find((p: Project) => p.id === selectedProjectId);
          if (project) {
            setSelectedProject(project);
          }
        }
      } catch {
        // 靜默處理
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
      setSelectedProjectId(null);
      setSelectedProject(null);
      setSelectedSourceIds([]);
      setOpen(false);
      localStorage.removeItem('ai_selected_project_id');
      localStorage.removeItem('ai_selected_source_ids');
      localStorage.removeItem('ai_user_id');
      document.cookie = 'ai_project_id=; path=/; max-age=0';
      document.cookie = 'ai_source_ids=; path=/; max-age=0';

      try {
        await fetch('/api/user/ai-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: null,
            sourceIds: []
          }),
        });
      } catch {
        // 靜默處理
      }

      window.dispatchEvent(new CustomEvent('ai-project-changed', {
        detail: { projectId: null, sourceIds: [] }
      }));

      onProjectChange?.(null);
      return;
    }

    setSelectedProjectId(projectId);
    setSelectedProject(project);
    setOpen(false);

    setIsSourceDialogOpen(true);
  };

  // 確認選擇的文件
  const handleConfirmSources = async (sourceIds: string[]) => {
    setSelectedSourceIds(sourceIds);

    if (selectedProjectId) {
      localStorage.setItem('ai_selected_project_id', selectedProjectId);
      localStorage.setItem('ai_selected_source_ids', JSON.stringify(sourceIds));

      const isSecure = window.location.protocol === 'https:';
      const projectCookie = `ai_project_id=${selectedProjectId}; path=/; max-age=2592000; ${isSecure ? 'Secure; SameSite=None' : 'SameSite=Lax'}`;
      const sourcesCookie = `ai_source_ids=${encodeURIComponent(JSON.stringify(sourceIds))}; path=/; max-age=2592000; ${isSecure ? 'Secure; SameSite=None' : 'SameSite=Lax'}`;

      document.cookie = projectCookie;
      document.cookie = sourcesCookie;
    }

    try {
      await fetch('/api/user/ai-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          sourceIds
        }),
      });
    } catch {
      // 靜默處理
    }

    try {
      window.dispatchEvent(new CustomEvent('ai-project-changed', {
        detail: { projectId: selectedProjectId, sourceIds }
      }));
    } catch {
      // 靜默處理
    }

    onProjectChange?.(selectedProjectId);
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

  // 等待客戶端掛載
  if (!isMounted) {
    return null;
  }

  // 處理收合/展開
  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止拖曳時觸發
    setIsCollapsed(!isCollapsed);
  };

  if (isCollapsed) {
    return (
      <div
        ref={nodeRef}
        // 收合狀態的樣式：紅色方形，帶有 K 字
        className="fixed z-50 cursor-move bg-[#FA4028] border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] flex items-center justify-center w-12 h-12"
        style={{
          left: position.x,
          top: position.y,
          // 確保拖曳時沒有過渡動畫，這樣才會跟手
          transition: isDragging ? 'none' : 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={toggleCollapse} // 點擊展開
        title="點擊展開 AI 專案選擇器"
      >
        <span className="text-white font-black text-2xl font-mono select-none pointer-events-none">K</span>
      </div>
    );
  }

  return (
    <div
      ref={nodeRef}
      className="fixed z-50 bg-white dark:bg-zinc-950 border-2 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)] flex flex-col overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: 'auto',
        maxWidth: '500px',
        // 確保拖曳時沒有過渡動畫
        transition: isDragging ? 'none' : 'none'
      }}
    >
      {/* 紅色拖曳條 - Header / Drag Handle */}
      <div
        className="cursor-move p-2 border-b-2 border-black dark:border-white bg-[#FA4028] text-white flex justify-between items-center shrink-0 select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider font-mono">AI_PROJECT_SELECTOR</span>
        </div>

        {/* 收合按鈕 */}
        <div
          className="cursor-pointer hover:bg-white/20 rounded p-0.5 transition-colors"
          onClick={toggleCollapse}
          onPointerDown={(e) => e.stopPropagation()} // 防止收合時觸發拖曳與 Pointer Capture
          onMouseDown={(e) => e.stopPropagation()} // 防止收合時觸發拖曳
          title="收合"
        >
          <div className="w-3 h-0.5 bg-white"></div>
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
