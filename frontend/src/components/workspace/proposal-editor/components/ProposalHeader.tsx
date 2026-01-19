/**
 * ProposalHeader Component
 *
 * Renders the top toolbar with "生成章節" and "新增章節" buttons
 */

import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, FolderPlus } from 'lucide-react';
import type { ProposalHeaderProps } from '../types';

export function ProposalHeader({
  generating,
  onGenerate,
  onAddSection,
}: ProposalHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">章節規劃</h2>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
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
          className="gap-1.5"
          onClick={onAddSection}
        >
          <FolderPlus className="w-4 h-4" />
          新增章節
        </Button>
      </div>
    </div>
  );
}
