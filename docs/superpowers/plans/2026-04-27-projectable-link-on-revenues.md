# Lier les recettes (et toutes les dépenses) à n'importe quel projectable — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre de lier une recette ou une dépense à n'importe quel projectable (PoleProject, Academy::Training, Design::Project, Guild) via un sélecteur unifié, et permettre la modification rapide du projet lié depuis les listes.

**Architecture:** Nouveau composant React partagé `ProjectableCombobox` qui consomme `GET /api/v1/projects` (déjà existant, retourne les 4 types). Nouvelle modale `ProjectableQuickEditModal` pour l'édition rapide depuis les listes. Migration de `ExpenseFormModal` (single-project) vers ce nouveau combobox, ajout dans `RevenueFormModal`. Aucun changement backend nécessaire — `Revenue#projectable` et `Expense#projectable` existent déjà, leurs strong params permettent `:projectable_type, :projectable_id`, et les serializers exposent `projectableType/projectableId/projectName`.

**Tech Stack:** React 18 (TS pour les nouveaux composants), Tailwind CSS 4, lucide-react, fetch via `apiRequest()` depuis `app/frontend/lib/api.js`.

**Spec:** `docs/superpowers/specs/2026-04-27-projectable-link-on-revenues-design.md`

---

## File Structure

**À créer :**
- `app/frontend/components/shared/ProjectableCombobox.tsx` — combobox autonome listant les 4 types projectable.
- `app/frontend/components/shared/ProjectableQuickEditModal.tsx` — modale 1-clic pour éditer le projet lié à une dépense ou recette.

**À modifier :**
- `app/frontend/components/shared/RevenueFormModal.tsx` — ajout section Projet.
- `app/frontend/components/shared/ExpenseFormModal.jsx` — migration vers ProjectableCombobox, fix bug `training_id`/`design_project_id`.
- `app/frontend/lab-management/components/RevenueList.tsx` — typing + cellule "Projet" + intégration modale rapide.
- `app/frontend/lab-management/components/ExpenseList.tsx` — typing + cellule "Projet" + intégration modale rapide (avec fallback formulaire complet pour les dépenses multi-allocations).

**Backend (non touché, mais référencé) :**
- `app/controllers/api/v1/projects_controller.rb#index` — endpoint `GET /api/v1/projects`.
- `app/controllers/api/v1/lab_management_controller.rb` — `expense_params`, `revenue_params`, `serialize_expense`, `serialize_revenue`.
- `app/models/concerns/projectable.rb` — `PROJECT_TYPE_KEYS`.

---

## Task 1 — Créer le composant `ProjectableCombobox`

**Files:**
- Create: `app/frontend/components/shared/ProjectableCombobox.tsx`

- [ ] **Step 1: Créer le fichier avec l'interface, les constantes et le squelette**

Crée `app/frontend/components/shared/ProjectableCombobox.tsx` avec ce contenu :

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import { apiRequest } from '../../lib/api'

// Mapping typeKey (API) ↔ projectable_type (Ruby class). Mirrors
// Projectable::PROJECT_TYPE_KEYS in app/models/concerns/projectable.rb.
const TYPE_KEY_TO_RUBY = {
  'lab-project': 'PoleProject',
  'training': 'Academy::Training',
  'design-project': 'Design::Project',
  'guild': 'Guild',
} as const

const RUBY_TO_TYPE_KEY = {
  PoleProject: 'lab-project',
  'Academy::Training': 'training',
  'Design::Project': 'design-project',
  Guild: 'guild',
} as const

export type ProjectableTypeKey = keyof typeof TYPE_KEY_TO_RUBY
export type ProjectableRubyType = keyof typeof RUBY_TO_TYPE_KEY

export interface ProjectableValue {
  type: ProjectableRubyType
  id: string
}

export interface ProjectableOption {
  id: string
  name: string
  typeKey: ProjectableTypeKey
}

const GROUPS: { typeKey: ProjectableTypeKey; label: string; color: string; bg: string }[] = [
  { typeKey: 'lab-project',    label: 'Lab',           color: '#5B5781', bg: '#e8e5ed' },
  { typeKey: 'training',       label: 'Academy',       color: '#B01A19', bg: '#f5dad3' },
  { typeKey: 'design-project', label: 'Design Studio', color: '#6F7900', bg: '#eef0e0' },
  { typeKey: 'guild',          label: 'Guildes',       color: '#78716C', bg: '#e7e5e4' },
]

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

interface Props {
  value: ProjectableValue | null
  onChange: (value: ProjectableValue | null) => void
  projects?: ProjectableOption[]
  placeholder?: string
  accent?: string
  disabled?: boolean
}

export function ProjectableCombobox({
  value,
  onChange,
  projects: projectsProp,
  placeholder = 'Sélectionner un projet…',
  accent = '#5B5781',
  disabled = false,
}: Props) {
  return null // implemented in following steps
}
```

- [ ] **Step 2: Implémenter le fetch interne et le state local**

Remplace le corps de `ProjectableCombobox` (qui retourne `null`) par cette implémentation qui fetch `/api/v1/projects` quand `projects` n'est pas fourni :

```tsx
  const [fetched, setFetched] = useState<ProjectableOption[] | null>(projectsProp ? null : null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (projectsProp) return
    let cancelled = false
    apiRequest('/api/v1/projects')
      .then((payload: { items?: ProjectableOption[] }) => {
        if (cancelled) return
        setFetched(payload?.items ?? [])
      })
      .catch(() => {
        if (!cancelled) setFetched([])
      })
    return () => { cancelled = true }
  }, [projectsProp])

  const projects: ProjectableOption[] = projectsProp ?? fetched ?? []

  const selected = useMemo(() => {
    if (!value) return null
    const expectedKey = RUBY_TO_TYPE_KEY[value.type]
    return projects.find((p) => p.id === value.id && p.typeKey === expectedKey) ?? null
  }, [projects, value])

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return projects
    return projects.filter((p) => normalize(p.name).includes(q))
  }, [projects, query])

  const grouped = useMemo(() => {
    return GROUPS.map((g) => ({
      ...g,
      items: filtered.filter((p) => p.typeKey === g.typeKey),
    })).filter((g) => g.items.length > 0)
  }, [filtered])

  // Flat list of (group, item) tuples used by keyboard navigation.
  const flatItems = useMemo(
    () => grouped.flatMap((g) => g.items.map((item) => ({ group: g, item }))),
    [grouped]
  )

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => { setHighlight(0) }, [query])

  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector(`[data-index="${highlight}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight, open])

  const handleSelect = (item: ProjectableOption) => {
    onChange({ type: TYPE_KEY_TO_RUBY[item.typeKey], id: item.id })
    setOpen(false)
    setQuery('')
  }

  const handleClear = () => {
    onChange(null)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, flatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flatItems[highlight]) handleSelect(flatItems[highlight].item)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  const selectedGroup = selected ? GROUPS.find((g) => g.typeKey === selected.typeKey) : null

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`w-full pl-3 pr-9 py-2.5 rounded-lg bg-white border text-left transition-all duration-150 focus:outline-none focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          open ? 'border-stone-400 ring-2' : 'border-stone-200 hover:border-stone-300'
        }`}
        style={open ? { borderColor: accent, boxShadow: `0 0 0 2px ${accent}25` } : undefined}
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            {selectedGroup && (
              <span
                className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
                style={{ color: selectedGroup.color, backgroundColor: selectedGroup.bg }}
              >
                {selectedGroup.label}
              </span>
            )}
            <span className="text-stone-900 truncate">{selected.name}</span>
          </span>
        ) : (
          <span className="text-stone-400">{placeholder}</span>
        )}
        <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full rounded-lg bg-white border border-stone-200 shadow-xl overflow-hidden">
          <div className="relative border-b border-stone-100">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Rechercher un projet…"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-stone-400"
            />
          </div>

          <ul ref={listRef} className="max-h-72 overflow-y-auto py-1">
            {value && (
              <li>
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full text-left px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-50 italic flex items-center gap-2"
                >
                  <X className="w-3 h-3" />
                  Aucun projet (effacer)
                </button>
              </li>
            )}
            {flatItems.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-stone-400">
                {projects.length === 0 ? 'Chargement…' : `Aucun projet trouvé pour « ${query} »`}
              </li>
            ) : (
              grouped.map((group) => (
                <li key={group.typeKey}>
                  <div
                    className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-[0.14em] font-semibold"
                    style={{ color: group.color }}
                  >
                    {group.label}
                  </div>
                  <ul>
                    {group.items.map((item) => {
                      const flatIdx = flatItems.findIndex((fi) => fi.item === item)
                      const isSelected = value?.type === TYPE_KEY_TO_RUBY[item.typeKey] && value.id === item.id
                      const isHighlighted = flatIdx === highlight
                      return (
                        <li key={`${item.typeKey}-${item.id}`} data-index={flatIdx}>
                          <button
                            type="button"
                            onMouseEnter={() => setHighlight(flatIdx)}
                            onClick={() => handleSelect(item)}
                            className={`w-full text-left pl-5 pr-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${
                              isHighlighted ? 'bg-stone-100' : 'hover:bg-stone-50'
                            } ${isSelected ? 'font-medium' : 'text-stone-800'}`}
                            style={isSelected ? { color: group.color } : undefined}
                          >
                            <span className="flex-1 truncate">{item.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Vérifier que la compilation TypeScript passe**

Run: `bin/rails runner "puts 'ok'"` (juste pour s'assurer que rien n'est cassé côté Rails) puis vérifier que Vite compile en lançant `bin/dev` et en chargeant `http://localhost:3000/login`. Pas d'erreur de build attendue car le composant n'est pas encore importé ailleurs.

Expected: pas d'erreur dans la console du navigateur, pas d'erreur dans le terminal Vite.

Tu peux aussi lancer `yarn tsc --noEmit` si TypeScript est configuré pour vérifier en standalone.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/components/shared/ProjectableCombobox.tsx
git commit -m "Add ProjectableCombobox shared component for unified project selection"
```

---

## Task 2 — Créer la modale rapide `ProjectableQuickEditModal`

**Files:**
- Create: `app/frontend/components/shared/ProjectableQuickEditModal.tsx`

- [ ] **Step 1: Créer le fichier**

```tsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { apiRequest } from '../../lib/api'
import { ProjectableCombobox, type ProjectableValue } from './ProjectableCombobox'

interface Props {
  entity: { type: 'expense' | 'revenue'; id: string; label?: string | null }
  currentProjectable: ProjectableValue | null
  onSaved: (next: ProjectableValue | null) => void
  onCancel: () => void
}

export function ProjectableQuickEditModal({ entity, currentProjectable, onSaved, onCancel }: Props) {
  const [value, setValue] = useState<ProjectableValue | null>(currentProjectable)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const endpoint = entity.type === 'expense'
    ? `/api/v1/lab/expenses/${entity.id}`
    : `/api/v1/lab/revenues/${entity.id}`

  const handleSave = async () => {
    setBusy(true)
    setError(null)
    try {
      await apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({
          projectable_type: value?.type ?? null,
          projectable_id: value?.id ?? null,
        }),
      })
      onSaved(value)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
      setBusy(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm"
        onClick={busy ? undefined : onCancel}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="px-6 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400 font-medium">
                {entity.type === 'expense' ? 'Dépense' : 'Recette'}
              </p>
              <h2 className="mt-1 font-serif text-lg text-stone-900 leading-tight">
                {entity.label || 'Lier à un projet'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="shrink-0 p-1.5 rounded-md text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors disabled:opacity-50"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="px-6 py-5 space-y-3">
            <label className="block text-[11px] uppercase tracking-[0.12em] text-stone-500 font-medium">
              Projet concerné
            </label>
            <ProjectableCombobox
              value={value}
              onChange={setValue}
              placeholder="Aucun projet (global)"
              disabled={busy}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/40 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="px-4 py-2 rounded-lg font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-[#5B5781] disabled:opacity-60 transition-colors"
            >
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Vérifier que Vite compile sans erreur**

Run: relance ou laisse `bin/dev` tourner, vérifie qu'il n'y a pas d'erreur de compilation dans le terminal Vite.

Expected: aucune erreur. Le composant n'est pas encore monté côté UI.

- [ ] **Step 3: Commit**

```bash
git add app/frontend/components/shared/ProjectableQuickEditModal.tsx
git commit -m "Add ProjectableQuickEditModal for one-click project re-linking"
```

---

## Task 3 — Mettre à jour le typing `RevenueItem` et `ExpenseItem`

**Files:**
- Modify: `app/frontend/lab-management/components/RevenueList.tsx:35-63`
- Modify: `app/frontend/lab-management/components/ExpenseList.tsx:36-67`

- [ ] **Step 1: Mettre à jour `RevenueItem`**

Dans `app/frontend/lab-management/components/RevenueList.tsx`, remplace les lignes 43-44 (`trainingId` et `designProjectId`) :

```ts
// Avant (lignes 43-44):
  trainingId: string | null
  designProjectId: string | null

// Après:
  projectableType: string | null
  projectableId: string | null
  projectName: string | null
```

- [ ] **Step 2: Mettre à jour `ExpenseItem`**

Dans `app/frontend/lab-management/components/ExpenseList.tsx`, remplace les lignes 55-56 (`trainingId` et `designProjectId`) :

```ts
// Avant (lignes 55-56):
  trainingId: string | null
  designProjectId: string | null

// Après:
  projectableType: string | null
  projectableId: string | null
  projectName: string | null
  projectAllocations?: Array<{
    projectableType: string
    projectableId: string
    projectName: string | null
    amount: number
    notes: string
  }>
```

- [ ] **Step 3: Lancer Vite et noter toutes les erreurs TypeScript**

Run: `bin/dev` (si pas déjà lancé) et regarde le terminal Vite pour les erreurs de type.

Expected: erreurs dans plusieurs fichiers consommateurs (`RevenueFormModal.tsx`, `RevenueDetailModal.tsx`, `BankSection.tsx`, `ExpenseFormModal.jsx` éventuellement, `ContactDetail.tsx`, etc.). Note les fichiers qui se plaignent — ils seront traités dans les tâches suivantes ou en ad-hoc.

- [ ] **Step 4: Patcher les références cassées qui ne seront pas refaites par d'autres tâches**

Pour chaque fichier qui accède encore à `.trainingId` ou `.designProjectId` sur un `RevenueItem`/`ExpenseItem` ET qui n'est PAS l'un de ces fichiers traités plus loin :
- `RevenueFormModal.tsx` — Task 5
- `ExpenseFormModal.jsx` — Task 6
- `RevenueList.tsx` — Task 7
- `ExpenseList.tsx` — Task 8

… remplace les accès en utilisant `projectableType === 'Academy::Training' ? projectableId : null` (équivalent legacy de `trainingId`) ou `projectableType === 'Design::Project' ? projectableId : null`. C'est un correctif ponctuel pour ne pas casser les autres consommateurs ; ces fichiers ne sont pas dans le scope de ce plan.

Recherche les sites :

```bash
grep -rn "\.trainingId\|\.designProjectId" app/frontend/ \
  | grep -v "ExpenseFormModal\|RevenueFormModal\|RevenueList\|ExpenseList"
```

Pour chaque ligne renvoyée, remplace l'accès. Exemple typique dans un fichier comme `RevenueDetailModal.tsx` :

```ts
// Avant
{revenue.trainingId && <span>Formation: {revenue.trainingId}</span>}

// Après
{revenue.projectableType === 'Academy::Training' && revenue.projectableId && (
  <span>Formation: {revenue.projectName}</span>
)}
```

Si un fichier ne fait que lire `revenue.trainingId` sans en faire un usage métier (ex: simple flag de présence), une transformation `Boolean(revenue.projectableId)` suffit.

- [ ] **Step 5: Vérifier que Vite ne renvoie plus d'erreur**

Expected: terminal Vite propre. La page peut encore avoir des bugs visuels mais doit charger.

- [ ] **Step 6: Commit**

```bash
git add app/frontend/lab-management/components/RevenueList.tsx app/frontend/lab-management/components/ExpenseList.tsx app/frontend/
git commit -m "Sync RevenueItem/ExpenseItem types with backend serializer (projectable*)"
```

---

## Task 4 — Smoke-tester les endpoints serializers (filet de sécurité)

**Files:** aucun (smoke test).

Cette tâche applique la règle CLAUDE.md "Refactoring: mandatory endpoint verification" : on a touché au typing des données retournées par plusieurs endpoints, on vérifie qu'ils renvoient bien `projectableType`/`projectableId`/`projectName`.

- [ ] **Step 1: Démarrer le serveur Rails s'il n'est pas déjà actif**

Run: `bin/dev` (si déjà lancé, OK).

- [ ] **Step 2: Vérifier `GET /api/v1/projects`**

Connecte-toi via l'UI puis depuis la console du navigateur :

```js
fetch('/api/v1/projects', { credentials: 'same-origin' })
  .then(r => r.json())
  .then(data => console.log(data.items?.slice(0, 3)))
```

Expected: liste avec au moins un item ayant `{ id, name, typeKey: 'lab-project'|'training'|'design-project'|'guild' }`.

- [ ] **Step 3: Vérifier `GET /api/v1/lab/expenses`**

```js
fetch('/api/v1/lab/expenses', { credentials: 'same-origin' })
  .then(r => r.json())
  .then(data => console.log(data.items?.[0]))
```

Expected: l'item contient les clés `projectableType`, `projectableId`, `projectName` (peuvent être `null`).

- [ ] **Step 4: Vérifier `GET /api/v1/lab/revenues`**

```js
fetch('/api/v1/lab/revenues', { credentials: 'same-origin' })
  .then(r => r.json())
  .then(data => console.log(data.items?.[0]))
```

Expected: idem, présence des clés `projectableType`, `projectableId`, `projectName`.

- [ ] **Step 5: Pas de commit (étape de vérification uniquement)**

Si une étape ci-dessus échoue, stop et investigue : la suite du plan suppose que ces clés sont bien exposées par le serializer.

---

## Task 5 — Ajouter le sélecteur de projet dans `RevenueFormModal`

**Files:**
- Modify: `app/frontend/components/shared/RevenueFormModal.tsx`

- [ ] **Step 1: Importer `ProjectableCombobox` et `ProjectableValue`**

En haut du fichier (vers ligne 3, après l'import de `RevenueItem`) :

```tsx
import { ProjectableCombobox, type ProjectableValue } from './ProjectableCombobox'
```

- [ ] **Step 2: Ajouter `projectable` au state initial**

Dans `RevenueFormModal`, étend le state `form` (ligne ~90) en ajoutant un champ `projectable` :

```tsx
  const [form, setForm] = useState({
    date: today,
    status: 'draft' as Status,
    pole: '',
    contact_id: '',
    label: '',
    description: '',
    category: '',
    revenue_type: '',
    amount_excl_vat_str: '',
    vat_rate: '',
    payment_method: '',
    paid_at: '',
    invoice_url: '',
    vat_exemption: false,
    notes: '',
    organization_id: '',
    projectable: null as ProjectableValue | null,
  })
```

- [ ] **Step 3: Initialiser `projectable` depuis `revenue` lors d'une édition**

Dans le `useEffect` (ligne ~114) qui hydrate `form` depuis `revenue`, ajoute après les autres champs :

```tsx
        organization_id: (revenue as RevenueItem & { organizationId?: string }).organizationId || defaultOrganizationId || '',
        projectable: revenue.projectableType && revenue.projectableId
          ? { type: revenue.projectableType as ProjectableValue['type'], id: revenue.projectableId }
          : null,
```

- [ ] **Step 4: Ajouter la section "Projet" dans le markup**

Insère cette nouvelle section juste après la fermeture de la section "Description" (après la `</section>` qui clôt le bloc Description, et avant le `<Collapsible label="Paiement"`) :

```tsx
              {/* PROJET — lien optionnel vers un projectable */}
              <section>
                <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium mb-2">
                  Projet
                </div>
                <ProjectableCombobox
                  value={form.projectable}
                  onChange={(v) => update('projectable', v)}
                  placeholder="Sélectionner un projet (optionnel — sinon recette globale)"
                  accent="#5B5781"
                />
              </section>
```

- [ ] **Step 5: Inclure `projectable_type` / `projectable_id` dans le payload `onSave`**

Dans `handleSubmit`, étend l'objet `data` (avant les `if (form.contact_id)` lignes ~210) :

```tsx
    const data: Record<string, unknown> = {
      // ...champs existants inchangés...
      vat_exemption: form.vat_exemption,
      notes: form.notes || '',
      projectable_type: form.projectable?.type ?? null,
      projectable_id: form.projectable?.id ?? null,
    }
```

- [ ] **Step 6: Tester manuellement la création d'une recette liée à chaque type de projet**

Lance `bin/dev` et va sur `http://localhost:3000/` → Settings (admin) → Recettes (ou autre page qui ouvre `RevenueFormModal`).

Pour chaque type (PoleProject, Academy::Training, Design::Project, Guild) :
1. Crée une recette en sélectionnant un projet de ce type.
2. Vérifie en DB :
   ```bash
   bin/rails runner 'r = Revenue.last; puts "#{r.projectable_type} #{r.projectable_id} → #{r.projectable&.project_name}"'
   ```
   Expected: ligne avec le bon type Ruby et l'id, et le projet résolu.
3. Recharge la page de saisie en mode édition de cette recette : le projet doit toujours apparaître dans le combobox.

Si un type pose problème, stop et investigue.

- [ ] **Step 7: Tester le détachement (passer une recette de "lié" à "global")**

Édite une recette avec un projet, clique l'option "Aucun projet (effacer)" dans le combobox, sauvegarde. Vérifie en DB que `projectable_id` et `projectable_type` sont `nil`.

```bash
bin/rails runner 'r = Revenue.find(<id>); puts "#{r.projectable_type.inspect} #{r.projectable_id.inspect}"'
```

Expected: `nil nil`.

- [ ] **Step 8: Commit**

```bash
git add app/frontend/components/shared/RevenueFormModal.tsx
git commit -m "Add project selector to RevenueFormModal (any projectable type)"
```

---

## Task 6 — Migrer `ExpenseFormModal` vers `ProjectableCombobox` et corriger le bug single-project

**Files:**
- Modify: `app/frontend/components/shared/ExpenseFormModal.jsx`

- [ ] **Step 1: Importer le nouveau composant**

En haut du fichier, ajoute :

```jsx
import { ProjectableCombobox } from './ProjectableCombobox'
```

- [ ] **Step 2: Remplacer les states `trainingId` et `designProjectId` par `projectable`**

Localise les lignes 231-232 et remplace :

```jsx
// Avant
  const [trainingId, setTrainingId] = useState(expense?.trainingId ?? expense?.training_id ?? defaultTrainingId ?? '')
  const [designProjectId, setDesignProjectId] = useState(expense?.designProjectId ?? expense?.design_project_id ?? defaultDesignProjectId ?? '')

// Après
  const [projectable, setProjectable] = useState(() => {
    if (expense?.projectableType && expense?.projectableId) {
      return { type: expense.projectableType, id: String(expense.projectableId) }
    }
    if (defaultTrainingId) return { type: 'Academy::Training', id: String(defaultTrainingId) }
    if (defaultDesignProjectId) return { type: 'Design::Project', id: String(defaultDesignProjectId) }
    return null
  })
```

- [ ] **Step 3: Supprimer le fetch interne `/api/v1/academy` et `/api/v1/design`**

Supprime entièrement les deux blocs `useEffect` aux lignes ~137-159 (ceux qui font `apiRequest('/api/v1/academy')` et `apiRequest('/api/v1/design')`). Supprime aussi les states associés `fetchedTrainings`, `fetchedDesignProjects`, et les variables `effectiveTrainingOptions`, `effectiveDesignProjectOptions`.

- [ ] **Step 4: Supprimer la mémo `projectGroups`**

Supprime entièrement le bloc `const projectGroups = useMemo(...)` lignes ~325-351. Il n'est plus utilisé puisque `ProjectableCombobox` gère ses propres groupes.

- [ ] **Step 5: Adapter `hasProjectLink`**

Remplace ligne ~355 :

```jsx
// Avant
  const hasProjectLink = multiProject
    ? projectAllocations.some((a) => a.projectable_type && a.projectable_id)
    : Boolean(trainingId || designProjectId)

// Après
  const hasProjectLink = multiProject
    ? projectAllocations.some((a) => a.projectable_type && a.projectable_id)
    : Boolean(projectable)
```

- [ ] **Step 6: Corriger le payload (le bug)**

Localise les lignes 445-446 dans `handleSubmit` et remplace :

```jsx
// Avant (bug : ces clés ne sont pas dans expense_params côté Rails)
        training_id: multiProject ? undefined : (trainingId || undefined),
        design_project_id: multiProject ? undefined : (designProjectId || undefined),

// Après
        projectable_type: multiProject ? null : (projectable?.type ?? null),
        projectable_id: multiProject ? null : (projectable?.id ?? null),
```

- [ ] **Step 7: Remplacer le `ProjectCombobox` interne single-project**

Localise le bloc `{!multiProject && (...)}` lignes ~1080-1108 et remplace son contenu :

```jsx
                  {!multiProject && (
                    <div>
                      <label className="block text-sm font-medium text-stone-600 mb-1">Projet concerné</label>
                      <ProjectableCombobox
                        value={projectable}
                        onChange={setProjectable}
                        accent={accent}
                        placeholder="Sélectionnez un projet (optionnel — sinon dépense globale)"
                      />
                    </div>
                  )}
```

- [ ] **Step 8: Remplacer le `ProjectCombobox` interne dans les allocations multi-projets**

Dans le bloc `{multiProject && (...)}` lignes ~1110-1206, localise les `<ProjectCombobox groups={projectGroups} ... />` et remplace par :

```jsx
                                <ProjectableCombobox
                                  value={alloc.projectable_type && alloc.projectable_id
                                    ? { type: alloc.projectable_type, id: alloc.projectable_id }
                                    : null}
                                  onChange={(sel) => {
                                    setProjectAllocations((prev) => prev.map((a, i) => i === idx
                                      ? { ...a, projectable_type: sel?.type || '', projectable_id: sel?.id || '' }
                                      : a))
                                  }}
                                  accent={accent}
                                  placeholder="Sélectionner un projet"
                                />
```

- [ ] **Step 9: Supprimer le composant interne `ProjectCombobox`**

Supprime entièrement la fonction `function ProjectCombobox({ groups, value, onChange, accent, placeholder })` et tout son corps (à partir de ligne ~1490 jusqu'à sa fermeture). Il n'est plus utilisé.

- [ ] **Step 10: Vérifier que Vite compile**

Expected: aucune erreur, sinon corriger les références orphelines (par exemple si un import devient inutilisé, supprime-le pour éviter un warning ESLint).

- [ ] **Step 11: Tester manuellement la création d'une dépense liée à chaque type de projet (single)**

Pour PoleProject, Academy::Training, Design::Project, Guild :
1. Crée une dépense en sélectionnant le projet de ce type (avec `multiProject` désactivé).
2. Vérifie en DB :
   ```bash
   bin/rails runner 'e = Expense.last; puts "#{e.projectable_type} #{e.projectable_id} → #{e.projectable&.project_name}"'
   ```
   Expected: les bons type Ruby et id, projet résolu.

C'est ce test qui valide le **fix du bug** : avant cette PR, ces colonnes restaient `nil` côté backend.

- [ ] **Step 12: Tester le mode multi-allocations**

Crée une dépense en cochant "Dépense liée à plusieurs projets", ajoute deux allocations sur des types différents (ex. un PoleProject + une Training). Sauvegarde, vérifie en DB :

```bash
bin/rails runner 'e = Expense.last; e.project_allocations.each { |a| puts "#{a.projectable_type} #{a.projectable_id} → #{a.amount}" }'
```

Expected: deux lignes avec les bons types.

- [ ] **Step 13: Tester le contexte Academy / Design (pré-sélection)**

Va sur la page Academy → ouvre le détail d'une formation → bouton pour ajouter une dépense. Le projet doit être pré-sélectionné sur cette formation. Idem côté Design Studio.

Expected: le combobox affiche le projet pré-sélectionné, et au save c'est bien `projectable_*` qui est envoyé.

- [ ] **Step 14: Commit**

```bash
git add app/frontend/components/shared/ExpenseFormModal.jsx
git commit -m "Migrate ExpenseFormModal to ProjectableCombobox; fix silent drop of single-project link"
```

---

## Task 7 — Ajouter la cellule "Projet" cliquable dans `RevenueList`

**Files:**
- Modify: `app/frontend/lab-management/components/RevenueList.tsx`

- [ ] **Step 1: Importer la modale rapide et le type**

En haut du fichier :

```tsx
import { ProjectableQuickEditModal } from '../../components/shared/ProjectableQuickEditModal'
import type { ProjectableValue } from '../../components/shared/ProjectableCombobox'
```

- [ ] **Step 2: Ajouter une constante de couleurs par type Ruby**

Près des autres constantes (autour de ligne 80) :

```tsx
const PROJECTABLE_TYPE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  PoleProject:        { color: '#5B5781', bg: '#e8e5ed', label: 'Lab' },
  'Academy::Training': { color: '#B01A19', bg: '#f5dad3', label: 'Academy' },
  'Design::Project':  { color: '#6F7900', bg: '#eef0e0', label: 'Design' },
  Guild:              { color: '#78716C', bg: '#e7e5e4', label: 'Guilde' },
}
```

- [ ] **Step 3: Ajouter le state local pour la modale rapide**

Dans le composant `RevenueList`, à côté des autres `useState` :

```tsx
  const [quickEdit, setQuickEdit] = useState<{ revenue: RevenueItem } | null>(null)
```

- [ ] **Step 4: Ajouter une cellule "Projet" dans le tableau**

Repère la rangée du tableau qui affiche une revenue (cherche les `<td>` ou la fonction de rendu de ligne). Ajoute une cellule juste avant la cellule "Actions" (ou à un endroit visuellement cohérent — adapter selon le layout actuel) :

```tsx
                  <td className="px-3 py-2 align-middle">
                    {(() => {
                      const style = revenue.projectableType ? PROJECTABLE_TYPE_STYLE[revenue.projectableType] : null
                      if (revenue.projectableType && revenue.projectableId && style) {
                        return (
                          <button
                            type="button"
                            onClick={() => setQuickEdit({ revenue })}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-opacity max-w-[180px]"
                            style={{ color: style.color, backgroundColor: style.bg }}
                            title="Cliquer pour changer le projet lié"
                          >
                            <span className="truncate">{revenue.projectName || '—'}</span>
                          </button>
                        )
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => setQuickEdit({ revenue })}
                          className="text-[11px] text-stone-400 hover:text-stone-600 italic underline-offset-2 hover:underline"
                          title="Lier cette recette à un projet"
                        >
                          + Lier un projet
                        </button>
                      )
                    })()}
                  </td>
```

Si le tableau a un `<thead>` avec des `<th>`, ajoute aussi une colonne "Projet" au bon endroit.

- [ ] **Step 5: Monter la modale rapide en bas du composant**

Juste avant le `return` final ou avant la fermeture du fragment racine :

```tsx
      {quickEdit && (
        <ProjectableQuickEditModal
          entity={{ type: 'revenue', id: quickEdit.revenue.id, label: quickEdit.revenue.label || quickEdit.revenue.description }}
          currentProjectable={
            quickEdit.revenue.projectableType && quickEdit.revenue.projectableId
              ? { type: quickEdit.revenue.projectableType as ProjectableValue['type'], id: quickEdit.revenue.projectableId }
              : null
          }
          onSaved={(next) => {
            // Optimistic update: patchRevenue is the existing helper used elsewhere in this file
            patchRevenue(quickEdit.revenue.id, {
              projectableType: next?.type ?? null,
              projectableId: next?.id ?? null,
              projectName: next ? quickEdit.revenue.projectName : null,
            } as Partial<RevenueItem>)
            setQuickEdit(null)
          }}
          onCancel={() => setQuickEdit(null)}
        />
      )}
```

Note : `patchRevenue` (ligne ~296) écrit l'item localement. Le `projectName` correct sera rafraîchi au prochain reload de la liste — acceptable pour une mise à jour rapide.

Si tu veux une mise à jour exacte du `projectName` immédiatement, fetch `GET /api/v1/projects` (ou réutilise la liste cached côté `ProjectableCombobox` via une prop) pour résoudre le nom. Optionnel, à juger.

- [ ] **Step 6: Tester manuellement**

1. Sur la liste des recettes, identifie une recette sans projet → clique "+ Lier un projet" → sélectionne, sauvegarde → la pastille apparaît.
2. Clique la pastille → la modale s'ouvre avec le projet pré-rempli → change-le → sauvegarde → la pastille reflète le nouveau projet.
3. Clique la pastille → "Aucun projet (effacer)" → sauvegarde → retour à "+ Lier un projet".
4. Recharge la page : l'état doit persister.

- [ ] **Step 7: Commit**

```bash
git add app/frontend/lab-management/components/RevenueList.tsx
git commit -m "Add clickable project pill + quick-edit modal in RevenueList"
```

---

## Task 8 — Ajouter la cellule "Projet" cliquable dans `ExpenseList`

**Files:**
- Modify: `app/frontend/lab-management/components/ExpenseList.tsx`

- [ ] **Step 1: Importer la modale rapide et le type**

```tsx
import { ProjectableQuickEditModal } from '../../components/shared/ProjectableQuickEditModal'
import type { ProjectableValue } from '../../components/shared/ProjectableCombobox'
```

- [ ] **Step 2: Ajouter la constante de styles par type Ruby (réutiliser même mapping)**

```tsx
const PROJECTABLE_TYPE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  PoleProject:        { color: '#5B5781', bg: '#e8e5ed', label: 'Lab' },
  'Academy::Training': { color: '#B01A19', bg: '#f5dad3', label: 'Academy' },
  'Design::Project':  { color: '#6F7900', bg: '#eef0e0', label: 'Design' },
  Guild:              { color: '#78716C', bg: '#e7e5e4', label: 'Guilde' },
}
```

- [ ] **Step 3: Ajouter un state pour la modale rapide**

```tsx
  const [quickEdit, setQuickEdit] = useState<{ expense: ExpenseItem } | null>(null)
```

- [ ] **Step 4: Ajouter la cellule "Projet" dans la rangée**

Juste avant la cellule "Actions" :

```tsx
                  <td className="px-3 py-2 align-middle">
                    {(() => {
                      const allocCount = expense.projectAllocations?.length ?? 0
                      // Multi-allocations: open the full form instead of the quick modal.
                      if (allocCount > 0) {
                        return (
                          <button
                            type="button"
                            onClick={() => onEditExpense(expense)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                            title="Modifier les allocations dans le formulaire complet"
                          >
                            {allocCount} projet{allocCount > 1 ? 's' : ''}
                          </button>
                        )
                      }
                      const style = expense.projectableType ? PROJECTABLE_TYPE_STYLE[expense.projectableType] : null
                      if (expense.projectableType && expense.projectableId && style) {
                        return (
                          <button
                            type="button"
                            onClick={() => setQuickEdit({ expense })}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-opacity max-w-[180px]"
                            style={{ color: style.color, backgroundColor: style.bg }}
                            title="Cliquer pour changer le projet lié"
                          >
                            <span className="truncate">{expense.projectName || '—'}</span>
                          </button>
                        )
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => setQuickEdit({ expense })}
                          className="text-[11px] text-stone-400 hover:text-stone-600 italic underline-offset-2 hover:underline"
                          title="Lier cette dépense à un projet"
                        >
                          + Lier un projet
                        </button>
                      )
                    })()}
                  </td>
```

Si le `<thead>` existe, ajoute aussi `<th>Projet</th>` à la même position.

- [ ] **Step 5: Monter la modale rapide**

Juste avant la fermeture du fragment racine :

```tsx
      {quickEdit && (
        <ProjectableQuickEditModal
          entity={{ type: 'expense', id: quickEdit.expense.id, label: quickEdit.expense.name || quickEdit.expense.supplier }}
          currentProjectable={
            quickEdit.expense.projectableType && quickEdit.expense.projectableId
              ? { type: quickEdit.expense.projectableType as ProjectableValue['type'], id: quickEdit.expense.projectableId }
              : null
          }
          onSaved={(next) => {
            if (onInlineUpdate) {
              onInlineUpdate(quickEdit.expense.id, {
                projectableType: next?.type ?? null,
                projectableId: next?.id ?? null,
                projectName: next ? quickEdit.expense.projectName : null,
              } as Partial<ExpenseItem>)
            }
            setQuickEdit(null)
          }}
          onCancel={() => setQuickEdit(null)}
        />
      )}
```

Si la prop `onInlineUpdate` n'est pas fournie par tous les parents, le `if (onInlineUpdate)` évite un crash ; le parent rafraîchira la liste au prochain GET.

- [ ] **Step 6: Tester manuellement**

1. Liste des dépenses → dépense sans projet → "+ Lier un projet" → choisir un projet (chacun des 4 types testé au moins une fois sur l'ensemble du test plan) → sauvegarde → pastille apparaît.
2. Clique la pastille → change le projet → la pastille reflète le nouveau.
3. Trouve (ou crée) une dépense avec multi-allocations → vérifie qu'on voit "N projets" et que cliquer ouvre `ExpenseFormModal` complet (pas la modale rapide).
4. Recharge la page → tout persiste.

- [ ] **Step 7: Commit**

```bash
git add app/frontend/lab-management/components/ExpenseList.tsx
git commit -m "Add clickable project pill + quick-edit modal in ExpenseList (single-project only)"
```

---

## Task 9 — Vérification finale et tests d'intégration

**Files:** aucun changement.

- [ ] **Step 1: Lancer la suite de tests Rails**

Run: `bin/rails test`

Expected: tous les tests passent. Aucun changement backend, donc aucune régression attendue ; cette étape confirme que rien n'a été cassé indirectement.

Si un test échoue, examine-le et décide : régression réelle (à corriger) ou test obsolète qui supposait `training_id`/`design_project_id` (rare car pas dans les params permitted, mais possible).

- [ ] **Step 2: Smoke test complet via curl ou navigateur**

Vérifie au moins une fois chaque chemin clé :

```bash
# Liste recettes
curl -s -b cookies.txt http://localhost:3000/api/v1/lab/revenues | head -c 300

# Liste dépenses
curl -s -b cookies.txt http://localhost:3000/api/v1/lab/expenses | head -c 300
```

(Ou navigation manuelle dans la console du navigateur en étant authentifié.)

Expected: 200 + JSON contenant `projectableType`/`projectableId`/`projectName`.

- [ ] **Step 3: Tester un parcours utilisateur complet**

1. Crée une nouvelle recette liée à une `Guild` → vérifie qu'elle apparaît dans la liste avec la bonne pastille.
2. Crée une nouvelle dépense liée à un `PoleProject` → vérifie qu'elle apparaît avec la bonne pastille.
3. Sur une dépense existante avec multi-allocations, vérifie que la cellule projet montre "N projets" et qu'un clic ouvre le formulaire complet.
4. Re-link une recette via la modale rapide d'un projet à un autre → recharge la page → confirmé.
5. Détache une recette (passer à "global") via la modale rapide → recharge la page → confirmé.

- [ ] **Step 4: Pas de commit (étape de vérification finale)**

Si quelque chose échoue, retourne à la tâche concernée pour corriger.

- [ ] **Step 5: Récapitulatif des commits**

Run: `git log --oneline main..HEAD`

Expected: ~7 commits :
1. Add ProjectableCombobox shared component
2. Add ProjectableQuickEditModal
3. Sync RevenueItem/ExpenseItem types with backend serializer
4. Add project selector to RevenueFormModal
5. Migrate ExpenseFormModal to ProjectableCombobox; fix silent drop
6. Add clickable project pill + quick-edit in RevenueList
7. Add clickable project pill + quick-edit in ExpenseList

---

## Notes pour l'engineer qui exécute

- **Couleurs des pôles** : utilise les mêmes que celles définies dans CLAUDE.md (Lab `#5B5781`, Design `#AFBD00` ou son alternative `#6F7900` déjà utilisée pour les pastilles, Academy `#B01A19`). Ces couleurs sont copiées dans plusieurs constantes — c'est volontaire pour rester local et lisible plutôt que d'introduire un module partagé pour 4 entrées.
- **Pas de tests automatiques pour les composants React** : ce projet n'a pas de stack de test frontend (cf. CLAUDE.md, testing = Minitest pour Rails uniquement). Le plan de test est donc essentiellement manuel + smoke tests d'endpoints, ce qui est conforme à la convention du projet.
- **Le bug Expense corrigé en Task 6** : avant cette PR, créer une dépense liée à une `Academy::Training` ou un `Design::Project` en mode single-project envoyait `training_id`/`design_project_id` qui n'étaient pas dans `expense_params` côté Rails — donc silencieusement ignorés. Les dépenses semblaient sauvegardées mais sans lien. Le test de la Task 6 step 11 valide explicitement cette correction.
- **`apiRequest`** retourne déjà le JSON parsé (cf. `app/frontend/lib/api.js`). Pour PATCH, passer `{ method: 'PATCH', body: JSON.stringify(...) }` est suffisant — l'utilitaire ajoute le CSRF et le `Content-Type: application/json`.
