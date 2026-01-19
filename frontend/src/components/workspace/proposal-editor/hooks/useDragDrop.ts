/**
 * useDragDrop Hook
 *
 * Manages drag and drop functionality for sections and tasks
 */

import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import type { UseSectionStateReturn } from './useSectionState';

export interface UseDragDropReturn {
  sensors: any;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
}

export function useDragDrop(
  projectId: string,
  sectionState: UseSectionStateReturn
): UseDragDropReturn {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    // TODO: Implement drag end logic
    // - Handle task dragging
    // - Handle section dragging
    // - Update order in database
  };

  return {
    sensors,
    handleDragEnd,
  };
}
