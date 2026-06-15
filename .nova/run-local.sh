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

# Fichier de rapport de session : process-issue.sh y consigne une ligne TSV par issue
# traitée (numéro <TAB> titre <TAB> statut <TAB> URL). On le repart à zéro à chaque run.
NOVA_REPORT="${NOVA_REPORT:-/tmp/nova/session-report.tsv}"
export NOVA_REPORT
mkdir -p "$(dirname "$NOVA_REPORT")"
: > "$NOVA_REPORT"
# Initialisés ici pour que le rapport (y compris via le trap de sortie) reste sûr même
# en sortie précoce, avant que la découverte ne les remplisse.
waiting=''; skipped=''
REPORT_SENT=0

# Compile le rapport de session et l'envoie sur Telegram (no-op si non configuré).
# Chaque issue traitée apparaît avec son titre, son statut et un lien (PR ou issue)
# directement ouvrable depuis l'app GitHub. $1 = en-tête court.
send_report() {
  local header="$1" body n=0 footer=''
  REPORT_SENT=1
  if [ -s "$NOVA_REPORT" ]; then
    n="$(grep -c '' "$NOVA_REPORT")"
    body="$(awk -F'\t' '{ printf "• #%s — %s\n  %s\n", $1, $2, $3; if ($4 != "") printf "  %s\n", $4 }' "$NOVA_REPORT")"
  fi
  [ -n "${waiting// }" ] && footer="$footer"$'\n'"⏳ En attente de dépendances :${waiting}"
  [ -n "${skipped// }" ] && footer="$footer"$'\n'"⚠️ Ignorées (auteur sans accès write) :${skipped}"
  printf '🌙 Nova — %s (%s)\n%s issue(s) traitée(s)\n\n%s%s\n' \
    "$header" "$(date '+%Y-%m-%d %H:%M')" "$n" "${body:-—}" "$footer" \
    | bash .nova/notify-telegram.sh || true
}

# Filet de sécurité : garantit l'envoi d'un rapport même sur sortie inattendue ou erreur.
# Si un envoi explicite a déjà eu lieu (REPORT_SENT=1), on ne double pas. Le dry-run
# (test de plomberie) ne notifie pas.
finish() {
  local rc=$?
  [ "$REPORT_SENT" = 1 ] && return
  [ "${NOVA_DRY_RUN:-0}" = "1" ] && return
  if [ "$rc" -ne 0 ]; then send_report "session interrompue (erreur rc=$rc)"; else send_report "session terminée"; fi
}
trap finish EXIT

# Extrait les numéros d'issues bloquantes déclarés dans un corps d'issue.
# Reconnaît DEUX formats : la section "### Dépendances…" du gabarit GitHub Form
# (heading + valeur sur lignes séparées) ET les mentions en ligne "Dépend de #104".
# Le marqueur "épend" couvre Dépend/dépend/Dépendances sans IGNORECASE (absent du
# BSD awk de macOS). Émet les numéros, un par ligne.
deps_of(){
  printf '%s' "${1:-}" | awk '
    function emit(s){ while (match(s, /#[0-9]+/)) { print substr(s, RSTART+1, RLENGTH-1); s = substr(s, RSTART+RLENGTH) } }
    /^###/ { insec = ($0 ~ /épend/) ? 1 : 0 }   # section "### Dépendances…" en cours ? (toggle sur "épend")
    {
      # Inline: exiger la formule réelle "dépend de" (contiguë) — rejette "ne dépend PAS de …,
      # se branchera sur #102 plus tard" (brique autonome) et ignore le "Epic : #101" devant.
      if ($0 ~ /épend de/) { p = index($0, "épend de"); emit(substr($0, p)) }
      else if (insec)      { emit($0) }   # ligne valeur d une section "### Dépendances": tous les #N
    }'
}

# Renvoie (sur stdout) les dépendances NON satisfaites (issues encore ouvertes) d'une
# issue donnée, à partir de son corps. Une dépendance close (= PR mergée) est satisfaite.
unmet_deps(){
  local self="$1" body="$2" d st out=''
  for d in $(deps_of "$body" | sort -u); do
    [ "$d" = "$self" ] && continue   # pas d'auto-dépendance
    st="$(gh issue view "$d" --repo "$REPO" --json state --jq '.state' 2>/dev/null || echo OPEN)"
    [ "$st" = "CLOSED" ] || out="$out #$d"
  done
  echo "$out"
}

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
waiting=''
while IFS=$'\t' read -r n login; do
  [ -z "${n:-}" ] && continue
  perm="$(gh api "repos/$REPO/collaborators/$login/permission" --jq '.role_name // .permission' 2>/dev/null || echo none)"
  if [[ "$TRUSTED" != *" $perm "* ]]; then
    skipped="$skipped #$n($login:$perm)"
    continue
  fi
  # --- Gate de DÉPENDANCES : ne pas traiter (ni bloquer) une issue dont une dépendance
  # n'est pas encore mergée. C'est du séquençage, pas une question — l'issue se relance
  # seule quand la dépendance ferme. Label `nova:waiting` = transparence, zéro action requise.
  body="$(gh issue view "$n" --repo "$REPO" --json body --jq '.body' 2>/dev/null || echo '')"
  unmet="$(unmet_deps "$n" "$body")"
  if [ -n "${unmet// }" ]; then
    waiting="$waiting #$n→[$unmet ]"
    # Pas de mutation en dry-run (la découverte doit rester sans effet de bord).
    [ "${NOVA_DRY_RUN:-0}" = "1" ] || gh issue edit "$n" --repo "$REPO" --add-label "nova:waiting" >/dev/null 2>&1 || true
    continue
  fi
  # Dépendances satisfaites : retirer un éventuel `nova:waiting` résiduel avant traitement.
  [ "${NOVA_DRY_RUN:-0}" = "1" ] || gh issue edit "$n" --repo "$REPO" --remove-label "nova:waiting" >/dev/null 2>&1 || true
  selected+=("$n")
done < <(echo "$candidates" | jq -r '.[] | "\(.number)\t\(.login)"')

# Plafond
selected=("${selected[@]:0:$MAX_ISSUES}")

[ -n "$skipped" ] && log "WARN: issues nova:auto ignorées (auteur sans accès write) :$skipped"
[ -n "$waiting" ] && log "EN ATTENTE de dépendances (relancées seules à la fermeture) :$waiting"
log "${#selected[@]} issue(s) à traiter (plafond $MAX_ISSUES) : ${selected[*]:-aucune}"

if [ "${NOVA_DRY_RUN:-0}" = "1" ]; then
  log "DRY RUN — arrêt avant traitement."
  exit 0
fi

[ "${#selected[@]}" -eq 0 ] && { log "rien à faire."; send_report "rien à traiter cette nuit"; exit 0; }

# --- Dépendances (nécessaires à db:test:prepare + outils) — seulement s'il y a du travail ---
log "bundle install…"
bundle install --quiet || { log "ERROR: bundle install a échoué"; send_report "session interrompue (bundle install)"; exit 1; }
log "yarn install…"
yarn install --frozen-lockfile >/dev/null 2>&1 || log "WARN: yarn install (frozen) a échoué"

for N in "${selected[@]}"; do
  log "──────── issue #$N ────────"
  ISSUE_NUMBER="$N" bash .nova/process-issue.sh || log "WARN: process-issue #$N a retourné non-zéro"
done
log "terminé."
send_report "session terminée"
