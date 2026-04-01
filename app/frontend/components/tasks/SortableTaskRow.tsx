import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskRow } from './TaskRow'
import type { Task, MemberOption } from './types'

interface SortableTaskRowProps {
  task: Task
  onToggle: (id: string) => void
  onEdit?: (task: Task) => void
  onDelete?: (id: string) => void
  busy?: boolean
  accentColor?: string
  members?: MemberOption[]
}

export function SortableTaskRow(props: SortableTaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.task.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <TaskRow
      ref={setNodeRef}
      style={style}
      isDragging={isDragging}
      dragHandleProps={{ ...attributes, ...listeners }}
      {...props}
    />
  )
}
