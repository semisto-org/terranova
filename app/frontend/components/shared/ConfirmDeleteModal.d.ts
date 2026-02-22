import { FC } from 'react'

interface ConfirmDeleteModalProps {
  title?: string
  message?: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  accentColor?: string
}

declare const ConfirmDeleteModal: FC<ConfirmDeleteModalProps>
export default ConfirmDeleteModal
