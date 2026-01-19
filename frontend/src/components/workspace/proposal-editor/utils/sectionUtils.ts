/**
 * Section Utilities
 *
 * Helper functions for section operations and ordering
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SectionUpdatePayload } from '../types';

/**
 * Parse Chinese numerals to numbers for sorting
 * Examples: "一" -> 1, "二" -> 2, "十" -> 10, "十一" -> 11
 */
export function parseChineseNumber(title: string): number {
  const chineseNumerals: Record<string, number> = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
    '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
    '十': 10
  };

  // Extract first character or first two characters
  const firstChar = title.charAt(0);
  const firstTwoChars = title.substring(0, 2);

  // Handle "十一", "十二" etc.
  if (firstChar === '十' && title.length > 1) {
    const secondChar = title.charAt(1);
    if (chineseNumerals[secondChar] !== undefined) {
      return 10 + chineseNumerals[secondChar];
    }
    return 10;
  }

  // Handle single digit
  if (chineseNumerals[firstChar] !== undefined) {
    return chineseNumerals[firstChar];
  }

  // If no match, return Infinity (will be sorted to end)
  return Infinity;
}

/**
 * Auto-sort children sections by Chinese numerals
 */
export async function autoSortChildren(
  supabase: SupabaseClient,
  projectId: string,
  parentId: string
): Promise<void> {
  try {
    const { data } = await supabase
      .from('sections')
      .select('*')
      .eq('parent_id', parentId);

    if (!data || data.length === 0) return;

    // Sort by Chinese numerals
    const sorted = [...data].sort((a, b) => {
      const numA = parseChineseNumber(a.title);
      const numB = parseChineseNumber(b.title);
      if (numA !== Infinity && numB !== Infinity) return numA - numB;
      if (numA !== Infinity) return -1;
      if (numB !== Infinity) return 1;
      return a.order_index - b.order_index;
    });

    // Check if order changed
    const needsUpdate = sorted.some((item, index) => item.order_index !== index + 1);
    if (!needsUpdate) return;

    // Prepare update payloads
    const updates: SectionUpdatePayload[] = sorted.map((item, index) => ({
      id: item.id,
      project_id: projectId,
      title: item.title,
      parent_id: item.parent_id,
      order_index: index + 1
    }));

    await updateOrder(supabase, updates);
  } catch (e) {
    console.error('Auto-sort failed:', e);
  }
}

/**
 * Update section order in database
 */
export async function updateOrder(
  supabase: SupabaseClient,
  items: SectionUpdatePayload[]
): Promise<void> {
  try {
    const { error } = await supabase
      .from('sections')
      .upsert(
        items.map(item => ({
          id: item.id,
          project_id: item.project_id,
          title: item.title,
          order_index: item.order_index,
          parent_id: item.parent_id
        })),
        { onConflict: 'id' }
      );

    if (error) throw error;
  } catch (e) {
    console.error('Failed to save order:', e);
    throw e;
  }
}

/**
 * Update task order in database
 */
export async function updateTaskOrder(
  supabase: SupabaseClient,
  updates: { id: string; section_id?: string; order_index?: number }[]
): Promise<void> {
  try {
    for (const update of updates) {
      const { error } = await supabase
        .from('tasks')
        .update(update)
        .eq('id', update.id);
      if (error) throw error;
    }
  } catch (e) {
    console.error('Failed to save task order:', e);
    throw e;
  }
}
