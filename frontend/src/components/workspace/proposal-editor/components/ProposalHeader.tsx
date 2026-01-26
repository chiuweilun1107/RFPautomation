/**
 * ProposalHeader Component
 *
 * 頂部工具欄組件
 * - 顯示標題
 * - 生成章節按鈕（包含進度指示）
 * - 新增章節按鈕
 * - 生成進度顯示
 */

import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, FolderPlus, FileText, CheckCircle2 } from 'lucide-react';
import type { ProposalHeaderProps } from '../types';

export function ProposalHeader({
  generating,
  onGenerate,
  onAddSection,
  generationProgress,
  totalSections,
  completedSections,
}: ProposalHeaderProps) {
  const hasProgress = generationProgress && generationProgress.total > 0;
  const progressPercentage = hasProgress
    ? (generationProgress.current / generationProgress.total) * 100
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">章節規劃</h2>
          {totalSections !== undefined && totalSections > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium">
                {totalSections} 章節
              </span>
              {completedSections !== undefined && completedSections > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  {completedSections} 已完成
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors"
            onClick={onGenerate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {generating ? '生成中...' : '生成章節'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={onAddSection}
            disabled={generating}
          >
            <FolderPlus className="w-4 h-4" />
            新增章節
          </Button>
        </div>
      </div>

      {/* 生成進度條 */}
      {hasProgress && (
        <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-200">
                {generationProgress.message || '正在生成...'}
              </span>
            </div>
            <span className="text-blue-700 dark:text-blue-300 font-mono text-xs">
              {generationProgress.current} / {generationProgress.total}
            </span>
          </div>
          <div className="w-full bg-blue-100 dark:bg-blue-900/40 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-blue-400 h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
