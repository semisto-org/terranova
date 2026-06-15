# Plan — Date d'activité dans le sélecteur de projet (allocation de dépense)

## Context

Quand on alloue une dépense à un ou plusieurs projets (modal de dépense, section
« Dépense liée à plusieurs projets » → `ALLOCATION #1`, `#2`…), on utilise un
dropdown de recherche (`ProjectableCombobox`). Problème : certaines activités
Academy partagent **exactement le même libellé** (ex. trois « Formation à la
greffe et visite d'un jardin-forêt… »), impossible donc de choisir la bonne.

Une formation (`Academy::Training`) n'a pas de date propre — ce sont ses
**sessions** (`Academy::TrainingSession`, `start_date`/`end_date`, type `date`)
qui portent les dates. La solution : afficher sous le nom, **uniquement pour les
activités**, la **plage de dates** des sessions (première date de début → dernière
date de fin), ce qui permet de distinguer deux formations homonymes.

Décisions prises avec Michael : implémenter directement ; format = **plage
début → fin**.

## Fichiers concernés

1. `app/controllers/api/v1/projects_controller.rb` — endpoint `GET /api/v1/projects`
2. `app/frontend/components/shared/ProjectableCombobox.tsx` — rendu du dropdown

Le combobox d'allocation (`ExpenseFormModal.jsx:1062`) ne passe pas de prop
`projects` → il fetch `/api/v1/projects` en interne, donc le nouveau champ
remonte automatiquement. Changement **rétro-compatible** : les autres appelants
(RevenueFormModal, ProjectableQuickEditModal) ignorent simplement le champ absent.

## 1. Backend — `projects_controller.rb`

- **Précharger les sessions** dans `index` pour éviter le N+1 :
  `Academy::Training…includes(:project_memberships, :unified_task_lists, :sessions)`.
- **Ajouter `dateLabel`** au hash de `serialize_project_summary` (à côté de `typeKey`).
- **Nouveaux helpers privés** (au-dessus de `serialize_project_summary`) :
  - `FR_MONTHS` (pas de fichiers `config/locales/`, `default_locale = :fr` mais
    aucun YAML → on formate les mois en français à la main).
  - `project_date_label(project)` : `nil` sauf pour `Academy::Training` ; filtre
    les sessions non supprimées **en mémoire** (`reject(&:deleted_at)`, sessions
    déjà préchargées), prend `start_date.min` → `max(end_date, start_date)` ;
    renvoie une seule date si début == fin, sinon `"<début> → <fin>"`.
  - `format_fr_date(date)` → `"12 mars 2026"`.

> Statut : les 3 edits backend ont été ébauchés dans la session avant l'activation
> du mode plan ; à confirmer/re-vérifier à l'exécution.

## 2. Frontend — `ProjectableCombobox.tsx`

- Étendre l'interface : `interface ProjectableOption { …; dateLabel?: string }`.
- **Liste d'options** (boutons du dropdown, ~ligne 311-318) : passer le contenu
  texte en colonne — `name` sur une ligne (truncate) et, si `item.dateLabel`,
  une seconde ligne discrète en dessous :
  ```jsx
  <span className="flex-1 min-w-0">
    <span className="block truncate">{item.name}</span>
    {item.dateLabel && (
      <span className="block text-[11px] text-stone-400 truncate">{item.dateLabel}</span>
    )}
  </span>
  ```
  Le `<Check>` reste à droite ; le bouton garde `items-center`.
- **Chip du projet sélectionné** (~ligne 247) : ajouter la date en muet à côté du
  nom pour confirmer le bon choix après sélection :
  `{selected.dateLabel && <span className="text-stone-400 text-xs shrink-0 truncate">· {selected.dateLabel}</span>}`.
- La recherche reste sur le **nom seul** (la date sert à départager visuellement,
  pas à filtrer) — aucun changement au `filtered`/`normalize`.

## Vérification

1. `bin/rails test test/integration` — s'assurer qu'aucun test projets/dépenses
   ne casse (le champ est additif).
2. `curl -s localhost:4000/api/v1/projects` (session authentifiée) → vérifier que
   les items `typeKey:'training'` portent un `dateLabel` cohérent (plage de
   sessions) et que les autres types ont `dateLabel: null`.
3. **Interceptor** (vérif web obligatoire) : ouvrir le modal de dépense → cocher
   « Dépense liée à plusieurs projets » → ouvrir une allocation → rechercher
   « greffe » → confirmer que les formations homonymes affichent chacune leur
   plage de dates en dessous, et qu'on peut distinguer/sélectionner la bonne.
   Screenshot avant/après.
