import { Sparkles } from 'lucide-react'

/**
 * Discreet banner shown above sections that are scaffolded but not yet
 * functional in production. Sits at the top of the section's content; the
 * UI behind it stays interactive so contributors can still see the shape.
 */
export function InactiveFeatureCallout({ title = 'Bientôt disponible', children }) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100">
        <Sparkles className="h-3.5 w-3.5 text-amber-700" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-amber-900">{title}</p>
        <p className="mt-0.5 text-xs text-amber-800/80">{children}</p>
      </div>
    </div>
  )
}
