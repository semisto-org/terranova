import { FieldsForm } from './AnalysisForms'

// #83 — Boucles de rétroaction (la Co-gestion reste accessible en deep-link)
export function BouclesRetroaction({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="evolution/observation-retroaction"
      fields={[{ key: 'boucles_retroaction', label: 'Boucles de rétroaction observées (post-implantation)' }]}
    />
  )
}

// #84 — Visualisation des impacts (graphes santé/production : enrichissement possible depuis la Co-gestion)
export function VisualisationImpacts({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="evolution/visualisation"
      fields={[{ key: 'impacts', label: 'Impacts à moyen et long terme' }]}
    />
  )
}

// #85 — Anticipation & accélération
export function Anticipation({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="evolution/anticipation"
      fields={[{ key: 'adaptation', label: 'Adaptation (agilité, re-design)' }]}
    />
  )
}

export function AccelererProcessus({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="evolution/accelerer-processus"
      fields={[
        { key: 'redesign', label: 'Redesign écosystémique' },
        { key: 'upscaling', label: 'Upscaling' },
      ]}
    />
  )
}
