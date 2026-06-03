#!/usr/bin/env bash
# Nova (local) — installe le runner nocturne sur cette machine (macOS / launchd).
#
# Idempotent. Crée :
#   ~/.local/bin/nova-terranova                       — bootstrap (env + clone + run-local.sh)
#   ~/Library/LaunchAgents/org.semisto.nova.plist     — planification nocturne (03:00)
#   ~/.local/state/nova/                               — clone dédié + logs
#
# Le bootstrap est le SEUL fichier spécifique à la machine (env/PATH). Toute la logique
# métier (run-local.sh, process-issue.sh, triage-and-build.md) vit dans le repo et se met
# à jour automatiquement (le bootstrap fait git reset --hard origin/main à chaque run).
#
# Usage :
#   bash .nova/install.sh            # installe + charge le job launchd
#   bash .nova/install.sh --dry-run  # installe puis lance un test (découverte seule, sans traitement)
set -euo pipefail

REPO="semisto-org/terranova"
HOUR="${NOVA_HOUR:-3}"          # heure de lancement (locale)
MINUTE="${NOVA_MINUTE:-0}"
WORKDIR="${NOVA_WORKDIR:-$HOME/.local/state/nova/terranova}"
LOGDIR="$HOME/.local/state/nova"
BOOTSTRAP="$HOME/.local/bin/nova-terranova"
PLIST="$HOME/Library/LaunchAgents/org.semisto.nova.plist"
LABEL="org.semisto.nova"

mkdir -p "$HOME/.local/bin" "$LOGDIR" "$HOME/Library/LaunchAgents"

# --- bootstrap : env machine + clone à jour + exec de la logique versionnée ---
cat > "$BOOTSTRAP" <<BOOT
#!/usr/bin/env bash
# Nova (local) bootstrap — généré par .nova/install.sh. Ne pas éditer à la main :
# relancer install.sh pour régénérer. La logique métier est dans le repo (.nova/run-local.sh).
set -uo pipefail

# launchd démarre avec un env minimal : on reconstruit le PATH des outils.
export PATH="/opt/homebrew/bin:\$HOME/.local/bin:\$HOME/.bun/bin:\$HOME/.asdf/shims:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

WORKDIR="${WORKDIR}"
mkdir -p "\$(dirname "\$WORKDIR")"

if [ ! -d "\$WORKDIR/.git" ]; then
  gh repo clone "${REPO}" "\$WORKDIR" || git clone "https://github.com/${REPO}.git" "\$WORKDIR"
fi
cd "\$WORKDIR" || exit 1

git fetch origin --prune --quiet || true
git reset --hard origin/main --quiet
git clean -fd --quiet

exec bash .nova/run-local.sh
BOOT
chmod +x "$BOOTSTRAP"
echo "✓ bootstrap → $BOOTSTRAP"

# --- launchd plist : lancement quotidien à HOUR:MINUTE ---
cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>            <string>${LABEL}</string>
  <key>ProgramArguments</key> <array><string>/bin/bash</string><string>${BOOTSTRAP}</string></array>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>${HOUR}</integer><key>Minute</key><integer>${MINUTE}</integer></dict>
  <key>RunAtLoad</key>        <false/>
  <key>StandardOutPath</key>  <string>${LOGDIR}/nova.log</string>
  <key>StandardErrorPath</key><string>${LOGDIR}/nova.log</string>
  <key>ProcessType</key>      <string>Background</string>
</dict>
</plist>
PLISTEOF
echo "✓ plist → $PLIST (lancement quotidien ${HOUR}:$(printf '%02d' "$MINUTE"))"

# --- (re)chargement launchd ---
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load -w "$PLIST"
if launchctl list | grep -q "$LABEL"; then
  echo "✓ launchd : job '$LABEL' chargé"
else
  echo "⚠️  launchd : job '$LABEL' introuvable après load — vérifier les permissions"
fi

echo
echo "Logs        : $LOGDIR/nova.log"
echo "Clone dédié : $WORKDIR"
echo "Lancer à la main : bash $BOOTSTRAP"
echo "Test plomberie   : NOVA_DRY_RUN=1 bash $BOOTSTRAP"

if [ "${1:-}" = "--dry-run" ]; then
  echo
  echo "── DRY RUN (découverte seule) ──"
  NOVA_DRY_RUN=1 bash "$BOOTSTRAP"
fi
