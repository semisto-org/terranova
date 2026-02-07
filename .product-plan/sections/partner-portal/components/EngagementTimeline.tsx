import { useState } from 'react'
import type { Engagement, EngagementMedia } from '../types'

interface EngagementTimelineProps {
  engagement: Engagement
  onDocumentDownload?: (documentId: string) => void
  onBack?: () => void
}

const typeLabels: Record<string, string> = {
  'citizen-project': 'Projet Citoyen',
  'team-building': 'Team Building',
  'sponsorship': 'Parrainage',
  'recurring-patronage': 'Mécénat',
  'training': 'Formation',
  'ambassador': 'Ambassadeur',
}

const eventTypeColors: Record<string, { dot: string; bg: string; text: string }> = {
  milestone: { dot: '#5B5781', bg: 'bg-[#5B5781]/10 dark:bg-[#5B5781]/20', text: 'text-[#5B5781] dark:text-[#c8bfd2]' },
  workshop: { dot: '#AFBD00', bg: 'bg-[#AFBD00]/10 dark:bg-[#AFBD00]/20', text: 'text-[#AFBD00]' },
  planting: { dot: '#22c55e', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
  'team-building': { dot: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
  reporting: { dot: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' },
}

export function EngagementTimeline({ engagement, onDocumentDownload, onBack }: EngagementTimelineProps) {
  const isCompleted = engagement.status === 'completed'
  const [showGallery, setShowGallery] = useState(false)
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'photo' | 'video'>('all')
  const [selectedMedia, setSelectedMedia] = useState<EngagementMedia | null>(null)

  const filteredMedia = galleryFilter === 'all'
    ? engagement.media
    : engagement.media.filter(m => m.type === galleryFilter)
  const photoCount = engagement.media.filter(m => m.type === 'photo').length
  const videoCount = engagement.media.filter(m => m.type === 'video').length
  const previewMedia = engagement.media.slice(0, 4)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour aux engagements
      </button>

      {/* Header card */}
      <div
        className="rounded-2xl overflow-hidden mb-8 border border-stone-200/60 dark:border-stone-800"
        style={{
          background: isCompleted
            ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
            : 'linear-gradient(135deg, #5B5781, #3d3a57)',
        }}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  {isCompleted ? 'Terminé' : 'En cours'}
                </span>
                <span
                  className={`text-[10px] font-medium uppercase tracking-wider ${
                    isCompleted ? 'text-emerald-600' : 'text-white/60'
                  }`}
                >
                  {typeLabels[engagement.packageType]}
                </span>
              </div>
              <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isCompleted ? 'text-stone-900' : 'text-white'}`}>
                {engagement.title}
              </h1>
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Lab', value: engagement.labName },
              { label: 'Lieu', value: engagement.location || '—' },
              { label: 'Budget', value: `${engagement.totalBudget.toLocaleString('fr-BE')} €` },
              { label: 'Progression', value: `${engagement.progress}%` },
            ].map(item => (
              <div key={item.label}>
                <dt className={`text-xs ${isCompleted ? 'text-emerald-600/70' : 'text-white/50'}`}>{item.label}</dt>
                <dd className={`text-sm font-semibold mt-0.5 ${isCompleted ? 'text-stone-900' : 'text-white'}`}>{item.value}</dd>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className={`h-2 rounded-full ${isCompleted ? 'bg-emerald-200' : 'bg-white/20'}`}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${engagement.progress}%`,
                  background: isCompleted ? '#22c55e' : '#AFBD00',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline - Left */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Chronologie
          </h2>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[17px] top-2 bottom-2 w-px bg-stone-200 dark:bg-stone-700" />

            <div className="space-y-6">
              {engagement.events.map((event, i) => {
                const colors = eventTypeColors[event.type] || eventTypeColors.milestone
                const isUpcoming = event.status === 'upcoming'

                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Dot */}
                    <div className="relative z-10 flex-shrink-0 mt-1">
                      <div
                        className={`w-[35px] h-[35px] rounded-full flex items-center justify-center border-4 ${
                          isUpcoming
                            ? 'border-white dark:border-stone-950 bg-stone-100 dark:bg-stone-800'
                            : 'border-white dark:border-stone-950'
                        }`}
                        style={!isUpcoming ? { background: colors.dot } : {}}
                      >
                        {!isUpcoming ? (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-600" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div
                      className={`
                        flex-1 rounded-xl p-4 border transition-colors
                        ${isUpcoming
                          ? 'bg-white dark:bg-stone-900 border-dashed border-stone-300 dark:border-stone-700'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${colors.text}`}>
                          {event.type === 'milestone' && 'Jalon'}
                          {event.type === 'workshop' && 'Atelier'}
                          {event.type === 'planting' && 'Plantation'}
                          {event.type === 'team-building' && 'Team Building'}
                          {event.type === 'reporting' && 'Reporting'}
                        </span>
                        <span className="text-[10px] text-stone-400 dark:text-stone-500">
                          {new Date(event.date).toLocaleDateString('fr-BE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
                        {event.title}
                      </h3>
                      <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar - Right */}
        <div className="space-y-6">
          {/* Documents */}
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-semibold text-stone-900 dark:text-white flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documents ({engagement.documents.length})
              </h3>
            </div>

            {engagement.documents.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-stone-400 dark:text-stone-500">
                Aucun document partagé pour le moment
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {engagement.documents.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => onDocumentDownload?.(doc.id)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-stone-500 dark:text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate group-hover:text-[#5B5781] dark:group-hover:text-[#c8bfd2] transition-colors">
                        {doc.title}
                      </p>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500">
                        {doc.fileSize} — {new Date(doc.date).toLocaleDateString('fr-BE')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Media preview */}
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <h3 className="font-semibold text-stone-900 dark:text-white flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Médias
              </h3>
              {engagement.media.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] text-stone-400 dark:text-stone-500">
                  {photoCount > 0 && <span>{photoCount} photo{photoCount > 1 ? 's' : ''}</span>}
                  {photoCount > 0 && videoCount > 0 && <span className="w-0.5 h-0.5 rounded-full bg-stone-300 dark:bg-stone-600" />}
                  {videoCount > 0 && <span>{videoCount} vidéo{videoCount > 1 ? 's' : ''}</span>}
                </div>
              )}
            </div>

            {engagement.media.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-stone-400 dark:text-stone-500">
                Aucun média partagé pour le moment
              </div>
            ) : (
              <div className="p-3">
                {/* Thumbnail preview grid — max 4 items */}
                <div className="grid grid-cols-2 gap-2">
                  {previewMedia.map((media, i) => {
                    const isLast = i === 3 && engagement.media.length > 4
                    return (
                      <button
                        key={media.id}
                        onClick={() => isLast ? setShowGallery(true) : setSelectedMedia(media)}
                        className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 group/media"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-800 flex items-center justify-center">
                          <svg className="w-6 h-6 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition-colors" />

                        {media.type === 'video' && !isLast && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                              <svg className="w-3 h-3 text-stone-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                            {media.duration && (
                              <span className="absolute bottom-1.5 right-1.5 px-1 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono">
                                {media.duration}
                              </span>
                            )}
                          </div>
                        )}

                        {/* "See more" overlay on last thumbnail */}
                        {isLast && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              +{engagement.media.length - 3}
                            </span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* "See all" button */}
                {engagement.media.length > 2 && (
                  <button
                    onClick={() => setShowGallery(true)}
                    className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Voir toutes les photos et vidéos
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Contact info */}
          <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 p-5">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Contact Lab</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-bold text-stone-500 dark:text-stone-400">
                {engagement.labContact.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{engagement.labContact}</p>
                <p className="text-xs text-stone-400 dark:text-stone-500">{engagement.labName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Full-screen media gallery overlay */}
      {/* ================================================================ */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-stone-950 overflow-y-auto">
          {/* Gallery header */}
          <div className="sticky top-0 z-10 bg-white/90 dark:bg-stone-950/90 backdrop-blur-xl border-b border-stone-200 dark:border-stone-800">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowGallery(false)}
                  className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Retour
                </button>
                <div className="h-5 w-px bg-stone-200 dark:bg-stone-700" />
                <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                  Photos & Vidéos — {engagement.title}
                </h2>
              </div>
              <span className="text-xs text-stone-400 dark:text-stone-500">
                {engagement.media.length} élément{engagement.media.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Filters */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 flex items-center gap-2">
              {(['all', 'photo', 'video'] as const).map(filter => {
                const isActive = galleryFilter === filter
                const count = filter === 'all' ? engagement.media.length : filter === 'photo' ? photoCount : videoCount
                return (
                  <button
                    key={filter}
                    onClick={() => setGalleryFilter(filter)}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${isActive
                        ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }
                    `}
                  >
                    {filter === 'all' ? 'Tout' : filter === 'photo' ? 'Photos' : 'Vidéos'}
                    <span className={`ml-1.5 ${isActive ? 'text-white/60 dark:text-stone-900/60' : 'text-stone-400 dark:text-stone-500'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Gallery grid */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {filteredMedia.length === 0 ? (
              <div className="text-center py-20">
                <svg className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-stone-400 dark:text-stone-500">
                  Aucun{galleryFilter === 'video' ? 'e vidéo' : 'e photo'} pour le moment
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredMedia.map(media => (
                  <button
                    key={media.id}
                    onClick={() => setSelectedMedia(media)}
                    className="group/item relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-800 flex items-center justify-center">
                      <svg className="w-8 h-8 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/30 transition-colors flex items-end">
                      <div className="w-full p-3 translate-y-full group-hover/item:translate-y-0 transition-transform">
                        <p className="text-xs text-white font-medium truncate">{media.title}</p>
                        <p className="text-[10px] text-white/60">
                          {new Date(media.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Video play icon */}
                    {media.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform">
                          <svg className="w-5 h-5 text-stone-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        {media.duration && (
                          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono">
                            {media.duration}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Type badge */}
                    <div className="absolute top-2 left-2">
                      <span className="px-1.5 py-0.5 rounded bg-black/50 text-white text-[9px] font-medium uppercase tracking-wider">
                        {media.type === 'photo' ? 'Photo' : 'Vidéo'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* Lightbox modal */}
      {/* ================================================================ */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedMedia(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation arrows */}
          {engagement.media.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const currentIndex = engagement.media.findIndex(m => m.id === selectedMedia.id)
                  const prevIndex = (currentIndex - 1 + engagement.media.length) % engagement.media.length
                  setSelectedMedia(engagement.media[prevIndex])
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const currentIndex = engagement.media.findIndex(m => m.id === selectedMedia.id)
                  const nextIndex = (currentIndex + 1) % engagement.media.length
                  setSelectedMedia(engagement.media[nextIndex])
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Media content */}
          <div className="max-w-4xl max-h-[80vh] mx-auto px-16" onClick={(e) => e.stopPropagation()}>
            {selectedMedia.type === 'photo' ? (
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-800">
                <div className="absolute inset-0 bg-gradient-to-br from-stone-700 to-stone-800 flex items-center justify-center">
                  <svg className="w-16 h-16 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-900 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                {selectedMedia.duration && (
                  <span className="absolute bottom-4 right-4 px-2 py-1 rounded-lg bg-black/60 text-white text-sm font-mono">
                    {selectedMedia.duration}
                  </span>
                )}
              </div>
            )}

            {/* Caption */}
            <div className="mt-4 text-center">
              <p className="text-white font-medium">{selectedMedia.title}</p>
              <p className="text-white/50 text-sm mt-1">
                {new Date(selectedMedia.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-white/30 text-xs mt-2">
                {engagement.media.findIndex(m => m.id === selectedMedia.id) + 1} / {engagement.media.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
