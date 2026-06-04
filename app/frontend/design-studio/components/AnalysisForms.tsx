import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../lib/api'

type SectionData = Record<string, unknown>

// Hook générique : lit/écrit le `data` JSONB d'une sous-section d'analyse.
function useAnalysisSection(projectId: string, nodeKey: string): [SectionData, (next: SectionData) => void] {
  const [data, setData] = useState<SectionData>({})

  useEffect(() => {
    apiRequest(`/api/v1/design/${projectId}/analysis-sections`)
      .then((map) => setData(map[nodeKey] ?? {}))
      .catch(() => {})
  }, [projectId, nodeKey])

  const save = useCallback(
    (next: SectionData) => {
      setData(next)
      apiRequest(`/api/v1/design/${projectId}/analysis-section`, {
        method: 'PATCH',
        body: JSON.stringify({ node_key: nodeKey, data: next }),
      }).catch(() => {})
    },
    [projectId, nodeKey],
  )

  return [data, save]
}

interface Field {
  key: string
  label: string
}

// Formulaire générique : une zone de texte par champ, sauvegarde au blur.
function FieldsForm({ projectId, nodeKey, fields }: { projectId: string; nodeKey: string; fields: Field[] }) {
  const [data, save] = useAnalysisSection(projectId, nodeKey)

  return (
    <div className="mt-3 space-y-2 rounded-xl bg-stone-50 p-3">
      {fields.map((f) => (
        <label key={f.key} className="block">
          <span className="mb-1 block text-[12px] font-medium text-stone-600">{f.label}</span>
          <textarea
            defaultValue={(data[f.key] as string) ?? ''}
            onBlur={(e) => {
              if (e.target.value !== ((data[f.key] as string) ?? '')) save({ ...data, [f.key]: e.target.value })
            }}
            rows={2}
            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-700 focus:border-[#AFBD00] focus:ring-1 focus:ring-[#AFBD00]"
          />
        </label>
      ))}
    </div>
  )
}

// #64 — Tri des données
export function TriDonnees({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="analyse-evaluation/tri-des-donnees"
      fields={[
        { key: 'porteur', label: 'Porteur — éléments retenus' },
        { key: 'projet', label: 'Projet — éléments retenus' },
        { key: 'ecosysteme', label: 'Écosystème — éléments retenus' },
      ]}
    />
  )
}

// #67 — Biome
export function Biome({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="analyse-evaluation/biome"
      fields={[
        { key: 'climat_rusticite', label: 'Climat / zone de rusticité' },
        { key: 'succession_especes_cles', label: 'Succession écologique — espèces clés' },
        { key: 'sous_sol', label: 'Sous-sol' },
      ]}
    />
  )
}

// #68 — Échelle de temps
export function EchelleTemps({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="analyse-evaluation/echelle-de-temps"
      fields={[
        { key: 'historique', label: 'Historique du site' },
        { key: 'planning_design', label: 'Planning — design' },
        { key: 'planning_mise_en_oeuvre', label: 'Planning — mise en œuvre' },
        { key: 'planning_maintenance', label: 'Planning — maintenance' },
      ]}
    />
  )
}

// #69 — Ressources & facteurs limitants
export function RessourcesLimites({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="analyse-evaluation/ressources-facteurs-limitants"
      fields={[
        { key: 'temps', label: 'Temps' },
        { key: 'argent', label: 'Argent' },
        { key: 'ressources_humaines', label: 'Ressources humaines' },
        { key: 'matieres', label: 'Matières disponibles (sur site / hors site)' },
      ]}
    />
  )
}

// #70 — Systémique en place : fleur permaculturelle (auto-évaluation) + carte mentale
const FLEUR_DOMAINES = [
  'Terre & nature',
  'Habitat & construction',
  'Outils & technologie',
  'Culture & éducation',
  'Santé & spiritualité',
  'Finance & économie',
  'Patrimoine & communauté',
]

export function SystemiqueEnPlace({ projectId }: { projectId: string }) {
  const nodeKey = 'analyse-evaluation/systemique-en-place'
  const [data, save] = useAnalysisSection(projectId, nodeKey)
  const fleur = (data.fleur as Record<string, number>) ?? {}

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-stone-50 p-3">
      <div>
        <p className="mb-1 text-[12px] font-medium text-stone-600">Fleur permaculturelle — maturité (0–5)</p>
        <div className="space-y-1.5">
          {FLEUR_DOMAINES.map((domaine) => (
            <div key={domaine} className="flex items-center gap-2">
              <span className="w-44 shrink-0 text-[12px] text-stone-600">{domaine}</span>
              <input
                type="range"
                min={0}
                max={5}
                value={fleur[domaine] ?? 0}
                onChange={(e) => save({ ...data, fleur: { ...fleur, [domaine]: Number(e.target.value) } })}
                className="flex-1 accent-[#AFBD00]"
              />
              <span className="w-4 text-right text-[12px] text-stone-500">{fleur[domaine] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-1 block text-[12px] font-medium text-stone-600">Carte mentale (lien ou notes)</span>
        <textarea
          defaultValue={(data.carte_mentale as string) ?? ''}
          onBlur={(e) => {
            if (e.target.value !== ((data.carte_mentale as string) ?? '')) save({ ...data, carte_mentale: e.target.value })
          }}
          rows={2}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-700 focus:border-[#AFBD00] focus:ring-1 focus:ring-[#AFBD00]"
        />
      </label>
    </div>
  )
}
