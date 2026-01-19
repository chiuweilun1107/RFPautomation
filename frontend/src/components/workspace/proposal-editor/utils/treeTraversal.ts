/**
 * Tree Traversal Utilities
 *
 * Helper functions for traversing and manipulating section tree structures
 */

import type { Section } from '../types';

/**
 * Find a section by ID in the tree
 */
export function findSection(nodes: Section[], id: string): Section | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findSection(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get parent information for a target section
 */
export interface ParentInfo {
  parent: Section | null;
  list: Section[];
}

export function getParentInfo(nodes: Section[], targetId: string): ParentInfo | null {
  const findDeep = (list: Section[], parent: Section | null): ParentInfo | null => {
    if (list.some(n => n.id === targetId)) return { parent, list };

    for (const node of list) {
      if (node.children) {
        const found = findDeep(node.children, node);
        if (found) return found;
      }
    }
    return null;
  };
  return findDeep(nodes, null);
}

/**
 * Get flattened list of all section titles (including sub-sections)
 */
export function getFlattenedTitles(nodes: Section[]): string[] {
  let titles: string[] = [];
  nodes.forEach(node => {
    titles.push(node.title);
    if (node.children && node.children.length > 0) {
      titles = [...titles, ...getFlattenedTitles(node.children)];
    }
  });
  return titles;
}

/**
 * Collect all task IDs from a section tree
 */
export function collectTaskIds(nodes: Section[]): string[] {
  const taskIds: string[] = [];
  const traverse = (sections: Section[]) => {
    sections.forEach(section => {
      section.tasks?.forEach(task => taskIds.push(task.id));
      if (section.children) traverse(section.children);
    });
  };
  traverse(nodes);
  return taskIds;
}

/**
 * Update a section in the tree (immutable)
 */
export function updateSectionInTree(
  nodes: Section[],
  sectionId: string,
  updater: (section: Section) => Section
): Section[] {
  return nodes.map(node => {
    if (node.id === sectionId) {
      return updater(node);
    }
    if (node.children) {
      return { ...node, children: updateSectionInTree(node.children, sectionId, updater) };
    }
    return node;
  });
}

/**
 * Remove a section from the tree (immutable)
 */
export function removeSectionFromTree(nodes: Section[], sectionId: string): Section[] {
  return nodes
    .filter(node => node.id !== sectionId)
    .map(node => {
      if (node.children) {
        return { ...node, children: removeSectionFromTree(node.children, sectionId) };
      }
      return node;
    });
}

/**
 * Traverse tree and apply callback to each section
 */
export function traverseSections(
  nodes: Section[],
  callback: (section: Section, depth: number) => void,
  depth: number = 0
): void {
  nodes.forEach(node => {
    callback(node, depth);
    if (node.children) {
      traverseSections(node.children, callback, depth + 1);
    }
  });
}
