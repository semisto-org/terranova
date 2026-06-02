# 🌙 Nova — agent nocturne de traitement des issues

Nova est une **routine Claude Code** qui tourne sur GitHub Actions chaque nuit. Pour chaque
issue marquée `nova:auto`, Nova :

1. **Trie** l’issue : a-t-elle assez d’infos pour être traitée en confiance ?
2. Si **floue** → ajoute un commentaire avec ses questions et pose le label `nova:blocked`.
3. Si **claire** → crée une branche, code, lance les tests, et ouvre une **PR draft** liée à l’issue (label `nova:pr-open`).

Le tout en utilisant la config Claude personnelle de Michael (`mhulet/claude-config`), en mode CI-safe.

## Cycle de vie des labels

| Label | Sens | Qui le pose |
|-------|------|-------------|
| `nova:auto` | Opt-in : Nova traitera cette issue | **toi** |
| `nova:blocked` | Nova a des questions / a échoué — voir commentaire | Nova |
| `nova:pr-open` | PR draft ouverte, en attente de ta review | Nova |

- Pour **relancer** une issue bloquée : réponds dans l’issue, puis **retire `nova:blocked`**.
- Une issue `nova:auto` + `nova:pr-open` ou `nova:blocked` est **ignorée** par la nuit suivante.
- Plafond : **8 issues/nuit** (modifiable via `MAX_ISSUES` dans le workflow), 3 en parallèle.

## 🔒 Modèle de sécurité (important)

Ce repo est **public** et Nova exécute du code (`claude -p --dangerously-skip-permissions`) à
partir d’un prompt qui inclut le contenu de l’issue. Donc :

- **`nova:auto` n’est PAS une frontière de sécurité.** La vraie barrière est le **filtre de
  permission** : sur le run planifié, seules les issues dont l’**auteur a un accès write au repo**
  (`admin`/`maintain`/`write`) entrent dans la matrice (`discover-issues.sh`). Une issue d’un
  compte externe portant `nova:auto` est **ignorée** (un warning le signale dans le log du run).
  → On se base sur la permission, **pas** sur `author_association` (sur un repo d’organisation, un
  admin dont l’appartenance est privée apparaît `CONTRIBUTOR` et serait rejeté à tort).
  → Conséquence : pour traiter la demande d’un externe, un mainteneur recrée/ré-ouvre l’issue.
- Le contenu de l’issue est passé à Claude encadré comme **donnée non fiable** ; le prompt lui
  interdit d’obéir à des instructions qui s’y cacheraient (injection de prompt).
- `GH_TOKEN` est **retiré de l’environnement de Claude** pendant l’exécution du modèle ; seuls les
  effets de bord déterministes du script (commit/push/PR) y ont accès.
- Les logs bruts de Claude ne sont **jamais** publiés dans un commentaire (risque de fuite de
  secret) ; ils restent dans le run GitHub Actions (accès mainteneurs).
- Le **déclenchement manuel** (`workflow_dispatch` sur un numéro d’issue) **bypasse** le filtre
  auteur : il est réservé aux comptes ayant accès write, qui prennent la responsabilité de l’issue
  ciblée. Le numéro est validé (entier) pour éviter toute injection.

## Configuration requise (une seule fois)

### 1. Secrets du repo
`Settings → Secrets and variables → Actions → New repository secret`

| Secret | Valeur | Pourquoi |
|--------|--------|----------|
| `CLAUDE_CODE_OAUTH_TOKEN` | Token OAuth d’abonnement Claude | Auth Claude sans coût API. Générer avec `claude setup-token` en local. |
| `CLAUDE_CONFIG_TOKEN` | PAT GitHub (scope `repo`, lecture de `mhulet/claude-config`) | Cloner ta config perso (privée) dans le runner. |

> Sans `CLAUDE_CONFIG_TOKEN`, Nova tourne quand même : elle perd tes skills/agents PAI mais
> garde les conventions du projet (`CLAUDE.md` du repo).

### 2. Réglage du repo
`Settings → Actions → General → Workflow permissions` :
- ✅ **Read and write permissions**
- ✅ **Allow GitHub Actions to create and approve pull requests**

(Sans ça, Nova ne peut pas ouvrir de PR.)

## Tester sans attendre la nuit

`Actions → « Nova — traitement nocturne des issues » → Run workflow`, en renseignant un
numéro d’issue précis (champ *issue*). Laisser vide = toutes les `nova:auto`.

## Architecture (fichiers)

| Fichier | Rôle |
|---------|------|
| `.github/workflows/nova-nightly.yml` | Cron + 2 jobs (discover → process en matrice) |
| `.github/nova/discover-issues.sh` | Sélectionne les issues éligibles → matrice |
| `.github/nova/install-config.sh` | Installe `mhulet/claude-config` (CI-safe) dans le runner |
| `.github/nova/run-issue.sh` | Orchestre 1 issue : prompt → `claude -p` → effets git/gh déterministes |
| `.github/nova/triage-and-build.md` | Le prompt de Nova (triage + build + format du verdict) |
| `.github/nova/settings.ci.json` | Réglages Claude CI-safe (aucun hook localhost) |

**Principe** : Claude **décide et code** ; le bash **fait les effets de bord** (branche, commit,
PR, commentaires, labels) de façon déterministe. Code avant prompt.
