# Case « Ajouter ce montant au total de la dépense » au rapprochement

## Contexte

Suite au correctif précédent (la recherche libre du rapprochement retrouve désormais
les dépenses déjà rapprochées), Michael peut allouer plusieurs transactions Facebook
à une même dépense « pub ». Mais le `total_incl_vat` de la dépense reste figé au montant
du premier prélèvement (ex. 20 €), alors que les prélèvements suivants (20 €, 10 €…)
font que la dépense réelle est plus élevée. Il doit aujourd'hui rouvrir la dépense pour
corriger le total à la main.

**Objectif :** dans le dialogue d'allocation, une case à cocher « Ajouter ce montant au
total de la dépense ». Cochée, l'allocation augmente automatiquement le total de la
dépense (ou recette) du montant alloué, en gardant la ventilation HT/TVA cohérente.

> ⚠️ État : **les changements ci-dessous sont déjà appliqués dans l'arbre de travail et
> vérifiés** (22/22 tests bancaires verts, scaling TVA 21 % validé, OpenAPI régénéré).
> Le mode plan s'est activé après l'implémentation. Il ne reste donc que **commit + push +
> déploiement**, en attente de ton feu vert.

## Changements

### Backend
- **`app/models/expense.rb`** — nouvelle méthode `add_to_total!(ttc_delta)` : augmente
  `total_incl_vat` du delta et scale proportionnellement `amount_excl_vat` + `vat_6/12/21`
  pour préserver l'invariant TTC = HT + TVA. Gère le cas total = 0.
- **`app/models/revenue.rb`** — `add_to_total!(delta)` symétrique sur `amount` /
  `amount_excl_vat` / `vat_6` / `vat_21`.
- **`app/controllers/api/v1/bank_controller.rb`** — `create_reconciliation` lit le param
  booléen `adjust_total` ; après sauvegarde de la réconciliation, si vrai et que la cible
  répond à `add_to_total!`, applique l'incrément avec le montant alloué. Renvoie
  `reconciliation.reload`.

### Frontend
- **`ReconciliationPanel.tsx`** — état `addToTotal` ; signature `onMatch` étendue d'un
  `adjustTotal?: boolean` ; case à cocher dans le dialogue d'allocation montrant l'aperçu
  « passe de X € à Y € » ; reset à l'ouverture/confirmation.
- **`BankSection.tsx`** — `handleReconcile` accepte `adjustTotal` et ajoute
  `body.adjust_total = true` à la requête POST.

### Tests & spec
- **`test/integration/bank_management_test.rb`** — 2 tests : `adjust_total` fait grandir
  le total ; sans le flag le total est inchangé.
- **`doc/openapi/*`** — régénéré (`adjust_total` documenté sur le endpoint).

## Décisions de conception
- **Incrément (pas « set = somme des réconciliations »)** : colle au mot de Michael
  (« rajouter ce montant »).
- **Scaling proportionnel HT/TVA** : correct aussi bien en franchise TVA (cas Facebook,
  TVA = 0 → HT suit le TTC) que pour une dépense assujettie (121 → 181,5 garde 100/21 → 150/31,5).
- **Case décochée par défaut** : comportement actuel préservé, opt-in explicite.
- **Pas de décrément au désrapprochement** (limite connue) : si on coche puis qu'on retire
  l'allocation, le total ne redescend pas tout seul. Évolution possible si besoin.

## Vérification
- `bin/rails test test/integration/bank_management_test.rb` → 22/22 verts.
- Scaling TVA validé via runner (121 + 60,5 → 181,5 ; HT 100→150 ; TVA21 21→31,5 ; cohérent).
- `yarn tsc --noEmit` → aucune erreur sur les fichiers modifiés.
- À faire après déploiement : vérifier en prod via Interceptor le parcours rapprochement
  (cocher la case, confirmer, rouvrir la dépense pour voir le total augmenté).

## Reste à faire (en attente d'accord)
1. `git add` des fichiers ci-dessus (hors artefact build `manifest.json` et `docs/` non liés).
2. Commit + push sur `main`.
3. Déploiement (Hatchbox) pour activer en prod.
