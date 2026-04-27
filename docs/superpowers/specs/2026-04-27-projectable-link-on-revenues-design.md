# Lier les recettes (et toutes les dépenses) à n'importe quel projectable

## Contexte

Aujourd'hui dans le module Comptabilité :

- **Dépenses** : un sélecteur permet de lier une dépense à une formation Academy ou à un projet Design. Les `PoleProject` (lab) et `Guild` ne sont pas exposés. Le mode "multi-projets" (allocations) fonctionne et passe par `projectable_type`/`projectable_id` ; le mode "single-project" envoie `training_id`/`design_project_id` qui sont **silencieusement ignorés** par le backend (`expense_params` ne les accepte pas).
- **Recettes** : aucun sélecteur de projet, alors que la colonne `revenues.projectable_id`/`projectable_type` existe et que le modèle a déjà `belongs_to :projectable, polymorphic: true`.

Le concern `Projectable` couvre 4 modèles : `PoleProject`, `Academy::Training`, `Design::Project`, `Guild`. L'endpoint `GET /api/v1/projects` retourne déjà la liste consolidée de ces 4 types avec `{ id, name, typeKey }`.

## Objectif

Permettre de lier **une recette ou une dépense** à n'importe quel projectable (un seul projet max pour les recettes, single-project ou multi-allocations pour les dépenses), via un composant de sélection unifié et réutilisable. Permettre la modification rapide du projet lié directement depuis les listes.

## Non-objectifs

- Pas d'allocations multi-projets pour les recettes (1 lien max).
- Pas de migration des autres usages de `trainingId`/`designProjectId` ailleurs dans le code (kanban academy, timesheets, etc.) — uniquement les écrans Dépenses et Recettes.
- Pas de modification du backend pour les associations : `Revenue#projectable` et `Expense#projectable` existent déjà, leurs `*_params` permettent déjà `:projectable_type, :projectable_id`, les serializers exposent déjà `projectableType/projectableId/projectName`.

## Architecture

### Composant partagé : `ProjectableCombobox`

**Fichier** : `app/frontend/components/shared/ProjectableCombobox.tsx`

Combobox autonome qui affiche les 4 groupes Projectable (Lab, Academy, Design Studio, Guildes) regroupés visuellement.

**Props** :
```ts
interface ProjectableValue {
  type: 'PoleProject' | 'Academy::Training' | 'Design::Project' | 'Guild'
  id: string
}

interface ProjectableComboboxProps {
  value: ProjectableValue | null
  onChange: (value: ProjectableValue | null) => void
  projects?: ProjectableOption[] // optional pre-fetched list
  placeholder?: string
  accent?: string
  disabled?: boolean
}

interface ProjectableOption {
  id: string
  name: string
  typeKey: 'lab-project' | 'training' | 'design-project' | 'guild'
}
```

**Comportement** :
- Si `projects` prop n'est pas fournie, fetch `GET /api/v1/projects` au mount et stocke en state local.
- Mappe `typeKey` ↔ `projectable_type` (Ruby class name) en interne :
  ```
  'lab-project'    ↔ 'PoleProject'
  'training'       ↔ 'Academy::Training'
  'design-project' ↔ 'Design::Project'
  'guild'          ↔ 'Guild'
  ```
- Recherche locale sur `name` (insensible à la casse, accents).
- Groupes visuels avec couleur de pôle :
  - Lab — `#5B5781` (violet)
  - Academy — `#B01A19` (rouge)
  - Design Studio — `#AFBD00` (olive)
  - Guildes — `#78716C` (neutre)
- Affiche un état "Aucun projet (recette/dépense globale)" sélectionnable pour effacer.
- Émet `null` quand l'utilisateur efface, sinon `{ type, id }`.

### Modale rapide : `ProjectableQuickEditModal`

**Fichier** : `app/frontend/components/shared/ProjectableQuickEditModal.tsx`

Modale minimale pour éditer uniquement le projet lié à une dépense ou une recette, accessible en un clic depuis la liste.

**Props** :
```ts
interface ProjectableQuickEditModalProps {
  entity: { type: 'expense' | 'revenue'; id: string; label?: string }
  currentProjectable: ProjectableValue | null
  onSaved: (next: ProjectableValue | null) => void
  onCancel: () => void
}
```

**Comportement** :
- Affiche `ProjectableCombobox` + boutons Annuler/Enregistrer.
- Au save : `PATCH /api/v1/lab/expenses/:id` ou `/api/v1/lab/revenues/:id` avec **uniquement** `{ projectable_type, projectable_id }` (ou `null`/`null` pour effacer).
- Appelle `onSaved` avec la nouvelle valeur ; le parent met à jour sa liste localement.
- **Cas particulier dépense avec allocations multi-projets** : la liste ne propose pas la modale rapide pour ces dépenses-là. À la place, le clic sur la pastille projet ouvre le formulaire complet `ExpenseFormModal`. La détection se fait côté liste via la longueur de `projectAllocations`.

## Frontend — RevenueFormModal

`app/frontend/components/shared/RevenueFormModal.tsx`

**Modifications** :

1. Ajouter au state initial :
   ```ts
   projectable: revenue?.projectableType && revenue?.projectableId
     ? { type: revenue.projectableType, id: revenue.projectableId }
     : null
   ```

2. Nouvelle section "Projet concerné" (optionnelle), placée entre la section "Description" et la section collapsible "Paiement" :
   ```tsx
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

3. Au submit, ajouter au payload :
   ```ts
   projectable_type: form.projectable?.type ?? null,
   projectable_id: form.projectable?.id ?? null,
   ```
   (les deux `null` permettent au backend de détacher correctement.)

4. Mettre à jour l'interface `RevenueItem` dans `RevenueList.tsx` :
   ```ts
   // Remplacer
   trainingId: string | null
   designProjectId: string | null
   // Par
   projectableType: string | null
   projectableId: string | null
   projectName: string | null
   ```

## Frontend — ExpenseFormModal

`app/frontend/components/shared/ExpenseFormModal.jsx`

**Migration vers `ProjectableCombobox`** :

1. Supprimer le composant interne `ProjectCombobox` (lignes ~1490+).
2. Supprimer la mémo `projectGroups` et les `useEffect` qui fetch `/api/v1/academy` et `/api/v1/design`.
3. Remplacer les states `trainingId` / `designProjectId` par un seul state :
   ```js
   const [projectable, setProjectable] = useState(
     expense?.projectableType && expense?.projectableId
       ? { type: expense.projectableType, id: expense.projectableId }
       : null
   )
   ```
4. Conserver `defaultTrainingId` / `defaultDesignProjectId` props pour rétro-compatibilité (les pages Academy/Design les passent encore) — les convertir en `projectable` au mount :
   ```js
   if (defaultTrainingId) setProjectable({ type: 'Academy::Training', id: defaultTrainingId })
   else if (defaultDesignProjectId) setProjectable({ type: 'Design::Project', id: defaultDesignProjectId })
   ```
5. Simplifier l'UI single-project en remplaçant le `<ProjectCombobox groups={projectGroups} ... />` par `<ProjectableCombobox value={projectable} onChange={setProjectable} ... />`.
6. L'UI multi-allocations utilise déjà `projectable_type`/`projectable_id` dans chaque ligne — remplacer juste son combobox interne par `ProjectableCombobox` (les nouveaux types Lab/Guild deviennent automatiquement disponibles).
7. Au submit, **corriger le bug latent** :
   ```js
   // Avant (bug : ces champs ne sont pas dans expense_params)
   training_id: multiProject ? undefined : (trainingId || undefined),
   design_project_id: multiProject ? undefined : (designProjectId || undefined),
   // Après
   projectable_type: multiProject ? null : (projectable?.type ?? null),
   projectable_id: multiProject ? null : (projectable?.id ?? null),
   ```

**`hasProjectLink`** devient :
```js
const hasProjectLink = multiProject
  ? projectAllocations.some((a) => a.projectable_type && a.projectable_id)
  : Boolean(projectable)
```

**Suppression des props devenues inutiles à terme** :
- `trainingOptions`, `designProjectOptions`, `showTrainingLink`, `showDesignProjectLink` peuvent rester comme no-ops déprécated (passages externes encore présents) — les conserver dans la signature pour ne pas casser les appelants, mais ignorer leurs valeurs. Plan séparé pour le nettoyage final.

## Frontend — RevenueList

`app/frontend/lab-management/components/RevenueList.tsx`

1. Mettre à jour `RevenueItem` (cf. plus haut).
2. Ajouter une cellule "Projet" dans la rangée :
   - Si `projectName` présent : pastille avec couleur du pôle correspondant au `projectableType`, cliquable → ouvre `ProjectableQuickEditModal`.
   - Sinon : bouton ghost discret "+ Lier un projet" → ouvre `ProjectableQuickEditModal` (avec `currentProjectable=null`).
3. Le state local du parent (`Settings.jsx` ou `BankSection.tsx`) gère la modale rapide et met à jour la liste après save.

## Frontend — ExpenseList

`app/frontend/lab-management/components/ExpenseList.tsx`

Symétrique à RevenueList :
1. Ajouter ou utiliser les champs `projectableType`/`projectableId`/`projectName` (déjà exposés par le serializer côté backend, à confirmer dans le typing existant).
2. Cellule "Projet" cliquable :
   - **Si la dépense a des allocations multi-projets** (`projectAllocations.length > 0`) : afficher "N projets" et cliquer ouvre le `ExpenseFormModal` complet.
   - Sinon : pastille du projet (ou bouton "+ Lier") qui ouvre `ProjectableQuickEditModal`.

## Backend

**Aucune modification nécessaire**. Vérifications faites :

- `Revenue#projectable` polymorphique optional ✅
- `revenue_params` permet `:projectable_type, :projectable_id` ✅ (ligne 936)
- `expense_params` permet `:projectable_type, :projectable_id` ✅ (ligne 950)
- `serialize_revenue` expose `projectableType/projectableId/projectName` ✅ (lignes 1061-1063)
- `serialize_expense` expose `projectableType/projectableId/projectName` ✅ (lignes 1120-1122)
- `GET /api/v1/projects` retourne les 4 types projectables avec `{ id, name, typeKey }` ✅
- Validation projectable_type côté allocations utilise déjà `Projectable::PROJECT_TYPE_KEYS.key?` ✅

**Cas du PATCH partiel via la modale rapide** : envoyer `{ projectable_type: null, projectable_id: null }` permet de détacher. Strong params accepte les deux clés indépendamment ; ActiveRecord gère le reste.

## Plan de tests

Étant donné que le backend ne change pas, l'effort de test est principalement manuel :

1. **Recettes — création** : créer une recette en sélectionnant un PoleProject, une Training, un Design::Project, une Guild. Vérifier en DB que `projectable_type`/`projectable_id` sont bien renseignés. Recharger la page et vérifier que le projet est toujours sélectionné dans le formulaire.
2. **Recettes — édition rapide** : depuis la liste, cliquer sur "+ Lier" puis sur la pastille existante. Changer de projet, effacer le projet (passer en "globale"). Vérifier en DB.
3. **Recettes — édition formulaire complet** : changer le projet via le formulaire complet, vérifier la cohérence.
4. **Dépenses — single project, migration** : créer une dépense en sélectionnant chacun des 4 types de projets. Vérifier en DB que `projectable_type`/`projectable_id` sont renseignés (auparavant les valeurs étaient perdues silencieusement pour Training/Design Project).
5. **Dépenses — multi-allocations** : créer/modifier une dépense avec allocations multi-projets. Vérifier que le combobox propose bien les 4 types dans chaque ligne d'allocation.
6. **Dépenses — édition rapide** : sur une dépense single-project, ouvrir la modale rapide. Sur une dépense avec allocations, vérifier que le clic ouvre le formulaire complet à la place.
7. **Smoke test des serializers** : `curl` sur `GET /api/v1/lab/expenses` et `GET /api/v1/lab/revenues` après les changements pour confirmer 200 + champs `projectableType`/`projectableId`/`projectName` présents (per la règle CLAUDE.md sur les refactorings touchant les colonnes/associations).
8. **Tests automatiques existants** : `bin/rails test test/integration/` pour s'assurer qu'aucune intégration n'est cassée.

## Risques & questions ouvertes

- **Compatibilité ascendante des `defaultTrainingId`/`defaultDesignProjectId`** : ces props sont passées depuis les pages Academy et Design quand on ouvre le formulaire dépense en contexte. On les garde pour ne pas casser, mais on les convertit en `projectable` au mount. Vérifier les sites d'appel pendant l'implémentation.
- **`expense?.trainingId` / `expense?.designProjectId`** : si le serializer expose encore ces champs (à vérifier — je ne pense pas), on les ignore. Sinon on les lit comme fallback uniquement le temps de la PR.
- **`RevenueItem` mis à jour** : les autres consommateurs de cette interface (RevenueDetailModal, BankSection, etc.) doivent continuer de compiler. Recherche systématique des accès à `.trainingId`/`.designProjectId` sur RevenueItem à faire pendant l'implémentation.
- **Consistance visuelle des pastilles projet dans les listes** : utiliser le même style que les pastilles déjà présentes ailleurs (pôles, statuts) pour rester cohérent avec le langage visuel Terranova.
