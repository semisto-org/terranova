#!/usr/bin/env bash
# Nova — installe la config Claude personnelle de Michael (mhulet/claude-config) dans le runner.
#
# Mode CI-safe : on importe la SUBSTANCE (agents, skills, commands) — donc Forge, les skills
# projet, les agents PAI sont disponibles — mais PAS les hooks liés à la machine locale
# (Pulse sur :31337, RTK, classifier Sonnet, voix). Ces hooks échoueraient ou coûteraient
# des tokens inutilement en CI. Le CLAUDE.md du projet Terranova (présent dans le repo)
# fournit déjà les conventions ; settings.ci.json neutralise les hooks.
#
# Pour passer un jour en "config complète", remplacer ce script par `./install.sh` du repo
# claude-config (au risque d'erreurs de hooks en CI).
set -euo pipefail

DEST="$HOME/.claude"
mkdir -p "$DEST"

if [ -z "${CLAUDE_CONFIG_TOKEN:-}" ]; then
  echo "::warning::CLAUDE_CONFIG_TOKEN absent — Nova tourne sans la config perso (skills/agents PAI indisponibles, conventions projet OK via CLAUDE.md du repo)."
  cp "$GITHUB_WORKSPACE/.github/nova/settings.ci.json" "$DEST/settings.json"
  exit 0
fi

TMP="$(mktemp -d)"
# Token via header d'autorisation (jamais dans l'URL → pas de fuite si erreur de clone).
AUTH_B64="$(printf 'x-access-token:%s' "$CLAUDE_CONFIG_TOKEN" | base64 | tr -d '\n')"
git -c "http.extraheader=AUTHORIZATION: basic ${AUTH_B64}" clone --depth 1 \
  "https://github.com/mhulet/claude-config.git" "$TMP/cfg" >/dev/null 2>&1

for d in agents skills commands; do
  if [ -d "$TMP/cfg/$d" ]; then
    cp -R "$TMP/cfg/$d" "$DEST/"
    echo "  + $d/"
  fi
done

# settings CI-safe : aucun hook localhost/Pulse/RTK/classifier.
cp "$GITHUB_WORKSPACE/.github/nova/settings.ci.json" "$DEST/settings.json"

rm -rf "$TMP"
echo "Config perso installée (mode CI-safe) dans $DEST"
