import { useState } from 'react'
import type { PartnerPortalProps } from '../types'
import { PortalHeader } from './PortalHeader'
import { MetricCard } from './MetricCard'
import { PackageCard } from './PackageCard'
import { FundingProposalCard } from './FundingProposalCard'
import { EngagementCard } from './EngagementCard'
import { EngagementTimeline } from './EngagementTimeline'

export function PartnerPortal({
  partner,
  packages,
  engagements,
  fundingProposals,
  fundings,
  impactMetrics,
  onPackageInterest,
  onPackageView,
  onFundProposal,
  onProposalView,
  onEngagementView,
  onDocumentDownload,
  onExportPdf,
  onContactSemisto,
}: PartnerPortalProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedEngagementId, setSelectedEngagementId] = useState<string | null>(null)

  const activeEngagements = engagements.filter(e => e.status === 'active')
  const completedEngagements = engagements.filter(e => e.status === 'completed')
  const selectedEngagement = engagements.find(e => e.id === selectedEngagementId)
  const openProposals = fundingProposals.filter(p => p.status === 'open' || p.status === 'new')
  const totalFunded = fundings.reduce((sum, f) => sum + f.amount, 0)

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <PortalHeader
        partner={partner}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          setSelectedEngagementId(null)
        }}
        onExportPdf={onExportPdf}
        onContactSemisto={onContactSemisto}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ============================================================ */}
        {/* DASHBOARD TAB */}
        {/* ============================================================ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-10">
            {/* Welcome section */}
            <section className="relative overflow-hidden rounded-3xl p-8 sm:p-10" style={{ background: 'linear-gradient(135deg, #5B5781 0%, #3d3a57 60%, #2d2b3d 100%)' }}>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 -translate-y-1/3 translate-x-1/3" style={{ background: 'radial-gradient(circle, #AFBD00 0%, transparent 70%)' }} />
              <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full opacity-5 translate-y-1/2 -translate-x-1/4" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />

              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <p className="text-white/50 text-sm mb-1">Bienvenue,</p>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">
                      {partner.name}
                    </h1>
                    <p className="text-white/60 text-sm mt-2 max-w-xl">
                      {partner.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onExportPdf}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-all active:scale-[0.97] backdrop-blur-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Exporter rapport RSE
                    </button>
                  </div>
                </div>

                {/* Quick stats in hero */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { value: `${impactMetrics.totalInvested.toLocaleString('fr-BE')} €`, label: 'Investis' },
                    { value: impactMetrics.treesPlanted.toLocaleString('fr-BE'), label: 'Arbres plantés' },
                    { value: `${impactMetrics.hectaresContributed} ha`, label: 'Hectares' },
                    { value: impactMetrics.projectsSupported.toString(), label: 'Projets soutenus' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                      <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-white/50 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Impact Metrics */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Votre impact</h2>
                <button
                  onClick={onExportPdf}
                  className="text-sm font-medium flex items-center gap-1.5 transition-colors hover:opacity-80"
                  style={{ color: '#5B5781' }}
                >
                  Télécharger PDF
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <MetricCard
                  value={impactMetrics.treesPlanted}
                  label="Arbres plantés"
                  color="#22c55e"
                  bgColor="#f0fdf4"
                  delay={0}
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
                />
                <MetricCard
                  value={impactMetrics.hectaresContributed}
                  label="Hectares contribués"
                  unit="ha"
                  format="decimal"
                  color="#AFBD00"
                  bgColor="#f7f8e8"
                  delay={100}
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
                />
                <MetricCard
                  value={impactMetrics.co2OffsetTons}
                  label="CO₂ compensé"
                  unit="t"
                  format="decimal"
                  color="#5B5781"
                  bgColor="#eee8f5"
                  delay={200}
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <MetricCard
                  value={impactMetrics.participantsMobilized}
                  label="Participants mobilisés"
                  color="#f59e0b"
                  bgColor="#fffbeb"
                  delay={300}
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
                <MetricCard
                  value={impactMetrics.labsReached}
                  label="Labs soutenus"
                  color="#6366f1"
                  bgColor="#eef2ff"
                  delay={400}
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                />
              </div>
            </section>

            {/* Active Engagements Summary */}
            {activeEngagements.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white">
                    Engagements en cours
                    <span className="ml-2 text-sm font-normal text-stone-400">({activeEngagements.length})</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab('engagements')}
                    className="text-sm font-medium flex items-center gap-1 transition-colors hover:opacity-80"
                    style={{ color: '#5B5781' }}
                  >
                    Voir tout
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeEngagements.map(eng => (
                    <EngagementCard
                      key={eng.id}
                      engagement={eng}
                      onView={() => {
                        setSelectedEngagementId(eng.id)
                        setActiveTab('engagements')
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Featured proposals */}
            {openProposals.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white">
                    Projets à financer
                  </h2>
                  <button
                    onClick={() => setActiveTab('funding')}
                    className="text-sm font-medium flex items-center gap-1 transition-colors hover:opacity-80"
                    style={{ color: '#5B5781' }}
                  >
                    Voir tout
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {openProposals.slice(0, 3).map(proposal => (
                    <FundingProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      onFund={() => onFundProposal?.(proposal.id, 0)}
                      onView={() => onProposalView?.(proposal.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Quick actions */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('packages')}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ background: '#AFBD00' }}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-stone-900 dark:text-white text-sm">Explorer les packages</h3>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{packages.length} offres disponibles</p>
                </div>
                <svg className="w-5 h-5 text-stone-300 dark:text-stone-600 ml-auto transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => setActiveTab('funding')}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ background: '#5B5781' }}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-stone-900 dark:text-white text-sm">Financer un projet</h3>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{openProposals.length} projets en recherche</p>
                </div>
                <svg className="w-5 h-5 text-stone-300 dark:text-stone-600 ml-auto transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={onContactSemisto}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-xl bg-stone-800 dark:bg-stone-200 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                  <svg className="w-6 h-6 text-white dark:text-stone-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-stone-900 dark:text-white text-sm">Contacter Semisto</h3>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Proposer un projet sur mesure</p>
                </div>
                <svg className="w-5 h-5 text-stone-300 dark:text-stone-600 ml-auto transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </section>
          </div>
        )}

        {/* ============================================================ */}
        {/* PACKAGES TAB */}
        {/* ============================================================ */}
        {activeTab === 'packages' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-2">
                Nos packages partenaires
              </h1>
              <p className="text-stone-500 dark:text-stone-400 max-w-2xl">
                Choisissez l'engagement qui correspond à votre vision RSE. Chaque package est personnalisable selon vos besoins et votre budget.
              </p>
            </div>

            {/* Highlighted packages */}
            {packages.filter(p => p.highlighted).length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4">
                  Recommandés
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {packages.filter(p => p.highlighted).map(pkg => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      onInterest={() => onPackageInterest?.(pkg.id)}
                      onView={() => onPackageView?.(pkg.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All packages */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4">
                Tous les packages
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {packages.filter(p => !p.highlighted).map(pkg => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    onInterest={() => onPackageInterest?.(pkg.id)}
                    onView={() => onPackageView?.(pkg.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* FUNDING TAB */}
        {/* ============================================================ */}
        {activeTab === 'funding' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-2">
                Financer un projet
              </h1>
              <p className="text-stone-500 dark:text-stone-400 max-w-2xl">
                Parcourez les propositions de projets publiées par les Labs Semisto et allouez vos fonds aux initiatives qui vous inspirent.
              </p>
            </div>

            {/* Funding summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5">
                <div className="text-sm text-stone-400 dark:text-stone-500 mb-1">Total financé</div>
                <div className="text-2xl font-bold text-stone-900 dark:text-white">{totalFunded.toLocaleString('fr-BE')} €</div>
              </div>
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5">
                <div className="text-sm text-stone-400 dark:text-stone-500 mb-1">Projets financés</div>
                <div className="text-2xl font-bold text-stone-900 dark:text-white">{fundings.length}</div>
              </div>
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5">
                <div className="text-sm text-stone-400 dark:text-stone-500 mb-1">Propositions ouvertes</div>
                <div className="text-2xl font-bold text-stone-900 dark:text-white">{openProposals.length}</div>
              </div>
            </div>

            {/* Collaborative Funding Steps */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6">
              <h3 className="font-semibold text-stone-900 dark:text-white mb-4 text-sm">
                Comment fonctionne le financement collaboratif ?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {[
                  { step: 1, title: 'Gouvernance', desc: 'Définir le modèle de décision' },
                  { step: 2, title: 'Onboarding', desc: 'Intégration et préparation' },
                  { step: 3, title: 'Propositions', desc: 'Découvrir les projets des Labs' },
                  { step: 4, title: 'Allocation', desc: 'Choisir et allouer vos fonds' },
                  { step: 5, title: 'Redevabilité', desc: 'Suivi d\'impact et reporting' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: step <= 3 ? '#5B5781' : '#AFBD00' }}
                    >
                      {step}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-stone-900 dark:text-white">{title}</div>
                      <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Proposals */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4">
                Propositions de projets ({fundingProposals.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {fundingProposals.map(proposal => (
                  <FundingProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onFund={() => onFundProposal?.(proposal.id, 0)}
                    onView={() => onProposalView?.(proposal.id)}
                  />
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl p-6 sm:p-8 text-center" style={{ background: 'linear-gradient(135deg, #5B5781 0%, #3d3a57 100%)' }}>
              <h3 className="text-xl font-bold text-white mb-2">Vous avez un projet en tête ?</h3>
              <p className="text-white/60 text-sm mb-5 max-w-md mx-auto">
                Contactez-nous pour discuter de projets personnalisés ou d'engagements sur mesure.
              </p>
              <button
                onClick={onContactSemisto}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-[#5B5781] bg-white hover:bg-stone-50 transition-all active:scale-[0.97] shadow-lg shadow-black/20"
              >
                Contacter l'équipe Semisto
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ENGAGEMENTS TAB */}
        {/* ============================================================ */}
        {activeTab === 'engagements' && (
          <>
            {selectedEngagement ? (
              <EngagementTimeline
                engagement={selectedEngagement}
                onDocumentDownload={onDocumentDownload}
                onBack={() => setSelectedEngagementId(null)}
              />
            ) : (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-2">
                    Mes engagements
                  </h1>
                  <p className="text-stone-500 dark:text-stone-400">
                    Suivez vos packages activés, consultez les documents et médias partagés par les Labs.
                  </p>
                </div>

                {/* Active engagements */}
                {activeEngagements.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4">
                      En cours ({activeEngagements.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeEngagements.map(eng => (
                        <EngagementCard
                          key={eng.id}
                          engagement={eng}
                          onView={() => setSelectedEngagementId(eng.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed engagements */}
                {completedEngagements.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4">
                      Terminés ({completedEngagements.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {completedEngagements.map(eng => (
                        <EngagementCard
                          key={eng.id}
                          engagement={eng}
                          onView={() => setSelectedEngagementId(eng.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Funding history */}
                {fundings.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4">
                      Historique de financement
                    </h2>
                    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden">
                      <div className="divide-y divide-stone-100 dark:divide-stone-800">
                        {fundings.map(funding => (
                          <div key={funding.id} className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  background: funding.status === 'spent' ? '#22c55e' : '#5B5781',
                                }}
                              />
                              <div>
                                <p className="text-sm font-medium text-stone-900 dark:text-white">
                                  {funding.proposalTitle}
                                </p>
                                <p className="text-xs text-stone-400 dark:text-stone-500">
                                  {funding.labName} — {new Date(funding.date).toLocaleDateString('fr-BE')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-stone-900 dark:text-white">
                                {funding.amount.toLocaleString('fr-BE')} €
                              </p>
                              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: funding.status === 'spent' ? '#22c55e' : '#5B5781' }}>
                                {funding.status === 'allocated' ? 'Alloué' : funding.status === 'spent' ? 'Dépensé' : 'En attente'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {engagements.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">
                      Pas encore d'engagements
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">
                      Explorez nos packages ou financez un projet pour commencer votre parcours.
                    </p>
                    <button
                      onClick={() => setActiveTab('packages')}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
                      style={{ background: '#5B5781' }}
                    >
                      Explorer les packages
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
