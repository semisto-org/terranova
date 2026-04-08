export interface Task {
  id: string
  name: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed'
  dueDate: string | null
  assigneeId: string | null
  assigneeName: string | null
  assigneeAvatar: string | null
  priority: 'low' | 'medium' | 'high' | null
  tags: string[]
  timeMinutes: number | null
  position: number
  parentId: string | null
  taskListId: string
  createdAt: string
  updatedAt: string
}

export interface TaskList {
  id: string
  name: string
  position: number
  tasks: Task[]
}

export interface MemberOption {
  id: string
  firstName: string
  lastName: string
  avatar?: string | null
}

export type ProjectTypeKey = 'lab-project' | 'training' | 'design-project' | 'guild'

export interface ProjectGroup {
  projectType: ProjectTypeKey
  projectId: string
  projectName: string
  tasks: Task[]
}

export const PROJECT_ACCENT_COLORS: Record<ProjectTypeKey, string> = {
  'lab-project': '#5B5781',
  'design-project': '#AFBD00',
  'training': '#B01A19',
  'guild': '#5B5781',
}

export const PROJECT_TYPE_LABELS: Record<ProjectTypeKey, string> = {
  'lab-project': 'Projet Lab',
  'design-project': 'Design Studio',
  'training': 'Academy',
  'guild': 'Guilde',
}

export const STATUS_NEXT: Record<Task['status'], Task['status']> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
}
