'use client';

import type { UseDialogStateReturn } from '../hooks/useDialogState';

interface ProposalDialogsProps {
  dialogState: UseDialogStateReturn;
  // TODO: 添加其他 props（callbacks 等）
}

/**
 * 所有对话框的容器组件
 */
export function ProposalDialogs({ dialogState }: ProposalDialogsProps) {
  return (
    <>
      {/* TODO: 渲染所有对话框 */}
      {/* - AddSectionDialog */}
      {/* - AddTaskDialog */}
      {/* - AddSubsectionDialog */}
      {/* - GenerateSubsectionDialog */}
      {/* - ContentGenerationDialog */}
      {/* - ImageGenerationDialog */}
      {/* - 冲突对话框 etc. */}
    </>
  );
}
