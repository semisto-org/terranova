# ActionCable Academy formations (temps réel)

## Variables d'environnement (production)

- `ACTION_CABLE_REDIS_URL` (recommandé): URL Redis dédiée ActionCable.
- `REDIS_URL` (fallback): utilisée si `ACTION_CABLE_REDIS_URL` est absente.
- `ACTION_CABLE_URL` (optionnel): URL websocket publique (ex: `wss://app.example.com/cable`).
- `ACTION_CABLE_ALLOWED_ORIGINS` (optionnel): origines autorisées, séparées par des virgules.
  - Ex: `https://app.example.com,https://admin.example.com`
- `APP_HOST` (fallback): utilisé pour générer `ACTION_CABLE_URL` et les origines par défaut.

## Comportement fallback

- Si aucune URL Redis n'est fournie en production, l'adapter `async` est utilisé (fonctionnel mais non recommandé en multi-process).
- Origines autorisées:
  - si `ACTION_CABLE_ALLOWED_ORIGINS` est définie: cette liste est appliquée
  - sinon: `https://APP_HOST` et `http://APP_HOST`

## Channel

- Channel: `Academy::TrainingsChannel`
- Stream: `academy_trainings`
- Événements broadcastés:
  - `type: "training"`, actions: `created|updated|destroyed`
  - `type: "session"`, actions: `created|updated|destroyed`
