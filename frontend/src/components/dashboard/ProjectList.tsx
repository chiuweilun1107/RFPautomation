/**
 * Legacy ProjectList component
 * Now uses the refactored ProjectListContainer from features/projects
 *
 * This file serves as a compatibility layer for existing imports.
 * All functionality has been moved to @/features/projects
 */

'use client';

import { ProjectListContainer } from '@/features/projects';

export function ProjectList({ searchQuery = "" }: { searchQuery?: string }) {
  return <ProjectListContainer externalSearchQuery={searchQuery} />;
}
