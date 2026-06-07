# Epic — Moteur de coordination Academy

> **But du coordinateur :** la coordination des activités Academy mange trop de
> temps (suivi manuel, relances email, réponses individuelles, clôture
> financière à la main). Ce temps perdu nous empêche d'ouvrir de nouvelles
> activités. Cet epic transforme la coordination en **supervision** :
> chaque événement métier génère/clôt automatiquement une **tâche datée**, et
> **MySemisto devient le guichet self-service** des participants — donc moins
> d'emails entrants à traiter.

## L'insight structurant

Le système de tâches unifié (`Task` + `TaskList` polymorphe, drawer « Mes
tâches », `Academy::TaskGenerator`, templates `task_templates`) **existe déjà**
et est la colonne vertébrale. La quasi-totalité des 18 issues ouvertes se
ramène à deux gestes :

1. **« Faire naître une tâche automatiquement »** au point d'ingestion (changement
   de statut, annulation, message entrant, fin de session) — au lieu d'une note
   mentale ou d'un email.
2. **« Laisser le participant se servir seul »** dans MySemisto (actus, messages,
   feedback, covoiturage, documents) — au lieu d'un échange à traiter.

On ne réécrit donc rien : on **branche** des automatisations sur la colonne
existante et on **étoffe** MySemisto.

## Choix posés (coordination d'abord)

| # | Choix | Pourquoi |
|---|-------|----------|
| 1 | `trigger` ajouté au jsonb `task_templates` (`on_create` / `on_status:<statut>` / `on_cancel`) plutôt qu'une nouvelle table | Reco explicite de #35, rétro-compatible, configurable par type d'activité |
| 2 | Clôture = **avertissement souple** (`force`) et non blocage dur | Respecte l'autonomie du coordinateur ; wording de #48 « empêcher *ou* avertir » |
| 3 | **Un seul** modèle `ParticipantMessage` sert le fil support (#18 MVP), le message→tâche (#41) et alimente les échanges liés (#16) | Évite 3 mécanismes parallèles |
| 4 | Feedback **natif** (pas Tally) | Rattaché à la session, cloisonné, donnée chez Semisto |
| 5 | `closure_readiness` existant (paiements) **étendu in-place** | Ne pas réécrire ; ajouter dépenses fournisseurs + documents |
| 6 | Récap Slack via `SlackNotifier` + `recurring.yml` existants | Pure automatisation, zéro nouvelle infra |
| 7 | WhatsApp V1 = lien `wa.me` (pas l'API Business) | Valeur immédiate, décision compte Business différée |

## Périmètre livré dans cette PR (testé)

Tranche verticale « moteur » — 8 boucles complètes plutôt que 18 demi-features :

- **A. Tâches pilotées par statut + annulation** (#35) — `trigger` sur les
  templates ; `on_status:<statut>` au changement de statut ; checklist
  d'annulation à échéance du jour.
- **B. Checklist de clôture étendue** (#48) — paiements + dépenses fournisseurs
  non payées + documents ; avertissement souple au passage `completed`.
- **C. Récap Slack quotidien** (#43) — tâches cochées du jour, groupées, ~23h.
- **D. Lien MySemisto dans l'email de confirmation** (#39).
- **E. Bloc Actus MySemisto** (#17) — `confirmed` / `to_confirm`, cloche, cloisonné.
- **F. Message participant → tâche auto + fil support** (#41 / #18 MVP).
- **G. Feedback de session + email J+1** (#21 / #46) — un seul mail, anonymat possible.
- **H. Widget WhatsApp** (#40) — lien `wa.me` sur la page Académie MySemisto.

## Différé (spec posée, en attente de décisions — voir QUESTIONS.md)

- **Espace formateur complet** (#20) — validation documents + cadence de
  facturation = décisions métier ouvertes.
- **Lien tâche ↔ réunion / réunion → tâches avec gate de validation** (#37 / #47)
  — dépend du modèle `events` ; livrable suivant.
- **Vue calendrier drag-drop des tâches** (#44) — frontend pur, livrable suivant.
- **Retours par type d'activité** (#15) + **échanges liés enrichis** (#16 V2).
- **Nova auto-répondeur MySemisto** (#42) — V2, dépend du canal message livré ici.
- **Site public Semisto ↔ Terranova** (#45) — V2.

## Carte issue → livrable

| Issue | Statut dans cette PR |
|-------|----------------------|
| #35 Tâches auto au changement de statut + annulation | ✅ Livré |
| #48 Critères de clôture & archivage | ✅ Livré (checklist étendue + warning) |
| #43 Récap quotidien Slack | ✅ Livré |
| #39 MySemisto auto à l'inscription + lien email | ✅ Livré (lien email + covoiturage déjà en place) |
| #17 Bloc Actus/Notifications MySemisto | ✅ Livré |
| #41 Message MySemisto → tâche auto | ✅ Livré |
| #18 Chat support MySemisto | ✅ MVP (fil, sans temps réel) |
| #21 Feedback post-journée + email J+1 | ✅ Livré |
| #46 Feedback à chaud par session | ✅ Livré (même mécanisme) |
| #40 Widget WhatsApp | ✅ Livré (lien wa.me) |
| #20 Espace formateur | ⏭️ Différé (décisions) |
| #37 Lien tâche ↔ réunion | ⏭️ Différé |
| #47 Réunion → tâches (gate validation) | ⏭️ Différé |
| #44 Vue calendrier des tâches | ⏭️ Différé |
| #15 Retours par type d'activité | ⏭️ Différé |
| #16 Échanges liés à une activité | 🟡 Socle posé (ParticipantMessage) |
| #42 Nova auto-répondeur | ⏭️ V2 |
| #45 Site public ↔ Terranova | ⏭️ V2 |

Les questions ouvertes (décisions à prendre avec Michael) sont dans
[`QUESTIONS.md`](../../QUESTIONS.md) à la racine, mises à jour pendant l'implémentation.
