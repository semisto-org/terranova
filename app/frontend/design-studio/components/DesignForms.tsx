import { FieldsForm } from './AnalysisForms'

// #75 — Rêve & brainstorming
export function ReveBrainstorming({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="design/reve-brainstorming"
      fields={[
        { key: 'reve', label: 'Rêve — no limit' },
        { key: 'projection', label: 'Projection à 10–15 ans' },
      ]}
    />
  )
}

// #76 — Design fonctionnel
export function DesignFonctionnel({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="design/design-fonctionnel"
      fields={[
        { key: 'elements_fonctions', label: 'Éléments distribués sur les fonctions et sous-fonctions' },
      ]}
    />
  )
}

// #77 — Secteurs / zones / bordures : flux & cycles
export function FluxCycles({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="design/secteurs-zones-bordures"
      fields={[
        { key: 'flux', label: 'Flux internes et externes (humains, animaux, récoltes, financiers, eau)' },
        { key: 'cycles', label: 'Cycles (énergie, eau, carbone/azote)' },
      ]}
    />
  )
}

// #78 — Renforcement (éco)systémique & évaluation des options (deux sous-sections)
export function RenforcementSystemique({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="design/renforcement-systemique"
      fields={[
        { key: 'proteger_reguler', label: 'Protéger, réguler' },
        { key: 'agrader', label: 'Agrader (eau, sol, biodiversité)' },
        { key: 'combiner', label: 'Combiner (productions, fonctions)' },
        { key: 'entretenir', label: 'Entretenir (accès, outils)' },
      ]}
    />
  )
}

export function EvaluerOptions({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="design/evaluer-options"
      fields={[
        { key: 'biosourcees', label: 'Options biosourcées (naturelles, renouvelables, locales, low-tech)' },
        { key: 'interactions', label: 'Interactions systémiques (résilience, robustesse)' },
      ]}
    />
  )
}

// #79 — Plans & modélisation (le plan spatial existant est réutilisé via deep-link)
export function PlansModelisation({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="design/plans-modelisation"
      fields={[
        { key: 'logique', label: 'Plan logique' },
        { key: 'chronologique', label: 'Plan chronologique / stratégies' },
        { key: 'moodboard', label: 'Moodboard (liens / références visuelles)' },
        { key: 'financier', label: 'Plan financier' },
      ]}
    />
  )
}

// #80 — Palette végétale guidée (complète l'outil Palette existant, accessible en deep-link)
export function PaletteGuidee({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="design/selection-palette"
      fields={[
        { key: 'diversification', label: 'Diversification raisonnée (morphologie/strates, saisonnalité, redondance, rationalité)' },
        { key: 'estimation_court_terme', label: 'Estimation nb de plants / production — court terme' },
        { key: 'estimation_long_terme', label: 'Estimation nb de plants / production — long terme' },
      ]}
    />
  )
}
