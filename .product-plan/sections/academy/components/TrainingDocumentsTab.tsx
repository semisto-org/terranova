import { FileText, Plus, Trash2, ExternalLink, File, Link as LinkIcon, Image, Video } from 'lucide-react'
import type {
  TrainingDocument,
  DocumentType
} from '../types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TrainingDocumentsTabProps {
  documents: TrainingDocument[]
  onUploadDocument?: () => void
  onDeleteDocument?: (documentId: string) => void
}

const documentTypeIcons: Record<DocumentType, typeof FileText> = {
  pdf: FileText,
  link: LinkIcon,
  image: Image,
  video: Video,
}

const documentTypeLabels: Record<DocumentType, string> = {
  pdf: 'PDF',
  link: 'Lien',
  image: 'Image',
  video: 'Vidéo',
}

export function TrainingDocumentsTab({
  documents,
  onUploadDocument,
  onDeleteDocument,
}: TrainingDocumentsTabProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Documents
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {documents.length} document{documents.length > 1 ? 's' : ''} disponible{documents.length > 1 ? 's' : ''} pour les participants
          </p>
        </div>
        <Button onClick={() => onUploadDocument?.()} size="sm" className="w-full sm:w-auto">
          <Plus className="size-4" />
          <span className="ml-2">Ajouter un document</span>
        </Button>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="bg-white dark:bg-stone-800/50 rounded-lg p-12 border border-stone-200 dark:border-stone-700 text-center">
          <FileText className="size-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
          <p className="text-stone-500 dark:text-stone-400 mb-4">
            Aucun document ajouté pour le moment
          </p>
          <Button
            onClick={() => onUploadDocument?.()}
            variant="outline"
            size="sm"
          >
            <Plus className="size-4" />
            Ajouter un document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map(document => {
            const Icon = documentTypeIcons[document.type]
            const typeLabel = documentTypeLabels[document.type]

            return (
              <div
                key={document.id}
                className="bg-white dark:bg-stone-800/50 rounded-lg p-5 border border-stone-200 dark:border-stone-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg shrink-0">
                      <Icon className="size-5 text-stone-600 dark:text-stone-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-stone-900 dark:text-stone-100 mb-1 break-words">
                        {document.name}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {typeLabel}
                        </Badge>
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          Ajouté le {formatDate(document.uploadedAt)}
                        </span>
                      </div>
                      {document.type === 'link' && (
                        <a
                          href={document.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 mt-2 text-sm text-[#B01A19] hover:underline"
                        >
                          <ExternalLink className="size-3" />
                          Ouvrir le lien
                        </a>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <Trash2 className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDeleteDocument?.(document.id)}
                      >
                        <Trash2 className="size-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

