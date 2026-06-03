# 🌙 Nova — agent nocturne (exécution **locale**)

Nova est une routine Claude Code qui traite chaque nuit les issues marquées `nova:auto`.
Elle tourne désormais **en local sur la machine de Michael** (via `launchd`), dans son
environnement PAI complet — et non plus sur GitHub Actions (le mode CI-safe privait Nova
de Pulse, des hooks, de la voix et du classifier). Pour chaque issue éligible, Nova :

1. **Trie** : assez d'infos pour avancer en confiance ?
2. **Floue** → commentaire de questions + label `nova:blocked`.
3. **Claire** → branche, code, tests, **PR draft** liée à l'issue (label `nova:pr-open`).

## Installation (une fois)

```bash
bash .nova/install.sh            # installe le bootstrap + le job launchd (03:00 quotidien)
bash .nova/install.sh --dry-run  # idem, puis teste la plomberie (découverte seule)
```

Ça crée :

| Chemin | Rôle |
|--------|------|
| `~/.local/bin/nova-terranova` | bootstrap : env (PATH/asdf) + `git reset --hard origin/main` du clone dédié + lance `run-local.sh` |
| `~/Library/LaunchAgents/org.semisto.nova.plist` | planification nocturne |
| `~/.local/state/nova/terranova` | **clone dédié** (n'interfère jamais avec ton dossier de travail) |
| `~/.local/state/nova/nova.log` | logs |

> Seul le bootstrap est spécifique à la machine. Toute la logique (`run-local.sh`,
> `process-issue.sh`, `triage-and-build.md`) vit dans le repo et se met à jour
> automatiquement à chaque run (le bootstrap repart de `origin/main`). Si tu changes
> `run-local.sh` lui-même, relance `install.sh`.

## Commandes utiles

```bash
bash ~/.local/bin/nova-terranova              # lancer Nova maintenant
NOVA_DRY_RUN=1 bash ~/.local/bin/nova-terranova   # découverte seule, sans traitement
tail -f ~/.local/state/nova/nova.log          # suivre les logs
launchctl list | grep org.semisto.nova        # vérifier le job
launchctl unload ~/Library/LaunchAgents/org.semisto.nova.plist   # désactiver
```

## Cycle de vie des labels

| Label | Sens | Qui le pose |
|-------|------|-------------|
| `nova:auto` | Opt-in : Nova traitera cette issue | **toi** |
| `nova:blocked` | Nova a des questions / a échoué — voir commentaire | Nova |
| `nova:pr-open` | PR draft ouverte, en attente de review | Nova |

- Relancer une issue bloquée : réponds dans l'issue, puis **retire `nova:blocked`**.
- Une issue `nova:auto` + `nova:pr-open`/`nova:blocked` est ignorée la nuit suivante.
- Plafond : **8 issues/nuit** (`MAX_ISSUES`).

## 🔒 Sécurité

Le repo est **public** et Nova exécute `claude -p --dangerously-skip-permissions` à partir
d'un prompt qui inclut le contenu de l'issue. Donc :

- **`nova:auto` n'est PAS une frontière de sécurité.** La vraie barrière est le **filtre de
  permission** (`run-local.sh`) : seules les issues dont l'**auteur a un accès write au repo**
  (admin/maintain/write) sont traitées. On n'utilise pas `author_association` (peu fiable sur
  un repo d'org). Ne jamais relâcher ce filtre.
- Le corps de l'issue est encadré comme **DONNÉE NON FIABLE** dans le prompt (anti prompt-injection).
- `claude` tourne sans `GH_TOKEN` dans son environnement ; les effets git/GitHub (commit, push,
  PR) sont faits de façon déterministe par `process-issue.sh`, après l'exécution du modèle.

## Compromis vs cloud

- ✅ Environnement PAI complet (skills, agents, voix, hooks).
- ⚠️ Ne tourne que quand le Mac est allumé/réveillé (launchd rattrape au réveil si l'heure est passée).
- ⚠️ `db:test:prepare` purge la base `terranova_test` locale (à 03:00 — pendant ton sommeil).
- ℹ️ Les PR ouvertes par Nova déclenchent quand même la CI GitHub (`.github/workflows/ci.yml`).

## Fichiers

| Fichier | Rôle |
|---------|------|
| `install.sh` | Installe bootstrap + launchd (idempotent). |
| `run-local.sh` | Orchestrateur : découverte + filtre permission + boucle. |
| `process-issue.sh` | Traitement d'une issue (triage → code → commit/PR ou blocage). |
| `triage-and-build.md` | Le prompt/consignes données à Claude. |
