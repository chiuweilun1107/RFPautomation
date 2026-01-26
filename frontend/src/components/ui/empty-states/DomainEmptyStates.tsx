/**
 * Domain-Specific Empty States
 *
 * 針對不同業務領域的專用空狀態組件
 */

import { FileText, FolderOpen, Globe, FileQuestion, Sparkles, Upload, Plus } from 'lucide-react';
import { BrutalistEmptyState } from './BrutalistEmptyState';

/**
 * 模板列表空狀態
 */
export function TemplateEmptyState({
  onUpload,
  isFiltered = false,
}: {
  onUpload?: () => void;
  isFiltered?: boolean;
}) {
  if (isFiltered) {
    return (
      <BrutalistEmptyState
        icon={FileQuestion}
        title="NO TEMPLATES MATCH"
        description="No templates found in this folder. Try another folder or clear filters."
        variant="default"
        stateType="filtered"
      />
    );
  }

  return (
    <BrutalistEmptyState
      icon={FileText}
      title="NO TEMPLATES YET"
      description="This folder is empty. Upload a DOCX template to get started."
      variant="boxed"
      stateType="empty"
      action={onUpload ? {
        label: 'Upload Template',
        onClick: onUpload,
        icon: Upload,
      } : undefined}
    />
  );
}

/**
 * 知識庫空狀態
 */
export function KnowledgeEmptyState({
  onUpload,
  isFiltered = false,
}: {
  onUpload?: () => void;
  isFiltered?: boolean;
}) {
  if (isFiltered) {
    return (
      <BrutalistEmptyState
        icon={FileQuestion}
        title="NO MATCHING RECORDS"
        description="No documents match your search query. Try different keywords."
        variant="default"
        stateType="filtered"
      />
    );
  }

  return (
    <BrutalistEmptyState
      icon={FileText}
      title="NO DOCUMENTS FOUND"
      description="Knowledge base is empty. Upload PDF or DOCX files to build your knowledge repository."
      variant="boxed"
      stateType="empty"
      action={onUpload ? {
        label: 'Upload Document',
        onClick: onUpload,
        icon: Upload,
      } : undefined}
    />
  );
}

/**
 * 來源管理空狀態
 */
export function SourceEmptyState({
  onAddSource,
  onAISearch,
  isFiltered = false,
}: {
  onAddSource?: () => void;
  onAISearch?: () => void;
  isFiltered?: boolean;
}) {
  if (isFiltered) {
    return (
      <BrutalistEmptyState
        icon={FileQuestion}
        title="NO SOURCES MATCH"
        description="No sources found matching your filter. Clear or adjust your search criteria."
        variant="default"
        stateType="filtered"
      />
    );
  }

  return (
    <BrutalistEmptyState
      icon={Globe}
      title="NO SOURCES FOUND"
      description="Start building your knowledge base. Upload files or use AI search to find relevant sources."
      variant="boxed"
      stateType="empty"
      action={onAISearch ? {
        label: 'AI Search',
        onClick: onAISearch,
        icon: Sparkles,
      } : undefined}
      secondaryAction={onAddSource ? {
        label: 'Add Source',
        onClick: onAddSource,
        icon: Plus,
      } : undefined}
    />
  );
}

/**
 * 提案結構編輯器空狀態
 */
export function ProposalEmptyState({
  onAddSection,
  onUseTemplate,
}: {
  onAddSection?: () => void;
  onUseTemplate?: () => void;
}) {
  return (
    <BrutalistEmptyState
      icon={FileText}
      title="NO STRUCTURE DEFINED"
      description="Proposal structure is empty. Add sections manually or import from a template."
      variant="boxed"
      stateType="empty"
      action={onUseTemplate ? {
        label: 'Import Template',
        onClick: onUseTemplate,
        icon: Upload,
      } : undefined}
      secondaryAction={onAddSection ? {
        label: 'Add Section',
        onClick: onAddSection,
        icon: Plus,
      } : undefined}
    />
  );
}

/**
 * 項目列表空狀態
 */
export function ProjectEmptyState({
  onCreateProject,
  isFiltered = false,
}: {
  onCreateProject?: () => void;
  isFiltered?: boolean;
}) {
  if (isFiltered) {
    return (
      <BrutalistEmptyState
        icon={FolderOpen}
        title="NO PROJECTS FOUND"
        description="No projects match your search. Adjust your filters or clear the search."
        variant="default"
        stateType="filtered"
      />
    );
  }

  return (
    <BrutalistEmptyState
      icon={FolderOpen}
      title="NO PROJECTS YET"
      description="Get started by creating your first project. Track proposals, assessments, and manage your workflow."
      variant="boxed"
      stateType="empty"
      action={onCreateProject ? {
        label: 'Create Project',
        onClick: onCreateProject,
        icon: Plus,
      } : undefined}
    />
  );
}
