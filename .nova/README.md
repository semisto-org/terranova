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
| `nova:waiting` | En attente d'une dépendance non mergée — **se retire seul**, aucune action requise | Nova |
| `nova:blocked` | Nova a une vraie question (irréversible/produit) ou a échoué — voir commentaire | Nova |
| `nova:assumptions` | PR ouverte avec des **choix réversibles** tranchés par Nova — à valider en review | Nova |
| `nova:pr-open` | PR draft ouverte, en attente de review | Nova |

- Relancer une issue bloquée : réponds dans l'issue, puis **retire `nova:blocked`**.
- `nova:waiting` ne demande **rien** : Nova reprend l'issue d'elle-même dès que ses dépendances ferment.
- Une issue `nova:auto` + `nova:pr-open`/`nova:blocked`/`nova:waiting` est ignorée la nuit suivante.
- Plafond : **8 issues/nuit** (`MAX_ISSUES`).

## Dépendances & séquençage (gating)

Une issue peut déclarer ses **dépendances bloquantes** — champ « Dépendances » du gabarit, ou une
ligne `Dépend de : #102, #103` dans le corps. Tant qu'une dépendance n'est pas **fermée** (= sa PR
mergée), Nova ne traite pas l'issue : elle pose `nova:waiting` et passe — **sans poser de question**,
car c'est du séquençage, pas une ambiguïté. L'issue redevient candidate automatiquement à la
fermeture de ses dépendances.

→ Tu peux donc coller `nova:auto` sur **toute une chaîne d'epic d'un coup** : Nova la déroule dans
l'ordre, nuit après nuit, au lieu de bloquer tout le lot le premier soir.

## Défauts standing — `DEFAULTS.md`

[`DEFAULTS.md`](DEFAULTS.md) contient les réponses **permanentes** de Michael aux questions
récurrentes (fuseau, nommage, placement des nouvelles surfaces, champs legacy…). Nova le charge à
chaque issue et applique ces défauts sans redemander. **Quand un blocage s'avère n'être qu'une
préférence, ajoute-la dans ce fichier** — c'est l'investissement le plus rentable pour l'autonomie
de Nova. Une section « à compléter » y liste les décisions produit encore ouvertes.

## Doctrine de triage — décide-et-note plutôt que bloquer

Nova classe chaque incertitude en trois cases (voir `triage-and-build.md`) :
- **① Dépendance manquante** → `failed`/`waiting`, jamais une question.
- **② Choix réversible** (forme de table, emplacement d'un champ, nommage avec précédent…) → Nova
  **tranche, construit, et documente** sous « Hypothèses » dans la PR (+ `nova:assumptions`). La PR
  draft *est* la question : tu réagis sur du concret en review.
- **③ Décision irréversible/produit** (changer un écran par défaut, règle métier, argent) → blocage.

Un epic déguisé en issue est **découpé par Nova elle-même** (plus petite tranche utile livrée,
reste listé dans les hypothèses), sans demander l'autorisation de découper.

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

## Rapport de fin de session (Telegram)

À la fin de chaque nuit où elle a traité au moins une issue, Nova envoie un **rapport court sur Telegram** : pour chaque issue traitée, son **titre** et son **statut** (✅ PR draft ouverte, ❓ bloqué, ❌ échec…), plus une ligne « en attente de dépendances » s'il y a lieu.

Configuration (secrets — à mettre dans l'env du job, **pas** dans le repo) :

```bash
export TELEGRAM_BOT_TOKEN="123456:ABC…"   # token du bot (via BotFather)
export TELEGRAM_CHAT_ID="123456789"        # id du chat/canal destinataire
```

Ajoute ces deux variables à l'environnement du bootstrap `~/.local/bin/nova-terranova` (ou au bloc `EnvironmentVariables` du plist launchd). Tant qu'elles sont absentes, l'envoi est un **no-op silencieux** : le run nocturne n'est jamais impacté. Un échec d'envoi Telegram (réseau, token invalide) est également non bloquant.

- Pour trouver ton `TELEGRAM_CHAT_ID` : écris un message au bot, puis `curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates"` et lis `result[].message.chat.id`.
- Aucun rapport n'est envoyé les nuits **sans** issue traitée (pas de bruit quotidien). Dis-le si tu veux au contraire un battement de cœur « rien à traiter cette nuit ».
- Le rapport est aussi envoyé si la session **s'interrompt** sur un échec d'infra (`bundle install`).

## Compromis vs cloud

- ✅ Environnement PAI complet (skills, agents, voix, hooks).
- ⚠️ Ne tourne que quand le Mac est allumé/réveillé (launchd rattrape au réveil si l'heure est passée).
- ⚠️ `db:test:prepare` purge la base `terranova_test` locale (à 03:00 — pendant ton sommeil).
- ℹ️ Les PR ouvertes par Nova déclenchent quand même la CI GitHub (`.github/workflows/ci.yml`).

## Fichiers

| Fichier | Rôle |
|---------|------|
| `install.sh` | Installe bootstrap + launchd (idempotent). |
| `run-local.sh` | Orchestrateur : découverte + filtre permission + **gate de dépendances** + boucle. |
| `process-issue.sh` | Traitement d'une issue (triage → code → commit/PR ou blocage). |
| `triage-and-build.md` | Le prompt/consignes données à Claude (doctrine décide-et-note). |
| `DEFAULTS.md` | Défauts standing de Michael, chargés dans le prompt à chaque issue. |
| `notify-telegram.sh` | Envoie un message court sur Telegram (rapport de fin de session). |
