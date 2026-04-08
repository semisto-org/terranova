import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskListBlock } from './TaskListBlock'
import type { Task, MemberOption } from './types'

interface SortableTaskListBlockProps {
  id: string
  name: string
  tasks: Task[]
  onToggleTask: (taskId: string) => void
  onEditTask?: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
  onAddTask?: (taskListId: string) => void
  onEditList?: (id: string, name: string) => void
  onDeleteList?: (id: string) => void
  onReorderTasks?: (taskListId: string, orderedIds: string[]) => void
  busy?: boolean
  accentColor?: string
  members?: MemberOption[]
}

export function SortableTaskListBlock(props: SortableTaskListBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <TaskListBlock
      ref={setNodeRef}
      style={style}
      isDragging={isDragging}
      dragHandleProps={{ ...attributes, ...listeners }}
      {...props}
    />
  )
}
