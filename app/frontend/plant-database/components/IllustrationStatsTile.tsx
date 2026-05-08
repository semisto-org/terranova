import { Sparkles } from 'lucide-react'

interface Stats {
  total: number
  withIllustration: number
  withoutIllustration: number
  running: number
  failedRecently: number
  completionPct: number
}

interface Props {
  stats: Stats
  onLaunchBulk?: () => void
  isAdmin: boolean
}

interface TileProps {
  label: string
  value: number
  accent: 'positive' | 'info' | 'warning'
  pulse?: boolean
  hint?: string
}

const ACCENTS: Record<TileProps['accent'], { rule: string; numeral: string; label: string }> = {
  positive: {
    rule: 'border-l-[#AFBD00]',
    numeral: 'text-[#5a7028]',
    label: 'text-[#7a8d3a]'
  },
  info: {
    rule: 'border-l-[#5B5781]',
    numeral: 'text-[#3a3760]',
    label: 'text-[#6b6790]'
  },
  warning: {
    rule: 'border-l-[#EF9B0D]',
    numeral: 'text-[#8a5a08]',
    label: 'text-[#a87a26]'
  }
}

function Tile({ label, value, accent, pulse, hint }: TileProps) {
  const styles = ACCENTS[accent]
  return (
    <div
      className={`relative bg-white border border-stone-200 border-l-[3px] ${styles.rule} rounded-md px-5 py-4 shadow-[0_1px_0_rgba(0,0,0,0.04)] overflow-hidden`}
    >
      {pulse && (
        <span
          className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[#EF9B0D] animate-pulse"
          aria-hidden
        />
      )}
      <div
        className={`text-[10px] uppercase tracking-[0.22em] font-medium ${styles.label}`}
      >
        {label}
      </div>
      <div
        className={`mt-2 text-4xl ${styles.numeral} leading-none tracking-tight`}
        style={{ fontFamily: "'Sole Serif Small', 'DM Serif Display', serif", fontWeight: 400, fontVariantNumeric: 'tabular-nums oldstyle-nums' }}
      >
        {value.toLocaleString('fr-FR')}
      </div>
      {hint && (
        <div className="mt-2 text-[11px] text-stone-500 italic">{hint}</div>
      )}
    </div>
  )
}

export function IllustrationStatsTile({ stats, onLaunchBulk, isAdmin }: Props) {
  const remaining = stats.withoutIllustration
  return (
    <section className="mb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <Tile
          label="Illustrées"
          value={stats.withIllustration}
          accent="positive"
          hint="Silhouettes prêtes à imprimer"
        />
        <Tile
          label="En cours"
          value={stats.running}
          accent="info"
          pulse={stats.running > 0}
          hint={stats.running > 0 ? 'Génération en arrière-plan' : 'Atelier au repos'}
        />
        <Tile
          label="Restantes"
          value={remaining}
          accent="warning"
          hint={stats.failedRecently > 0 ? `dont ${stats.failedRecently} en échec récent` : 'À rattraper'}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-stone-500 mb-2">
            <span>Couverture du catalogue</span>
            <span className="font-mono text-stone-700">{stats.completionPct}%</span>
          </div>
          <div className="relative h-[6px] bg-stone-200/80 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#AFBD00] to-[#7a8d3a] transition-[width] duration-700 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, stats.completionPct))}%` }}
            />
            {/* Tick marks every 25% */}
            {[25, 50, 75].map(t => (
              <span
                key={t}
                className="absolute top-0 bottom-0 w-px bg-white/70"
                style={{ left: `${t}%` }}
                aria-hidden
              />
            ))}
          </div>
          <p className="text-[11px] text-stone-500 mt-2 italic">
            {stats.total.toLocaleString('fr-FR')} fiches au total dans le catalogue.
          </p>
        </div>

        {isAdmin && remaining > 0 && (
          <button
            onClick={onLaunchBulk}
            className="group relative inline-flex items-center gap-2.5 px-5 py-3 bg-[#5B5781] text-white text-sm font-medium rounded-md transition-all duration-200 hover:bg-[#4A4670] shadow-[0_1px_0_rgba(0,0,0,0.06),0_4px_12px_-4px_rgba(91,87,129,0.45)] hover:shadow-[0_1px_0_rgba(0,0,0,0.06),0_8px_20px_-6px_rgba(91,87,129,0.55)] active:translate-y-[1px]"
          >
            <Sparkles className="w-4 h-4 -ml-0.5 transition-transform group-hover:rotate-12" />
            <span>
              Rattraper{' '}
              <span className="font-mono tabular-nums">{remaining.toLocaleString('fr-FR')}</span>{' '}
              {remaining > 1 ? 'manquantes' : 'manquante'}
            </span>
          </button>
        )}
      </div>
    </section>
  )
}
