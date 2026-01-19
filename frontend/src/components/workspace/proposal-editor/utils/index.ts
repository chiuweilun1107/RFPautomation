/**
 * Utils Export Index
 *
 * Centralized exports for all proposal editor utilities
 */

export {
  findSection,
  getParentInfo,
  getFlattenedTitles,
  collectTaskIds,
  updateSectionInTree,
  removeSectionFromTree,
  traverseSections,
} from './treeTraversal';
export type { ParentInfo } from './treeTraversal';

export {
  parseChineseNumber,
  autoSortChildren,
  updateOrder,
  updateTaskOrder,
} from './sectionUtils';
