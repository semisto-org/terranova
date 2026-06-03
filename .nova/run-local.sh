#!/usr/bin/env bash
# Nova (local) — orchestrateur du traitement nocturne des issues.
#
# Lancé par le bootstrap ~/.local/bin/nova-terranova (voir .nova/install.sh), qui a déjà :
#   - configuré PATH + asdf (gh, claude, ruby/node/yarn, bun),
#   - cloné/mis à jour le clone dédié sur origin/main,
#   - positionné cwd = racine du clone.
#
# Ce script : installe les deps, découvre les issues éligibles, et traite chacune via
# .nova/process-issue.sh. Variables : MAX_ISSUES (défaut 8), NOVA_DRY_RUN=1 (s'arrête
# après la découverte, sans rien traiter — pour tester la plomberie).
set -uo pipefail

REPO="semisto-org/terranova"
MAX_ISSUES="${MAX_ISSUES:-8}"
TRUSTED=" admin maintain write "
log(){ echo "[nova $(date '+%H:%M:%S')] $*"; }

log "clone $(pwd) @ $(git rev-parse --short HEAD 2>/dev/null)"

# --- Découverte : nova:auto, ouvertes, ni blocked ni pr-open ---
candidates="$(gh issue list --repo "$REPO" \
  --state open --label "nova:auto" --json number,labels,author --limit 100 \
  --jq '[ .[]
          | (.labels | map(.name)) as $l
          | select( ($l | index("nova:blocked") | not)
                and ( $l | index("nova:pr-open") | not) )
          | {number, login: .author.login} ]' 2>/dev/null || echo '[]')"
[ -z "$candidates" ] && candidates='[]'

# --- Filtre de SÉCURITÉ : auteur avec accès write réel au repo ---
# Le repo est PUBLIC et le corps de l'issue est injecté dans un agent --dangerously-skip-permissions.
# `nova:auto` n'est PAS une frontière de sécurité. On NE se fie PAS à author_association (un admin
# d'org à appartenance privée apparaît CONTRIBUTOR). Seule la permission réelle compte.
selected=()
skipped=''
while IFS=$'\t' read -r n login; do
  [ -z "${n:-}" ] && continue
  perm="$(gh api "repos/$REPO/collaborators/$login/permission" --jq '.role_name // .permission' 2>/dev/null || echo none)"
  if [[ "$TRUSTED" == *" $perm "* ]]; then
    selected+=("$n")
  else
    skipped="$skipped #$n($login:$perm)"
  fi
done < <(echo "$candidates" | jq -r '.[] | "\(.number)\t\(.login)"')

# Plafond
selected=("${selected[@]:0:$MAX_ISSUES}")

[ -n "$skipped" ] && log "WARN: issues nova:auto ignorées (auteur sans accès write) :$skipped"
log "${#selected[@]} issue(s) à traiter (plafond $MAX_ISSUES) : ${selected[*]:-aucune}"

if [ "${NOVA_DRY_RUN:-0}" = "1" ]; then
  log "DRY RUN — arrêt avant traitement."
  exit 0
fi

[ "${#selected[@]}" -eq 0 ] && { log "rien à faire."; exit 0; }

# --- Dépendances (nécessaires à db:test:prepare + outils) — seulement s'il y a du travail ---
log "bundle install…"
bundle install --quiet || { log "ERROR: bundle install a échoué"; exit 1; }
log "yarn install…"
yarn install --frozen-lockfile >/dev/null 2>&1 || log "WARN: yarn install (frozen) a échoué"

for N in "${selected[@]}"; do
  log "──────── issue #$N ────────"
  ISSUE_NUMBER="$N" bash .nova/process-issue.sh || log "WARN: process-issue #$N a retourné non-zéro"
done
log "terminé."
