---
project: Terranova
task: "Project ISA — Terranova v1.0 (plateforme Semisto)"
effort: advanced
effort_source: explicit
phase: observe
progress: 0/44
mode: interactive
started: 2026-05-27T14:00:00+02:00
updated: 2026-05-27T16:30:00+02:00
---

> ⚠️ **SEED — brouillon généré le 2026-05-27, relecture humaine obligatoire avant de le traiter comme autoritatif.** Sourcé du repo (product-overview, MILESTONES, CLAUDE.md, inventaire contrôleurs/modèles/pages, git 30 j). Les bornes de périmètre v1.0 (Goal + Out of Scope) sont des **décisions produit de Michael** : elles sont proposées ici mais marquées « à confirmer ». Affiner via `Skill("ISA", "interview me on /Users/michael/code/terranova/ISA.md")`.

## Problem

Le mouvement Semisto — réseau fédératif de Labs et de citoyens dont la mission est de transformer les zones anthropisées d'Europe en territoires nourriciers — n'a pas d'infrastructure numérique unifiée pour piloter ses opérations (cycles de travail, financement tracé, monnaie interne Semos, mesure d'impact, base végétale, formations, pépinières). Aujourd'hui Terranova existe déjà et est conséquent (~155 tables, ~35 contrôleurs API, ~13 domaines avec UI), **mais son état réel n'est documenté nulle part de façon fiable** : `MILESTONES.md` dit « Plant DB / Design / Academy / Nursery : non commencé » alors que le code et le `CLAUDE.md` montrent ces domaines largement implémentés. Le statut des features est éclaté entre trois sources qui se contredisent. Il manque une **source de vérité unique** de ce que « v1.0 lancée » veut dire, et de l'écart entre l'état courant et cet idéal.

## Vision

Terranova est l'infrastructure numérique qui permet l'avènement de l'agroforesterie en Europe : la plateforme du mouvement Semisto, open source. Elle orchestre des cycles de travail inspirés de Shape Up, facilite le financement collaboratif avec traçabilité par projet, valorise les contributions via une monnaie interne (le Semos), et mesure l'impact collectif sur les hectares transformés. Surprise euphorique visée (v1, confirmée en Interview) : le matin, un·e membre du **Lab Wallonie-Bruxelles** ouvre **une seule app** pour ses projets de design, ses activités, son stock de pépinière, ses palettes végétales et son **agenda** — là où il fallait Notion + plusieurs outils déconnectés — pendant que **clients** et **inscrits Academy** retrouvent *leur* fenêtre via **My Semisto**.

## Out of Scope

> Partiellement confirmé en Interview (2026-05-27) ; les domaines borderline restent à trancher.

- **Aucune surface publique en v1** (confirmé) — pas de site public ni de CMS mutualisé ouvert au grand public. Clients et inscrits Academy passent par **My Semisto** (accès authentifié), jamais par des pages publiques.
- **Cycles Shape Up SUPPRIMÉS de v1** (confirmé) — UI/accès retirés de l'app pour le moment (code conservé en repo) ; réintégration post-v1. Devient une *tâche v1* (le retrait lui-même), cf. ISC-14.
- **Site web public = projet séparé** (confirmé) — développé hors de cet ISA. Les endpoints publics existants restent mais ne sont pas un objectif v1.
- **Strategy hors « délibérations »** (confirmé) — frameworks, axes, key results, ressources stratégiques = post-v1. Seules les **délibérations** (déjà en prod) sont dans v1.
- **Knowledge — sujets liés (`related`)** hors v1 (confirmé) — feature câblée mais vide en prod ; nice-to-have, à revisiter post-v1. Le reste de Knowledge reste dans v1.
- **Citizen Engagement** (contributions citoyennes, Food Forest Heroes, chantiers participatifs, matériothèque) — milestone 8, non commencé. Probablement post-v1.
- **Partner Portal** (espace institutions/entreprises, allocation de fonds, reporting RSE) — milestone 9, non commencé. Probablement post-v1.
- **CMS public complet du Website** — les endpoints publics existent (`website/home|articles|events|courses`) et le site Astro est connecté, mais l'édition CMS mutualisée entre Labs n'est pas un objectif v1 confirmé.
- Pas d'app mobile native — web responsive uniquement.

## Principles

> Sourcés de `product-overview.md` et du TELOS de Michael — à relire/corriger en Interview.
- **Open source.** Le code est public ; le modèle doit être réplicable par d'autres Labs en Europe.
- **Fédération, pas centralisation.** Un réseau de Labs autonomes, multi-organisations — pas un silo unique.
- **Autonomie financière par l'activité.** La traçabilité financière (Semos, revenus, réconciliation bancaire) sert un modèle qui ne dépend pas de la subvention.
- **Prouver localement, puis cloner.** v1.0 doit marcher pour les Labs réels (Wallonie / Les 4 Sources) avant de prétendre à l'échelle.
- **Les actions destructives sont toujours confirmées ; le contenu réservé aux admins est visiblement signalé.** (Conventions UI déjà en place.)
- **Périmètre > date.** Le 01/09/2026 est un objectif souple (confirmé Interview) : en cas de débordement, préférer glisser d'1–2 semaines sur un domaine plutôt que rogner le périmètre v1.

## Constraints

- **Stack figée :** Ruby on Rails 8.1 + PostgreSQL + Puma ; React 18 via Inertia.js + Vite 5 + Tailwind 4. Ruby 3.3.10, Node 22.13.1 (`.tool-versions`). Yarn 1.x, Bundler.
- **Auth :** session-based, bcrypt, `session[:member_id]`. Pas de refonte auth en v1.
- **API :** namespace `Api::V1::` servant du JSON ; pages applicatives en réponses Inertia (pas JSON).
- **Contrat API auto-généré :** `rspec-openapi` enregistre les paires requête/réponse depuis la suite Minitest. CI échoue sur dérive du spec. Un endpoint absent du spec = endpoint sans test.
- **Déploiement :** Hatchbox, déclenché automatiquement par push sur `main`. `rake assets:precompile` lance `yarn build`.
- **Namespacing modèles/tables :** `Design::Project`/`design_projects`, `Academy::Training`/`academy_trainings`, etc. ; domaine Lab en top-level.
- **Email :** Amazon SES. **Paiements :** Stripe. **Import bancaire :** GoCardless + CODA.

## Goal

> Audience + capacités porteuses **confirmées en Interview (2026-05-27)**. Reste à trancher : les domaines non cités par Michael (Lab Management/Semos, Economics, Knowledge) et les 3 borderline (Strategy, Marketplace, Website-CMS).

Mettre Terranova **v1.0 en production sur `terranova.semisto.org` au 1er septembre 2026** comme **outil opérationnel quotidien du Lab Wallonie-Bruxelles** (seul Lab actuel — designers, coordinateurs, project managers, bénévoles, pépiniériste), **en remplacement de Notion**. Le collectif doit pouvoir depuis Terranova : **réaliser et gérer les projets de design depuis l'interface**, gérer les **activités Academy**, gérer le **stock et les commandes de la pépinière**, **créer des palettes végétales**, et **piloter l'agenda** (plus dans Notion). La **recherche de plantes (espèces / variétés) doit être efficace**. Les **clients** consultent leurs projets et les **inscrits Academy** leurs activités via **My Semisto**. **Aucune surface publique en v1.** Socle transverse : auth, RBAC admin, contrat OpenAPI sans dérive, déploiement Hatchbox vert.

## Criteria

> Seed : tous les ISC sont `[ ]` (non vérifiés en live). On les coche au fil des semaines avec preuve. Le statut « construit ou pas » par domaine est dans `## Features`.

**Cross-cutting**
- [ ] ISC-1: `GET /api/v1/health` renvoie 200 en prod.
- [ ] ISC-2: Connexion (`POST /login`) puis accès à une page authentifiée fonctionne ; `DELETE /logout` invalide la session.
- [ ] ISC-3: Le flux mot-de-passe oublié (`/forgot-password` → email SES → `/reset-password`) aboutit de bout en bout.
- [ ] ISC-4: Un membre non-admin n'obtient pas les données/actions réservées admin (RBAC `isAdmin`).
- [ ] ISC-5: `bin/rails test` passe en entier (0 échec, 0 erreur).
- [ ] ISC-6: `OPENAPI=1 bin/rails test test/integration && bin/rails openapi:split` ne produit aucune dérive (CI verte sur le spec).
- [ ] ISC-7: Un push sur `main` déclenche un déploiement Hatchbox qui aboutit (version déployée == HEAD).
- [ ] ISC-8: `GET /api/v1/openapi` (index) et `/api/v1/openapi/:domain` répondent et listent les domaines v1.
- [ ] ISC-9: La recherche globale (`search_controller`) renvoie des résultats pertinents cross-domaine.
- [ ] ISC-10: Multi-organisation : les données d'un Lab ne fuitent pas vers un autre (isolation par organization).

**Foundation**
- [ ] ISC-11: `GET /` rend `Foundation/AppIndex` dans l'AppShell pour un membre connecté.
- [ ] ISC-12: Le `ContextSwitcher` (pole/lab/user) bascule de contexte sans rechargement complet.
- [ ] ISC-13: i18n par défaut `fr` côté API.

**Lab Management**
- [ ] ISC-14: [v1 = RETRAIT] Cycles Shape Up supprimés de l'app — aucune route ni entrée de nav « cycles » accessible en v1 (code conservé en repo pour post-v1). Probe : nav + routes cycles absentes.
- [ ] ISC-15: Semos : un transfert débite/crédite correctement les wallets (intégrité de la monnaie interne).
- [ ] ISC-16: Timesheets : saisie + filtres + reporting Lab (`lab_reporting_service`) cohérents.
- [ ] ISC-17: Guildes & events : CRUD et inscriptions fonctionnels.

**Plant Database** *(chantier actif)*
- [ ] ISC-18: Hiérarchie genre → espèce → variété navigable (`/plants/*path`).
- [ ] ISC-19: Recherche par critères botaniques renvoie des fiches correctes.
- [ ] ISC-20: Génération d'illustration de plante (Gemini) produit une image attachée à la fiche.
- [ ] ISC-21: La skill `terranova-update-species` met à jour une fiche avec données sourcées sans casser le schéma.

**Design Studio**
- [ ] ISC-22: Créer un projet de jardin-forêt, y associer un plan de plantation et une palette.
- [ ] ISC-23: Générer une offre/budget pour un projet.
- [ ] ISC-24: Le portail client (`/client/design/:project_id?token=X`) affiche le projet en lecture via token signé, sans auth.

**Academy**
- [ ] ISC-25: Catalogue de formations + création d'une formation/session via modales (plus aucun `window.prompt`).
- [ ] ISC-26: Inscription d'un participant à une session aboutit et apparaît au reporting.
- [ ] ISC-27: Calendrier ICS (`calendar_ics_service`) exporte les sessions.

**Nursery** *(chantier actif)*
- [ ] ISC-28: Lots de stock, plants-mères et commandes : CRUD fonctionnel.
- [ ] ISC-29: Vente interne entre Labs génère le mouvement attendu.

**Economics**
- [ ] ISC-30: Import Stripe (`bank_sync/stripe_importer`) crée une Revenue par paiement, **idempotent** via `revenues.stripe_payment_intent_id`.
- [ ] ISC-31: Import bancaire CODA (`coda_importer`) crée les `bank_transaction` attendues.
- [ ] ISC-32: Réconciliation : les règles `bank_matching_rules` suggèrent contact/catégorie/TVA correctement.
- [ ] ISC-33: Caisse : une vente cash Shop alimente la `BankConnection` provider=`cash` via `Cash::Bookkeeper`.
- [ ] ISC-34: Note de frais : création + PDF (`expense_note_pdf`) + allocation par projet.
- [ ] ISC-35: Dashboard économique (`economics_dashboard_service`) affiche des totaux cohérents avec la base.
- [ ] ISC-42: Dashboard financier d'**aide à la décision** opérationnel — vue consolidée (revenus / dépenses / trésorerie) utilisable par le collectif pour décider. Le `economics_dashboard_service` actuel est le point de départ ; le critère exact de « décisionnel » reste à préciser avec Michael.

**Knowledge**
- [ ] ISC-36: Topics de connaissance avec révisions versionnées et éditeurs.
- [ ] ISC-37: Import Notion (`notion_importer` + médias) crée des topics fidèles à la source.

**Marketplace**
- [ ] ISC-43: Marketplace interne — lister un produit/service avec prix en **Semos** ; une transaction débite/crédite correctement les wallets Semos (couplé à l'intégrité Semos, cf. ISC-15).

**Strategy (délibérations uniquement)**
- [ ] ISC-44: Délibérations (gouvernance) — créer une proposition, délibérer (commentaires / réactions, décideurs), aboutir à une décision ; déjà utilisé en prod.

**Anti-criteria**
- [ ] ISC-38: Anti : aucun endpoint Citizen Engagement ni Partner Portal n'est exposé/lié en prod v1 (hors périmètre).
- [ ] ISC-39: Anti : pas de doublon de `Revenue` sur réception multiple du même webhook Stripe (idempotence vérifiée).
- [ ] ISC-40: Anti : aucune action destructive (delete/remove) dans l'UI sans `window.confirm()`.
- [ ] ISC-41: Anti : aucune fuite de données admin-only vers un membre non-admin.

## Test Strategy

```yaml
- isc: ISC-1
  type: http-probe
  check: status 200
  threshold: 200
  tool: curl -s -o /dev/null -w "%{http_code}" https://terranova.semisto.org/api/v1/health

- isc: ISC-5
  type: test-suite
  check: suite Minitest verte
  threshold: 0 failures, 0 errors
  tool: bin/rails test

- isc: ISC-6
  type: contract-drift
  check: spec OpenAPI inchangé après régénération
  threshold: git diff vide sur doc/openapi*
  tool: OPENAPI=1 bin/rails test test/integration && bin/rails openapi:split && git diff --stat doc/

- isc: ISC-7
  type: deploy
  check: version déployée == HEAD
  threshold: match
  tool: comparer SHA Hatchbox au git rev-parse HEAD

- isc: ISC-30
  type: integration
  check: 1 Revenue par payment_intent, pas de doublon
  threshold: count(revenues by intent) == 1
  tool: rejouer le webhook 2x, SELECT count(*) FROM revenues WHERE stripe_payment_intent_id = ?

- isc: ISC-39
  type: anti-probe
  check: idempotence webhook
  threshold: 0 doublon
  tool: SELECT stripe_payment_intent_id, count(*) FROM revenues GROUP BY 1 HAVING count(*) > 1

# TODO: compléter les probes ISC-2..ISC-41 restants en Interview.
```

## Features

> Statut sourcé du code (inventaire 2026-05-27) — `SOLID` = implémenté + utilisé, `PARTIAL` = construit, à fiabiliser/tester, `ACTIF` = chantier en cours (git 30 j), `STUB` = amorcé, `HORS-V1` = non commencé / exclu proposé.

```yaml
- name: Foundation
  status: SOLID
  description: AppShell, ContextSwitcher, auth session, membres/rôles, i18n fr
  satisfies: [ISC-2, ISC-3, ISC-4, ISC-11, ISC-12, ISC-13]
  depends_on: []

- name: LabManagement
  status: PARTIAL  # Semos + timesheets = v1 ; cycles Shape Up = SUPPRIMÉS de l'app v1
  description: Semos (monnaie interne — v1) + timesheets (v1) + guildes/events. Cycles Shape Up (pitches/bets/hill-chart) SUPPRIMÉS de l'app v1 (UI retirée ; code conservé repo) → post-v1. Le retrait est une tâche v1 (ISC-14).
  satisfies: [ISC-14, ISC-15, ISC-16, ISC-17]
  depends_on: [Foundation]

- name: PlantDatabase
  status: ACTIF
  description: Genres/espèces/variétés, recherche, palettes, illustrations Gemini, skill update-species
  satisfies: [ISC-18, ISC-19, ISC-20, ISC-21]
  depends_on: [Foundation]

- name: DesignStudio
  status: PARTIAL
  description: Projets jardins-forêts, plans de plantation, palettes, offres, portail client par token
  satisfies: [ISC-22, ISC-23, ISC-24]
  depends_on: [Foundation, PlantDatabase]

- name: Academy
  status: PARTIAL
  description: Formations, sessions, inscriptions, modales React, calendrier ICS
  satisfies: [ISC-25, ISC-26, ISC-27]
  depends_on: [Foundation]

- name: Nursery
  status: ACTIF
  description: Lots de stock, plants-mères, commandes, ventes inter-Labs
  satisfies: [ISC-28, ISC-29]
  depends_on: [Foundation, PlantDatabase]

- name: Economics
  status: SOLID  # avancé + utilisé au quotidien ; gap v1 = dashboard décisionnel (ISC-42)
  description: bank_sync (Stripe/GoCardless/CODA), réconciliation, caisse, revenus, notes de frais — utilisé quotidiennement. Gap v1 = dashboard financier d'aide à la décision (au-delà d'economics_dashboard_service actuel).
  satisfies: [ISC-30, ISC-31, ISC-32, ISC-33, ISC-34, ISC-35, ISC-39, ISC-42]
  depends_on: [Foundation]

- name: Knowledge
  status: PARTIAL  # fonctionnellement avancé ; gap "usage quotidien" reste à définir avec Michael
  description: Fonctionnellement avancé (page 736 l. : éditeur riche TipTap, CRUD topics/sections, recherche, commentaires, révisions, bookmarks, pièces jointes, pin/archive ; 198 topics en prod). PAS de spec produit. Probes prod 2026-05-27 — import Notion = hors v1 (décidé) ; workflow brouillon/publié = champ `status` OK mais 0 brouillon / 198 publiés (inutilisé, pas bloquant) ; sujets liés = endpoint 200 mais VIDE pour 0/10 topics → câblé mais ne produit rien. Seul vrai candidat de gap v1 = sujets liés (à confirmer).
  satisfies: [ISC-36, ISC-37]
  depends_on: [Foundation]

- name: Strategy
  status: PARTIAL  # v1 = délibérations seulement (déjà en prod) ; reste = post-v1
  description: v1 = DÉLIBÉRATIONS uniquement (proposals / deliberations / deciders / comments / reactions — déjà en prod, présentes jusque sur le Home). Reste = frameworks, axes, key results, ressources (stratégie long terme) → post-v1.
  satisfies: [ISC-44]
  depends_on: [Foundation]

- name: Marketplace
  status: PARTIAL  # DANS v1 (prêt 01/09) — couplé aux Semos
  description: Marketplace INTERNE de produits & services entre membres, prix/échange en Semos (monnaie interne). DANS v1 (prêt 01/09). Dépend de l'intégrité Semos.
  satisfies: [ISC-43]
  depends_on: [Foundation, LabManagement]

- name: Website
  status: HORS-V1  # projet séparé (confirmé Interview)
  description: Site web public — PROJET SÉPARÉ, hors de cet ISA (confirmé). Les endpoints publics actuels (home/articles/events/courses) + Astro restent mais ne sont pas un objectif v1.
  satisfies: []
  depends_on: []

- name: CrossCutting
  status: PARTIAL
  description: Health, RBAC admin, contrat OpenAPI + CI, déploiement Hatchbox, recherche globale, multi-org
  satisfies: [ISC-1, ISC-5, ISC-6, ISC-7, ISC-8, ISC-9, ISC-10]
  depends_on: [Foundation]

- name: CitizenEngagement
  status: HORS-V1
  description: Contributions citoyennes, Food Forest Heroes, chantiers — milestone 8, non commencé
  satisfies: [ISC-38]
  depends_on: []

- name: PartnerPortal
  status: HORS-V1
  description: Espace institutions, allocation de fonds, reporting RSE — milestone 9, non commencé
  satisfies: [ISC-38]
  depends_on: []
```

## Decisions

- 2026-05-27 14:00: **Seed généré** depuis le repo (product-overview, MILESTONES, CLAUDE.md, inventaire contrôleurs/modèles/pages, git 30 j). Brouillon — relecture humaine requise.
- 2026-05-27 14:00: **Contradiction de statut détectée.** `MILESTONES.md` marque Plant DB / Design / Academy / Nursery « non commencé », mais le code (tables `plant_*`/`design_*`/`academy_*`/`nursery_*`, pages Inertia, contrôleurs) les montre largement construits. → MILESTONES.md est périmé. L'ISA devient la source de vérité du statut ; MILESTONES.md à archiver/rediriger vers l'ISA.
- 2026-05-27 14:00: **Bornes v1.0 (Goal + Out of Scope) = décisions produit de Michael, NON tranchées ici.** Proposition : v1 = domaines opérationnels internes (Foundation, Lab, Plants, Design, Academy, Nursery, Economics, Knowledge) ; Strategy/Marketplace/Website-CMS à trancher ; Citizen Engagement & Partner Portal hors-v1. À confirmer en Interview.
- 2026-05-27 14:00: Drift docs constaté — CLAUDE.md dit « 60+ tables / 11 contrôleurs / 5 domaines » alors que réel = 155 tables / ~35 contrôleurs / ~13 domaines ; README dit « Rails 7.1 » au lieu de 8.1. Corrections ciblées du CLAUDE.md faites en parallèle (pas de réécriture).
- 2026-05-27 (Interview, refined): périmètre des domaines non cités tranché — **Cycles Shape Up : RETIRÉS de v1** (post-v1 ; à préciser : masquer l'UI ou seulement hors-fiabilisation ?). **Semos : DANS v1** (actifs au 01/09). **Timesheets : DANS v1**. **Economics : DANS v1**, déjà avancé + utilisé quotidiennement ; gap v1 = **dashboard financier décisionnel** (→ ISC-42). **Knowledge : voulu en v1 mais gap NON DÉFINI** — à surfacer depuis le code (Michael ne se souvient pas du manquant).
- 2026-05-27 (Interview, refined): **audience v1 confirmée** = tout le collectif du **Lab Wallonie-Bruxelles** (seul Lab) + **clients** (projets via My Semisto) + **inscrits Academy** (déjà via My Semisto) ; **rien de public**. Capacités porteuses confirmées : gérer projets design (+ réaliser le design dans l'UI), activités Academy, stock/commandes pépinière, palettes végétales, **agenda dans Terranova en remplacement de Notion**, recherche plantes efficace. Réponse Interview = source canonique sur l'audience/Goal.
- 2026-05-27 (Interview, refined): borderline tranchés — **Website public = PROJET SÉPARÉ** (hors de cet ISA). **Marketplace = DANS v1** (prêt 01/09) : marketplace interne de produits/services échangés en **Semos** → couplé à l'intégrité Semos (ISC-43 dépend de ISC-15). **Strategy = NON tranché** : usage = gouvernance + stratégie long terme (compréhension incertaine de Michael) ; par défaut hors liste v1 jusqu'à confirmation.
- 2026-05-27 (Interview): **date 01/09 = objectif SOUPLE** (réponse b) — débordement d'1–2 semaines acceptable sur un domaine ; arbitrage = tenir le périmètre, glisser un peu plutôt que couper. → principe « Périmètre > date » ajouté.
- 2026-05-27 (Interview): **session Interview terminée (4 questions).** Périmètre v1 verrouillé (audience + capacités porteuses + domaines in/out + posture date). **Restent ouverts** : (1) Strategy in/out v1 ; (2) gap « usage quotidien » de Knowledge à définir (investiguer le code) ; (3) « retirer » Shape Up = masquer l'UI ou seulement de-scoper la fiabilisation ?
- 2026-05-27 (Interview, suite): résolution des 3 ouverts — **Shape Up : SUPPRESSION COMPLÈTE pour le moment** (UI/accès retirés ; devient une tâche v1, ISC-14 reformulé en critère de retrait). **Strategy : seules les DÉLIBÉRATIONS dans v1** (déjà en prod, présentes jusque sur le Home ; reste = post-v1 ; ISC-44 ajouté). **Knowledge analysé** : fonctionnellement avancé (éditeur riche TipTap, CRUD topics/sections, révisions, commentaires, bookmarks, recherche, brouillon/publié) mais SANS spec produit ; aucun gap criant dans le code → le « manque pour usage quotidien » reste à définir avec Michael (candidats : Notion-dans-l'UI, finalisation brouillon/publié, sujets liés).
- 2026-05-27 (probes prod API, lecture seule): Knowledge vérifié — health/profile 200. `status` : **198 publiés / 0 brouillon** (workflow présent mais inutilisé → pas un blocage v1). **Sujets liés** : `GET /knowledge/topics/:id/related` répond 200 mais **VIDE pour 0/10 topics testés** → feature câblée mais ne délivre aucune relation. Notion-dans-l'UI écarté par Michael. ⇒ seul candidat de gap v1 pour Knowledge = **sujets liés** (à confirmer si on le met dans v1).
- 2026-05-27 (Interview): **sujets liés (related) confirmés HORS v1** par Michael. Knowledge est donc considéré v1-ready (sous réserve d'une passe de vérif live le moment venu). Cadrage du périmètre v1 = **terminé, aucun point ouvert**.

## Changelog

<!-- Vide jusqu'au premier cycle conjecture/réfutation/apprentissage. Alimenté en phase LEARN via Skill("ISA", "append changelog ..."). -->
