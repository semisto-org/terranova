import type { FundingProposal } from '../types'

interface FundingProposalCardProps {
  proposal: FundingProposal
  onFund?: () => void
  onView?: () => void
}

export function FundingProposalCard({ proposal, onFund, onView }: FundingProposalCardProps) {
  const isFunded = proposal.status === 'funded'
  const isNew = proposal.status === 'new'
  const remaining = proposal.targetAmount - proposal.raisedAmount

  return (
    <div
      className={`
        group relative rounded-2xl overflow-hidden
        bg-white dark:bg-stone-900
        border border-stone-200/80 dark:border-stone-800
        transition-all duration-300
        hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-stone-950/50
        ${isFunded ? 'opacity-75' : ''}
      `}
    >
      {/* Status indicator */}
      {isNew && (
        <div className="absolute top-4 left-4 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: '#AFBD00' }}>
          Nouveau
        </div>
      )}
      {isFunded && (
        <div className="absolute top-4 left-4 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white">
          Financé
        </div>
      )}

      {/* Image placeholder */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-12 h-12 text-stone-300 dark:text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
          </svg>
        </div>

        {/* Lab badge */}
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm text-xs font-medium text-stone-600 dark:text-stone-300">
          {proposal.labName}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1.5 leading-snug line-clamp-2">
          {proposal.title}
        </h3>

        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 line-clamp-2">
          {proposal.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {proposal.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-4 text-xs text-stone-400 dark:text-stone-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {proposal.location}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/50">
            <div className="text-sm font-bold text-stone-900 dark:text-white">{proposal.hectares}</div>
            <div className="text-[10px] text-stone-400">ha</div>
          </div>
          <div className="py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/50">
            <div className="text-sm font-bold text-stone-900 dark:text-white">{proposal.treesPlanned}</div>
            <div className="text-[10px] text-stone-400">arbres</div>
          </div>
          <div className="py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/50">
            <div className="text-sm font-bold text-stone-900 dark:text-white">{proposal.contributorsCount}</div>
            <div className="text-[10px] text-stone-400">mécènes</div>
          </div>
        </div>

        {/* Funding progress */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-lg font-bold text-stone-900 dark:text-white">
              {proposal.raisedAmount.toLocaleString('fr-BE')} €
            </span>
            <span className="text-sm text-stone-400 dark:text-stone-500">
              sur {proposal.targetAmount.toLocaleString('fr-BE')} €
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${proposal.raisedPercent}%`,
                background: isFunded
                  ? '#22c55e'
                  : `linear-gradient(90deg, #5B5781, #7b77a1)`,
              }}
            />
          </div>
          {!isFunded && remaining > 0 && (
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">
              Il manque {remaining.toLocaleString('fr-BE')} € — échéance {new Date(proposal.deadline).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Actions */}
        {!isFunded ? (
          <div className="flex gap-2">
            <button
              onClick={onFund}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
              style={{ background: '#5B5781' }}
            >
              Financer ce projet
            </button>
            <button
              onClick={onView}
              className="py-2.5 px-3 rounded-xl text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border border-stone-200 dark:border-stone-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Objectif atteint
          </div>
        )}
      </div>
    </div>
  )
}
