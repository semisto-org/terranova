import { FieldsForm, useAnalysisSection } from './AnalysisForms'

// #71 — Analyse fonctionnelle
export function AnalyseFonctionnelle({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="positionnement/analyse-fonctionnelle"
      fields={[
        { key: 'besoins', label: 'Besoins' },
        { key: 'fonctions_cle', label: 'Fonctions-clé et productions' },
      ]}
    />
  )
}

// #72 — Positionnement dans l'écosystème
export function PositionnementEcosysteme({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="positionnement/positionnement-ecosysteme"
      fields={[
        { key: 'raison_d_etre', label: "Raison d'être" },
        { key: 'fil_conducteur', label: 'Fil conducteur' },
      ]}
    />
  )
}

// #74 — Stratégies
export function Strategies({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="positionnement/strategies"
      fields={[{ key: 'logique_d_action', label: "Logique d'action" }]}
    />
  )
}

// #73 — Positionnement par rapport aux contraintes : outil à curseurs sur les spectres documentés.
const SPECTRUMS = [
  { key: 'echelle', label: 'Échelle (socio-technique)', left: 'Petite', right: 'Grande' },
  { key: 'modele_eco', label: 'Modèle économique', left: 'Autonomie', right: 'Commercial' },
  { key: 'technologie', label: 'Outils & technologie', left: 'Low tech', right: 'High tech' },
  { key: 'historique', label: 'Historique', left: 'Vierge', right: 'Planté' },
  { key: 'sante', label: 'Santé', left: 'Pro-bio', right: 'Anti-bio' },
]

export function ContraintesCurseurs({ projectId }: { projectId: string }) {
  const [data, save] = useAnalysisSection(projectId, 'positionnement/positionnement-contraintes')
  const spectrums = (data.spectrums as Record<string, number>) ?? {}

  return (
    <div className="mt-3 space-y-2.5 rounded-xl bg-stone-50 p-3">
      <p className="text-[12px] font-medium text-stone-600">Positionnement sur les spectres de contraintes</p>
      {SPECTRUMS.map((s) => (
        <div key={s.key}>
          <div className="mb-0.5 flex justify-between text-[11px] text-stone-500">
            <span>{s.left}</span>
            <span className="font-medium text-stone-600">{s.label}</span>
            <span>{s.right}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={spectrums[s.key] ?? 50}
            onChange={(e) => save({ ...data, spectrums: { ...spectrums, [s.key]: Number(e.target.value) } })}
            className="w-full accent-[#AFBD00]"
          />
        </div>
      ))}
    </div>
  )
}
