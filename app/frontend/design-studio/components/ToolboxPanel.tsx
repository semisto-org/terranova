import { BookOpen, Wrench, ExternalLink, Smartphone } from 'lucide-react'

interface ToolboxPanelProps {
  toolbox: Record<string, unknown>
  references: {
    sites: Array<{ label: string; url: string }>
    apps: Array<{ label: string; usage: string }>
  }
  activeStepKey?: string | null
}

// Libellés FR des référentiels permacoles.
const TOOLBOX_LABELS: Record<string, string> = {
  fleur_permaculturelle: 'Fleur permaculturelle',
  echelle_de_permanence: 'Échelle de permanence',
  carte_secteurs: 'Carte des secteurs',
  carte_zones: 'Carte des zones',
  principes_mollison: 'Principes — Mollison',
  principes_holmgren: 'Principes — Holmgren',
}

const CONSTRAINT_LABELS: Record<string, string> = {
  socio_techniques: 'Socio-techniques',
  environnementales: 'Environnementales',
  fonctionnelles: 'Fonctionnelles',
  productives: 'Productives',
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <details className="group border-b border-stone-100 last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between py-2 text-[13px] font-medium text-stone-700">
        {title}
        <span className="text-stone-400 group-open:rotate-90 transition-transform">›</span>
      </summary>
      <ul className="pb-2 pl-1 space-y-1">
        {items.map((it) => (
          <li key={it} className="text-[12px] text-stone-500 leading-snug">
            • {it}
          </li>
        ))}
      </ul>
    </details>
  )
}

export function ToolboxPanel({ toolbox, references }: ToolboxPanelProps) {
  const constraints = (toolbox.contraintes as Record<string, string[]>) ?? {}
  const stun = toolbox.stun as string | undefined

  return (
    <aside className="space-y-4 lg:sticky lg:top-6 self-start">
      {/* Boîte à outils permacole */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-[#6B7A00]" />
          <h3 className="text-sm font-semibold text-stone-800">Boîte à outils permacole</h3>
        </div>
        {Object.entries(TOOLBOX_LABELS).map(([key, label]) => {
          const items = toolbox[key] as string[] | undefined
          if (!items) return null
          return <ListSection key={key} title={label} items={items} />
        })}
        {Object.keys(constraints).length > 0 && (
          <ListSection
            title="Contraintes"
            items={Object.entries(constraints).flatMap(([k, vals]) =>
              [`— ${CONSTRAINT_LABELS[k] ?? k} —`, ...vals],
            )}
          />
        )}
        {stun && <p className="mt-2 rounded-lg bg-stone-50 px-3 py-2 text-[12px] italic text-stone-500">{stun}</p>}
      </div>

      {/* Références */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#6B7A00]" />
          <h3 className="text-sm font-semibold text-stone-800">Références</h3>
        </div>
        <ul className="space-y-1.5">
          {references.sites.map((site) => (
            <li key={site.url}>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] text-[#6B7A00] hover:underline"
              >
                {site.label}
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center gap-2">
          <Smartphone className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-stone-400">Apps terrain</span>
        </div>
        <ul className="mt-1 space-y-0.5">
          {references.apps.map((app) => (
            <li key={app.label} className="text-[12px] text-stone-500">
              <span className="font-medium text-stone-600">{app.label}</span> — {app.usage}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
