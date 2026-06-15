#!/usr/bin/env bash
# Nova (local) — envoi d'un message court sur Telegram.
#
# Lit le message sur stdin et le poste dans le chat configuré. Conçu pour le
# rapport de fin de session (voir run-local.sh), mais réutilisable pour tout
# message court.
#
# Env requis (à définir dans le bootstrap machine / l'env du job launchd —
# PAS dans le repo, ce sont des secrets) :
#   TELEGRAM_BOT_TOKEN — token du bot (BotFather)
#   TELEGRAM_CHAT_ID   — id du chat/canal destinataire
#
# No-op SILENCIEUX (exit 0) si les secrets sont absents ou si l'envoi échoue :
# le rapport ne doit jamais faire planter le run nocturne.
set -uo pipefail

msg="$(cat)"
[ -z "${msg//[[:space:]]/}" ] && exit 0

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
  echo "[nova] Telegram non configuré (TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID absents) — rapport non envoyé." >&2
  exit 0
fi

# Texte brut (pas de parse_mode) : pas d'échappement à gérer, titres d'issues
# arbitraires acceptés tels quels. Telegram tronque au-delà de 4096 caractères.
if [ "${#msg}" -gt 4000 ]; then
  msg="${msg:0:3990}"$'\n'"…(tronqué)"
fi

curl -fsS --max-time 15 \
  -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
  --data-urlencode "text=${msg}" \
  --data-urlencode "disable_web_page_preview=true" \
  >/dev/null \
  || { echo "[nova] WARN: envoi Telegram échoué (run non impacté)." >&2; exit 0; }

echo "[nova] Rapport Telegram envoyé." >&2
