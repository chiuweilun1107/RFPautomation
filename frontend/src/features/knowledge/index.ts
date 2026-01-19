/**
 * Knowledge Base Feature Module
 * Public API exports
 */

// Components will be exported here
// export { KnowledgeBase } from './components/KnowledgeBase';

// Hooks will be exported here
// export { useKnowledge } from './hooks/useKnowledge';

// Types
export type {
  KnowledgeSource,
  KnowledgeItem,
  SourceType,
  KnowledgeSearchRequest,
  KnowledgeSearchResponse
} from './types/knowledge.schema';

// API
export { knowledgeApi } from './api/knowledgeApi';
