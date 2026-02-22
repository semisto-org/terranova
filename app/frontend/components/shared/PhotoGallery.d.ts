import { FC } from 'react'

interface PhotoGalleryProps {
  items: Record<string, unknown>[]
  onUpload?: (files: File[]) => Promise<void>
  onDelete?: (mediaId: string) => Promise<void>
  readOnly?: boolean
}

declare const PhotoGallery: FC<PhotoGalleryProps>
export default PhotoGallery
