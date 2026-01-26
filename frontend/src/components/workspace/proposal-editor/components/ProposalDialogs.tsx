'use client';

import { AddSectionDialog } from '@/components/workspace/dialogs/AddSectionDialog';
import { AddTaskDialog } from '@/components/workspace/dialogs/AddTaskDialog';
import { AddSubsectionDialog } from '@/components/workspace/dialogs/AddSubsectionDialog';
import { GenerateSubsectionDialog } from '@/components/workspace/dialogs/GenerateSubsectionDialog';
import { ContentGenerationDialog } from '@/components/workspace/dialogs/ContentGenerationDialog';
import { ImageGenerationDialog } from '@/components/workspace/dialogs/ImageGenerationDialog';
import { ConflictConfirmationDialog } from '@/components/ui/ConflictConfirmationDialog';
import type { Section, Source, Task } from '../types';

interface ProposalDialogsProps {
  // Dialog 狀態
  isAddSectionOpen: boolean;
  isAddTaskOpen: boolean;
  isAddSubsectionOpen: boolean;
  isGenerateSubsectionOpen: boolean;
  isContentGenerationDialogOpen: boolean;
  imageGenDialogOpen: boolean;
  isConflictDialogOpen: boolean;
  isSubsectionConflictDialogOpen: boolean;
  isContentConflictDialogOpen: boolean;

  // Dialog 控制
  setIsAddSectionOpen: (open: boolean) => void;
  setIsAddTaskOpen: (open: boolean) => void;
  setIsAddSubsectionOpen: (open: boolean) => void;
  setIsGenerateSubsectionOpen: (open: boolean) => void;
  setIsContentGenerationDialogOpen: (open: boolean) => void;
  setImageGenDialogOpen: (open: boolean) => void;
  setIsConflictDialogOpen: (open: boolean) => void;
  setIsSubsectionConflictDialogOpen: (open: boolean) => void;
  setIsContentConflictDialogOpen: (open: boolean) => void;

  // 數據
  sources: Source[];
  dialogInputValue: string;
  setDialogInputValue: (value: string) => void;
  subsectionInputValue: string;
  setSubsectionInputValue: (value: string) => void;

  // 上下文
  targetSection: Section | null;
  selectedTaskForImage: Task | null;
  contentGenerationTarget: { task: Task; section: Section } | null;
  taskConflictContext: {
    task: Task;
    section: Section;
    existingContent: string;
    newContent: string;
  } | null;
  pendingSubsectionArgs: {
    sectionId: string;
    title: string;
    sourceIds: string[];
  } | null;
  pendingContentGeneration: {
    task: Task;
    section: Section;
    content: string;
  } | null;

  // 選擇狀態
  selectedSourceIds: string[];
  setSelectedSourceIds: (ids: string[]) => void;
  contentGenerationSourceIds: string[];
  setContentGenerationSourceIds: (ids: string[]) => void;
  subsectionSourceIds: string[];
  setSubsectionSourceIds: (ids: string[]) => void;
  showSourceSelector: boolean;
  setShowSourceSelector: (show: boolean) => void;

  // 操作
  onAddSection: () => void;
  onAddTask: () => void;
  onUpdateTask: () => void;
  onAddSubsection: () => void;
  onGenerateTechnical: () => void;
  onGenerateManagement: () => void;
  onGenerateTaskContent: () => void;
  onGenerateSubsections: () => void;
  onGenerateImage: (options: {
    prompt?: string;
    style?: string;
    size?: string;
    [key: string]: unknown;
  }) => Promise<void>;
  onAddSource: () => void;
  onSwitchToAIGeneration: () => void;

  // 衝突處理
  onConflictAppend: () => void;
  onConflictReplace: () => void;
  onConflictCancel: () => void;
  onSubsectionConflictAppend: () => void;
  onSubsectionConflictReplace: () => void;
  onContentConflictAppend: () => void;
  onContentConflictReplace: () => void;

  // 狀態
  generating: boolean;
  editingTask: Task | null;
  editingSection: Section | null;
  projectImages?: Array<{ id: string; url: string }>;
}

/**
 * 所有對話框的容器組件
 * 統一管理所有對話框的渲染和狀態
 */
export function ProposalDialogs({
  // Dialog 狀態
  isAddSectionOpen,
  isAddTaskOpen,
  isAddSubsectionOpen,
  isGenerateSubsectionOpen,
  isContentGenerationDialogOpen,
  imageGenDialogOpen,
  isConflictDialogOpen,
  isSubsectionConflictDialogOpen,
  isContentConflictDialogOpen,

  // Dialog 控制
  setIsAddSectionOpen,
  setIsAddTaskOpen,
  setIsAddSubsectionOpen,
  setIsGenerateSubsectionOpen,
  setIsContentGenerationDialogOpen,
  setImageGenDialogOpen,
  setIsConflictDialogOpen,
  setIsSubsectionConflictDialogOpen,
  setIsContentConflictDialogOpen,

  // 數據
  sources,
  dialogInputValue,
  setDialogInputValue,
  subsectionInputValue,
  setSubsectionInputValue,

  // 上下文
  targetSection,
  selectedTaskForImage,
  contentGenerationTarget,
  taskConflictContext,
  pendingSubsectionArgs,
  pendingContentGeneration,

  // 選擇狀態
  selectedSourceIds,
  setSelectedSourceIds,
  contentGenerationSourceIds,
  setContentGenerationSourceIds,
  subsectionSourceIds,
  setSubsectionSourceIds,
  showSourceSelector,
  setShowSourceSelector,

  // 操作
  onAddSection,
  onAddTask,
  onUpdateTask,
  onAddSubsection,
  onGenerateTechnical,
  onGenerateManagement,
  onGenerateTaskContent,
  onGenerateSubsections,
  onGenerateImage,
  onAddSource,
  onSwitchToAIGeneration,

  // 衝突處理
  onConflictAppend,
  onConflictReplace,
  onConflictCancel,
  onSubsectionConflictAppend,
  onSubsectionConflictReplace,
  onContentConflictAppend,
  onContentConflictReplace,

  // 狀態
  generating,
  editingTask,
  editingSection,
  projectImages = [],
}: ProposalDialogsProps) {
  return (
    <>
      {/* 添加/編輯章節對話框 */}
      <AddSectionDialog
        open={isAddSectionOpen}
        onOpenChange={setIsAddSectionOpen}
        editingSection={editingSection}
        dialogInputValue={dialogInputValue}
        setDialogInputValue={setDialogInputValue}
        onAdd={onAddSection}
        onUpdate={onAddSection}
        onCancel={() => setIsAddSectionOpen(false)}
      />

      {/* 添加/編輯任務對話框 */}
      <AddTaskDialog
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        targetSection={targetSection}
        editingTask={editingTask}
        dialogInputValue={dialogInputValue}
        setDialogInputValue={setDialogInputValue}
        sources={sources}
        selectedSourceIds={selectedSourceIds}
        setSelectedSourceIds={setSelectedSourceIds}
        showSourceSelector={showSourceSelector}
        setShowSourceSelector={setShowSourceSelector}
        onAddTask={onAddTask}
        onUpdateTask={onUpdateTask}
        onGenerateTechnical={onGenerateTechnical}
        onGenerateManagement={onGenerateManagement}
        onAddSource={onAddSource}
        generating={generating}
      />

      {/* 添加次章節對話框 */}
      <AddSubsectionDialog
        open={isAddSubsectionOpen}
        onOpenChange={setIsAddSubsectionOpen}
        targetSection={targetSection}
        dialogInputValue={subsectionInputValue}
        setDialogInputValue={setSubsectionInputValue}
        onSwitchToAI={onSwitchToAIGeneration}
        onAdd={onAddSubsection}
        onCancel={() => setIsAddSubsectionOpen(false)}
      />

      {/* AI 生成次章節對話框 */}
      <GenerateSubsectionDialog
        open={isGenerateSubsectionOpen}
        onOpenChange={setIsGenerateSubsectionOpen}
        targetSection={targetSection}
        sources={sources}
        selectedSourceIds={subsectionSourceIds}
        onSelectionChange={setSubsectionSourceIds}
        onAddSource={onAddSource}
        onGenerate={onGenerateSubsections}
        isGenerating={generating}
      />

      {/* 任務內容生成對話框 */}
      <ContentGenerationDialog
        open={isContentGenerationDialogOpen}
        onOpenChange={setIsContentGenerationDialogOpen}
        contentGenerationTarget={contentGenerationTarget}
        sources={sources}
        contentGenerationSourceIds={contentGenerationSourceIds}
        setContentGenerationSourceIds={setContentGenerationSourceIds}
        onGenerate={onGenerateTaskContent}
        onAddSource={onAddSource}
      />

      {/* 圖片生成對話框 */}
      <ImageGenerationDialog
        open={imageGenDialogOpen}
        onOpenChange={setImageGenDialogOpen}
        task={selectedTaskForImage}
        projectImages={projectImages}
        onGenerate={onGenerateImage}
      />

      {/* 任務衝突對話框 */}
      {taskConflictContext && (
        <ConflictConfirmationDialog
          open={isConflictDialogOpen}
          onOpenChange={setIsConflictDialogOpen}
          title="此章節已有任務"
          description="檢測到該章節已包含任務。您想要："
          appendOption={{
            label: '保留並新增 (Append)',
            description: '將新生成的任務新增到現有任務之後',
          }}
          replaceOption={{
            label: '全部取代 (Replace All)',
            description: '刪除所有現有任務，替換為新生成的任務',
            showWarning: true,
          }}
          onCancel={onConflictCancel}
          onAppend={onConflictAppend}
          onReplace={onConflictReplace}
        />
      )}

      {/* 次章節衝突對話框 */}
      {pendingSubsectionArgs && (
        <ConflictConfirmationDialog
          open={isSubsectionConflictDialogOpen}
          onOpenChange={setIsSubsectionConflictDialogOpen}
          title="此章節已有次章節"
          description="檢測到該章節已包含次章節。您想要："
          appendOption={{
            label: '保留並新增',
            description: '將新生成的次章節新增到現有次章節之後',
          }}
          replaceOption={{
            label: '全部取代',
            description: '刪除所有現有次章節，替換為新生成的次章節',
            showWarning: true,
          }}
          onCancel={onConflictCancel}
          onAppend={onSubsectionConflictAppend}
          onReplace={onSubsectionConflictReplace}
        />
      )}

      {/* 內容衝突對話框 */}
      {pendingContentGeneration && (
        <ConflictConfirmationDialog
          open={isContentConflictDialogOpen}
          onOpenChange={setIsContentConflictDialogOpen}
          title="任務已有內容"
          description="檢測到該任務已包含內容。您想要："
          appendOption={{
            label: '保留並新增',
            description: '保留現有內容，將新內容附加到最後',
          }}
          replaceOption={{
            label: '全部取代',
            description: '刪除現有內容，替換為新生成的內容',
            showWarning: true,
          }}
          onCancel={onConflictCancel}
          onAppend={onContentConflictAppend}
          onReplace={onContentConflictReplace}
        />
      )}
    </>
  );
}
