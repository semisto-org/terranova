import { useState, type CSSProperties } from 'react'
import { Check, Copy } from 'lucide-react'

export interface TableTotalsFooterTotals {
  exclVat: number
  vat6: number
  vat12: number
  vat21: number
  intracom6: number
  intracom21: number
  inclVat: number
}

export interface TableTotalsFooterProps {
  leftColSpan: number
  rightColSpan?: number
  filteredCount: number
  isFiltered: boolean
  totals: TableTotalsFooterTotals
  density: 'compact' | 'comfort'
}

const fmtMoney = (value: number) =>
  `${Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

const fmtRaw = (value: number) =>
  Number(value || 0)
    .toFixed(2)
    .replace('.', ',')

const FOOTER_STYLE: CSSProperties = { boxShadow: '0 -1px 0 0 rgb(231 229 228)' }

export function TableTotalsFooter({
  leftColSpan,
  rightColSpan = 1,
  filteredCount,
  isFiltered,
  totals,
  density,
}: TableTotalsFooterProps) {
  const pad = density === 'compact' ? 'py-2.5' : 'py-3.5'
  const fontSize = density === 'compact' ? 'text-[13px]' : 'text-sm'
  const cellBase = `px-3 ${pad} ${fontSize} text-right font-mono tabular-nums whitespace-nowrap`

  return (
    <tfoot
      className="sticky bottom-0 z-10 bg-stone-50/95 backdrop-blur border-t-2 border-stone-300"
      style={FOOTER_STYLE}
    >
      <tr className="text-stone-900">
        <td
          colSpan={leftColSpan}
          className={`pl-4 pr-3 ${pad} text-[10px] uppercase tracking-[0.16em] text-stone-500 font-semibold`}
        >
          Total · <span className="font-mono normal-case tracking-normal text-stone-700">{filteredCount}</span>{' '}
          ligne{filteredCount > 1 ? 's' : ''}
          {isFiltered && <span className="ml-1 normal-case tracking-normal text-stone-400">(filtrées)</span>}
        </td>
        <FooterAmount value={totals.exclVat} label="Total HT" cellBase={cellBase} alwaysShow strong />
        <FooterAmount value={totals.vat6} label="Total TVA 6%" cellBase={cellBase} />
        <FooterAmount value={totals.vat12} label="Total TVA 12%" cellBase={cellBase} />
        <FooterAmount value={totals.vat21} label="Total TVA 21%" cellBase={cellBase} />
        <FooterAmount value={totals.intracom6} label="Total Intracom 6%" cellBase={cellBase} />
        <FooterAmount value={totals.intracom21} label="Total Intracom 21%" cellBase={cellBase} />
        <FooterAmount value={totals.inclVat} label="Total TTC" cellBase={cellBase} alwaysShow strong />
        {rightColSpan > 0 && <td colSpan={rightColSpan} className="pr-4" />}
      </tr>
    </tfoot>
  )
}

function FooterAmount({
  value,
  label,
  cellBase,
  alwaysShow = false,
  strong = false,
}: {
  value: number
  label: string
  cellBase: string
  alwaysShow?: boolean
  strong?: boolean
}) {
  const [copied, setCopied] = useState(false)

  if (!alwaysShow && value <= 0) {
    return (
      <td className={`${cellBase} text-stone-300`} title={label}>
        —
      </td>
    )
  }

  const handleCopy = async () => {
    const raw = fmtRaw(value)
    try {
      await navigator.clipboard.writeText(raw)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // clipboard API may be unavailable (e.g. http context) — silently no-op
    }
  }

  const colorClass = strong ? 'text-stone-900 font-semibold' : 'text-stone-700 font-semibold'

  return (
    <td className={cellBase} title={`${label} — cliquer pour copier la valeur brute`}>
      <button
        type="button"
        onClick={handleCopy}
        className={`group/copy relative inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -my-0.5 cursor-pointer transition-colors hover:bg-[#5B5781]/10 ${
          copied ? 'bg-emerald-100/70' : ''
        } ${colorClass}`}
        aria-label={`Copier ${label}`}
      >
        <span>{fmtMoney(value)}</span>
        {copied ? (
          <Check className="w-3 h-3 text-emerald-600" strokeWidth={2.5} />
        ) : (
          <Copy className="w-3 h-3 text-stone-300 opacity-0 group-hover/copy:opacity-100 transition-opacity" strokeWidth={2} />
        )}
      </button>
    </td>
  )
}
