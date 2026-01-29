/**
 * ProposalEditor Context exports
 *
 * Usage:
 * ```tsx
 * import {
 *   ProposalEditorProvider,
 *   useProposalEditor,
 *   useProposalExpansion,
 *   useProposalTaskActions,
 *   // ... other hooks
 * } from '@/components/workspace/proposal-editor/context';
 * ```
 */

export {
  // Provider
  ProposalEditorProvider,

  // Main Hook
  useProposalEditor,
  useProposalEditorOptional,

  // Selector Hooks (for performance optimization)
  useProposalExpansion,
  useProposalDataSources,
  useProposalSectionActions,
  useProposalTaskActions,
  useProposalSectionInlineEdit,
  useProposalTaskInlineEdit,
  useProposalFilter,

  // Context (for advanced use cases)
  ProposalEditorContext,

  // Types
  type ProposalEditorContextType,
  type ProposalEditorProviderProps,
} from "./ProposalEditorContext";
