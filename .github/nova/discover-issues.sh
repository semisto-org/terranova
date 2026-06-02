#!/usr/bin/env bash
# Nova — découverte des issues éligibles au traitement nocturne.
# Sortie : `matrix` (JSON array de numéros) et `count` (entier) dans $GITHUB_OUTPUT.
#
# Éligible = label `nova:auto` ET PAS `nova:blocked` ET PAS `nova:pr-open`
#            ET auteur de confiance (OWNER/MEMBER/COLLABORATOR).
#
# ⚠️ SÉCURITÉ : ce repo est PUBLIC. Le titre/corps/commentaires d'une issue sont injectés
# dans le prompt d'un agent qui tourne avec --dangerously-skip-permissions. Le label `nova:auto`
# n'est PAS une frontière de sécurité (un tiers peut tenter de l'apposer). La vraie barrière est
# le filtre `author_association` ci-dessous : seules les issues écrites par un membre/collaborateur
# du repo entrent dans la matrice. Ne JAMAIS relâcher ce filtre sur le chemin planifié.
set -euo pipefail

MAX="${MAX_ISSUES:-8}"
REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY manquant}"
TRUSTED=" OWNER MEMBER COLLABORATOR "

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
  --state open --label "nova:auto" --json number,labels --limit 100 \
  --jq '[ .[]
          | (.labels | map(.name)) as $l
          | select( ($l | index("nova:blocked") | not)
                and ( $l | index("nova:pr-open") | not) )
          | .number ]' 2>/dev/null || echo '[]')"
[ -z "$candidates" ] && candidates='[]'

# Filtre auteur de confiance, issue par issue (peu d'issues nova:auto → peu d'appels API).
selected='[]'
skipped=''
for n in $(echo "$candidates" | jq -r '.[]'); do
  assoc="$(gh api "repos/$REPO/issues/$n" --jq '.author_association' 2>/dev/null || echo NONE)"
  if [[ "$TRUSTED" == *" $assoc "* ]]; then
    selected="$(echo "$selected" | jq -c ". + [$n]")"
  else
    skipped="$skipped #$n($assoc)"
  fi
done

matrix="$(echo "$selected" | jq -c ".[:$MAX]")"
count="$(echo "$matrix" | jq 'length')"
emit "$matrix" "$count"

[ -n "$skipped" ] && echo "::warning::Issues nova:auto ignorées car auteur non fiable :$skipped"
echo "Sélection (plafond ${MAX}) : $matrix  (count=$count)"
