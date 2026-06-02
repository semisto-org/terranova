#!/usr/bin/env bash
# Nova — découverte des issues éligibles au traitement nocturne.
# Sortie : `matrix` (JSON array de numéros) et `count` (entier) dans $GITHUB_OUTPUT.
#
# Éligible = label `nova:auto` ET PAS `nova:blocked` ET PAS `nova:pr-open`
#            ET auteur ayant un accès write au repo (admin/maintain/write).
#
# ⚠️ SÉCURITÉ : ce repo est PUBLIC. Le titre/corps/commentaires d'une issue sont injectés
# dans le prompt d'un agent qui tourne avec --dangerously-skip-permissions. Le label `nova:auto`
# n'est PAS une frontière de sécurité (un tiers peut tenter de l'apposer). La vraie barrière est
# le filtre de PERMISSION ci-dessous : seules les issues d'un auteur ayant un accès write au repo
# entrent dans la matrice. (On n'utilise PAS author_association : sur un repo d'org, un admin dont
# l'appartenance est privée apparaît `CONTRIBUTOR`.) Ne JAMAIS relâcher ce filtre sur le planifié.
set -euo pipefail

MAX="${MAX_ISSUES:-8}"
REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY manquant}"
TRUSTED=" admin maintain write "

emit() { # $1=matrix $2=count
  echo "matrix=$1" >> "$GITHUB_OUTPUT"
  echo "count=$2"  >> "$GITHUB_OUTPUT"
}

# Déclenchement manuel : seul un utilisateur avec accès write peut lancer workflow_dispatch,
# il prend la responsabilité de l'issue ciblée → on valide juste que c'est bien un entier.
if [ -n "${INPUT_ISSUE:-}" ]; then
  if ! [[ "$INPUT_ISSUE" =~ ^[0-9]+$ ]]; then
    echo "::error::INPUT_ISSUE invalide (entier attendu): '$INPUT_ISSUE'" >&2
    exit 1
  fi
  emit "[$INPUT_ISSUE]" 1
  echo "Déclenchement manuel : issue #${INPUT_ISSUE}"
  exit 0
fi

# Candidats : label nova:auto, hors blocked/pr-open.
candidates="$(gh issue list \
  --state open --label "nova:auto" --json number,labels,author --limit 100 \
  --jq '[ .[]
          | (.labels | map(.name)) as $l
          | select( ($l | index("nova:blocked") | not)
                and ( $l | index("nova:pr-open") | not) )
          | {number, login: .author.login} ]' 2>/dev/null || echo '[]')"
[ -z "$candidates" ] && candidates='[]'

# Filtre de confiance basé sur la PERMISSION RÉELLE de l'auteur sur le repo (admin/maintain/write).
# On NE se fie PAS à `author_association` : sur un repo d'organisation, un membre dont l'appartenance
# est privée apparaît `CONTRIBUTOR` même s'il est admin. La permission, elle, est fiable.
selected='[]'
skipped=''
while IFS=$'\t' read -r n login; do
  [ -z "${n:-}" ] && continue
  perm="$(gh api "repos/$REPO/collaborators/$login/permission" --jq '.role_name // .permission' 2>/dev/null || echo none)"
  if [[ "$TRUSTED" == *" $perm "* ]]; then
    selected="$(echo "$selected" | jq -c ". + [$n]")"
  else
    skipped="$skipped #$n($login:$perm)"
  fi
done < <(echo "$candidates" | jq -r '.[] | "\(.number)\t\(.login)"')

matrix="$(echo "$selected" | jq -c ".[:$MAX]")"
count="$(echo "$matrix" | jq 'length')"
emit "$matrix" "$count"

[ -n "$skipped" ] && echo "::warning::Issues nova:auto ignorées car auteur sans accès write :$skipped"
echo "Sélection (plafond ${MAX}) : $matrix  (count=$count)"
