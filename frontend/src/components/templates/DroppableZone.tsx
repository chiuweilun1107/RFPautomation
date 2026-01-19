"use client"

import * as React from "react"
import { useDroppable } from "@dnd-kit/core"
import { Plus } from "lucide-react"

interface DroppableZoneProps {
  id: string
  onDrop: () => void
}

export function DroppableZone({ id, onDrop }: DroppableZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id
  })

  return (
    <div
      ref={setNodeRef}
      className={`
        w-full transition-all duration-200 ease-in-out
        ${isOver ? 'h-1 bg-[#FA4028] my-2' : 'h-0 bg-transparent'}
      `}
    />
  )
}