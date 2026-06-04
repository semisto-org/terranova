import { FieldsForm, useAnalysisSection } from './AnalysisForms'

const SUCCESSION_STRATEGIES = [
  { key: 'tout-en-une-fois', label: 'Tout en une fois (Antoine Talin)' },
  { key: 'successionnelle', label: 'Successionnelle (Desjours, van Eck)' },
  { key: 'incrementielle', label: 'Incrémentielle (Martin Crawford)' },
]

// #81 — Phasage & stratégies de succession
export function Phaser({ projectId }: { projectId: string }) {
  const [data, save] = useAnalysisSection(projectId, 'mise-en-oeuvre-maintenance/phaser')
  const strategy = (data.strategy as string) ?? ''

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-stone-50 p-3">
      <div>
        <p className="mb-1.5 text-[12px] font-medium text-stone-600">Stratégie de succession</p>
        <div className="space-y-1">
          {SUCCESSION_STRATEGIES.map((s) => (
            <label key={s.key} className="flex items-center gap-2 text-[13px] text-stone-700">
              <input
                type="radio"
                name={`succession-${projectId}`}
                checked={strategy === s.key}
                onChange={() => save({ ...data, strategy: s.key })}
                className="accent-[#AFBD00]"
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-1 block text-[12px] font-medium text-stone-600">Phasage (échelle de permanence)</span>
        <textarea
          defaultValue={(data.phasage as string) ?? ''}
          onBlur={(e) => e.target.value !== ((data.phasage as string) ?? '') && save({ ...data, phasage: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-700 focus:border-[#AFBD00] focus:ring-1 focus:ring-[#AFBD00]"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-medium text-stone-600">Productions combinées (canopée ouverte / intermédiaire / mature)</span>
        <textarea
          defaultValue={(data.productions_combinees as string) ?? ''}
          onBlur={(e) =>
            e.target.value !== ((data.productions_combinees as string) ?? '') &&
            save({ ...data, productions_combinees: e.target.value })
          }
          rows={2}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-700 focus:border-[#AFBD00] focus:ring-1 focus:ring-[#AFBD00]"
        />
      </label>
    </div>
  )
}

// #82 — Gestion du projet (planning/budget restent accessibles via Tasks/Timesheets/Bucket en deep-link)
export function GestionProjet({ projectId }: { projectId: string }) {
  return (
    <FieldsForm
      projectId={projectId}
      nodeKey="mise-en-oeuvre-maintenance/gestion-du-projet"
      fields={[
        { key: 'gouvernance', label: 'Gouvernance' },
        { key: 'communication', label: 'Communication' },
        { key: 'budget_notes', label: "Budget (achats, main d'œuvre, autoproduction de plants)" },
        { key: 'entretien', label: 'Entretien (STUN, taille, récolte)' },
      ]}
    />
  )
}
