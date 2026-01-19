"use client"

import * as React from "react"
import { useDraggable } from "@dnd-kit/core"

interface DraggableComponentProps {
  children: React.ReactNode
  type: string
  data: any
  onDragStart: () => void
  onClick?: () => void
}

export function DraggableComponent({ children, type, data, onDragStart, onClick }: DraggableComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `${type}-${data.id}`,
    data: {
      type,
      ...data
    }
  })

  // 使用 listeners 中的 onDragStart
  const handleDragStart = () => {
    onDragStart()
  }

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
    >
      {children}
    </div>
  )
}