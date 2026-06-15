import { ForwardRefExoticComponent, RefAttributes } from 'react'

export interface MentionMember {
  id: string
  label: string
}

export interface SimpleEditorProps {
  content?: string
  onUpdate?: (html: string) => void
  placeholder?: string
  minHeight?: string
  toolbar?: string[]
  mentionMembers?: MentionMember[] | null
}

export interface SimpleEditorHandle {
  focus: () => void
  getHTML: () => string
  setContent: (content: string) => void
}

declare const SimpleEditor: ForwardRefExoticComponent<
  SimpleEditorProps & RefAttributes<SimpleEditorHandle>
>

export default SimpleEditor
