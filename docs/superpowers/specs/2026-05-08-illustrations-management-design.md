# Plant Database — Illustrations Management

## Méta

- Date : 2026-05-08
- Auteur : Michael Hulet, brainstormé avec Claude Opus 4.7
- Spec parent : `docs/superpowers/specs/2026-05-07-semisto-imagegen-design.md` (skill standalone)
- Objectif : déplacer la génération d'illustrations d'espèces de la skill standalone vers une feature in-app Terranova, accessible à tous les admins via UI. Permettre la couverture des 1137 espèces du catalogue de manière efficace.

## Résumé

Aujourd'hui, le skill `semisto-imagegen` génère des illustrations on-brand via Gemini Imagen, attachées aux `Plant::Species` via API Bearer. Ce flow nécessite d'être dans Claude Code et d'invoquer la skill manuellement. Cette spec transforme cela en feature Terranova native :

- **UI bulk depuis la liste species** (`SearchView`) : filtre statut illustration + multi-sélection + bouton "Générer N illustrations" / "Régénérer N illustrations"
- **Page atelier dédiée** (`/plants/illustrations`) : galerie de vignettes paginée + stats + queue temps réel + filtres
- **Modal régénération depuis la fiche** (`SpeciesDetail`) : preview de l'illustration actuelle + textarea feedback libre + bouton "Régénérer"
- **Backend asynchrone** via SolidQueue + ActiveJob : composition du prompt par Claude Haiku (`Plants::IllustrationPromptComposer`), génération via Gemini (`Plants::GeminiImageClient`), attachement automatique au species
- **VDS source-de-vérité** dans `config/visual_design_system.yml` (versionné dans le repo)

Le skill standalone reste fonctionnel pour les usages non-species (B paysages, A3 pictos hors plante, etc.).

---

## 1. Architecture overview

3 couches :

### Couche données

- `Plant::Species.silhouette_illustration` (ActiveStorage `has_one_attached`) — déjà déployé (commit `bf60331`)
- **Nouveau** : `Plant::IllustrationJob` modèle ActiveRecord — track jobs (status, prompt, feedback, error, vds_version)

### Couche backend

- `Plants::Vds` — singleton qui charge `config/visual_design_system.yml` au boot
- `Plants::IllustrationPromptComposer` — service appelant Claude Haiku pour composer le prompt anglais
- `Plants::GeminiImageClient` — service appelant Gemini Imagen via `Net::HTTP` direct (pas de SDK Python, pas de gem externe)
- `IllustrationGenerationJob < ApplicationJob` — orchestration via SolidQueue (queue `:illustrations`, concurrency 3)

### Couche UI (React via Inertia)

- `pages/Plants/Index.jsx` enrichi : filtre statut illustration, sticky footer adapté, bouton "Tout sélectionner du filtre courant"
- **Nouvelle page** `pages/Plants/Illustrations.tsx` — atelier dédié
- `components/SpeciesDetail.tsx` enrichi : bouton "Régénérer l'illustration" (admin only) + modal de régen avec textarea feedback

### Flow utilisateur

```
[List view]
  ↓ filter "Sans illustration" + select all (903)
  ↓ click "Générer 903 illustrations"
  ↓
POST /api/v1/plants/illustrations/generate
  ↓ creates 903 Plant::IllustrationJob (status: pending)
  ↓ enqueues 903 IllustrationGenerationJob.perform_later(job_id)
  ↓
[ Pour chaque job, en parallèle (concurrency 3) : ]
  ↓
  IllustrationGenerationJob#perform
    1. job.update!(status: running, started_at: now)
    2. prompt = Plants::IllustrationPromptComposer.new(species, style: a2s, feedback: nil).compose
       → Claude Haiku appelé avec species_data + VDS yaml + (feedback if any)
       → Returns English prompt
    3. job.update!(prompt_used: prompt, vds_version: VDS.version)
    4. png_bytes = Plants::GeminiImageClient.new.generate(prompt: prompt)
       → Gemini called via Net::HTTP, retry 1× on 503
       → Returns bytes
    5. species.silhouette_illustration.purge_later if species.silhouette_illustration.attached?
       species.silhouette_illustration.attach(io: ..., filename: ..., content_type: ...)
    6. job.update!(status: completed, finished_at: now, byte_size: ...)
    7. Turbo::StreamsChannel.broadcast_update_to('illustration_jobs', ...)
       → Page atelier rafraîchit la queue + la stat banner en temps réel
```

---

## 2. Data model

### Nouveau modèle `Plant::IllustrationJob`

Table `plant_illustration_jobs` :

| Champ | Type | Description |
|---|---|---|
| `id` | bigint | PK |
| `species_id` | bigint, FK NOT NULL | espèce ciblée (`Plant::Species`) |
| `status` | string NOT NULL | `pending`, `running`, `completed`, `failed` |
| `kind` | string NOT NULL | `initial` (gen première) ou `regeneration` (sur existante) |
| `feedback` | text, nullable | feedback texte libre (régen seulement) |
| `prompt_used` | text, nullable | prompt anglais final envoyé à Gemini |
| `vds_version` | string, nullable | version du VDS utilisée |
| `triggered_by_member_id` | bigint, FK NOT NULL | qui a lancé |
| `triggered_at` | timestamp NOT NULL | quand le job a été créé |
| `started_at` | timestamp, nullable | quand `perform` a commencé |
| `finished_at` | timestamp, nullable | quand `perform` est terminé |
| `error_message` | text, nullable | trace si `failed` |
| `error_class` | string, nullable | classe de l'exception |
| `gemini_attempts` | integer, default 0 | compteur de retry |
| `byte_size` | integer, nullable | taille du PNG résultant si succès |
| `created_at`, `updated_at` | timestamps | standard |

**Index** :
- `species_id` (lookups fréquents)
- `status` (filtres running/pending)
- `triggered_at DESC` (liste chronologique)

**Relations** :
- `belongs_to :species, class_name: 'Plant::Species'`
- `belongs_to :triggered_by, class_name: 'Member'`

**Statuts** (state machine implicite) :
- `pending` → `running` (ActiveJob commence)
- `running` → `completed` (succès) ou `failed` (exception)
- `failed` peut être manuellement remis à `pending` (retry)

### Modifications `Plant::Species`

```ruby
# app/models/plant/species.rb
class Plant::Species < ApplicationRecord
  # ... existing ...
  has_one_attached :silhouette_illustration  # déjà fait
  has_many :illustration_jobs, class_name: 'Plant::IllustrationJob', dependent: :destroy

  scope :with_illustration, -> {
    joins(:silhouette_illustration_attachment)
  }

  scope :without_illustration, -> {
    left_joins(:silhouette_illustration_attachment)
      .where(active_storage_attachments: { id: nil })
  }

  def last_illustration_job
    illustration_jobs.order(triggered_at: :desc).first
  end
end
```

### Migration

```ruby
class CreatePlantIllustrationJobs < ActiveRecord::Migration[8.1]
  def change
    create_table :plant_illustration_jobs do |t|
      t.references :species, null: false, foreign_key: { to_table: :plant_species }
      t.references :triggered_by, null: false, foreign_key: { to_table: :members }
      t.string :status, null: false, default: 'pending'
      t.string :kind, null: false
      t.text :feedback
      t.text :prompt_used
      t.string :vds_version
      t.timestamp :triggered_at, null: false
      t.timestamp :started_at
      t.timestamp :finished_at
      t.text :error_message
      t.string :error_class
      t.integer :gemini_attempts, default: 0, null: false
      t.bigint :byte_size
      t.timestamps
    end
    add_index :plant_illustration_jobs, :status
    add_index :plant_illustration_jobs, :triggered_at, order: { triggered_at: :desc }
  end
end
```

---

## 3. Backend services

### `Plants::Vds`

Singleton qui charge `config/visual_design_system.yml` au boot via initializer. Expose :
- `Plants::Vds.template_for(style)` → hash avec `template`, `anchors`
- `Plants::Vds.important_rules` → string IMPORTANT RULES block
- `Plants::Vds.version` → string semver

```ruby
# config/initializers/visual_design_system.rb
Rails.application.config.after_initialize { Plants::Vds.load! }

# app/services/plants/vds.rb
module Plants
  class Vds
    cattr_accessor :data
    
    def self.load!
      @@data = YAML.load_file(Rails.root.join('config/visual_design_system.yml'))
    end
    
    def self.template_for(style)
      @@data['styles'].fetch(style.to_s)
    end
    
    def self.important_rules
      @@data['important_rules']
    end
    
    def self.version
      @@data['version']
    end
  end
end
```

### `Plants::IllustrationPromptComposer`

Compose le prompt anglais via Claude Haiku 4.5.

```ruby
# app/services/plants/illustration_prompt_composer.rb
require 'anthropic'

module Plants
  class IllustrationPromptComposer
    Error = Class.new(StandardError)

    def initialize(species:, style: :a2s, feedback: nil)
      @species  = species
      @style    = style
      @feedback = feedback
    end

    def compose
      response = client.messages.create(
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: user_prompt }]
      )
      response.content.first.text.strip
    rescue Anthropic::Errors::APIError => e
      raise Error, "Claude API error: #{e.message}"
    end

    private

    SYSTEM_PROMPT = <<~SYS.freeze
      You compose botanical illustration prompts for Gemini Imagen, following
      the Semisto Visual Design System exactly. Output the final English prompt
      only — no preamble, no markdown, no explanations.
    SYS

    def client
      @client ||= Anthropic::Client.new(access_token: ENV.fetch('ANTHROPIC_API_KEY'))
    end

    def user_prompt
      <<~PROMPT
        Compose an illustration prompt for the following species using style #{@style.to_s.upcase}.

        Species data:
        - Latin name: #{@species.latin_name}
        - Common name (FR): #{@species.common_names_fr}
        - Height: #{@species.height_min_cm}-#{@species.height_max_cm} cm
        - Spread: #{@species.spread_min_cm}-#{@species.spread_max_cm} cm
        - Growth habit: #{@species.growth_habit}
        - Strate: #{@species.strate}
        - Foliage type: #{@species.foliage_type}
        - Plant type: #{@species.plant_type}

        Style template:
        #{Plants::Vds.template_for(@style)['template']}

        Important rules block to append at end:
        #{Plants::Vds.important_rules}

        #{"User feedback for this regeneration (incorporate naturally into the composition): #{@feedback}" if @feedback.present?}

        Output the final English prompt to send to Gemini, ready to use as-is.
      PROMPT
    end
  end
end
```

### `Plants::GeminiImageClient`

HTTP direct via `Net::HTTP`. Pas de gem.

```ruby
# app/services/plants/gemini_image_client.rb
require 'net/http'
require 'json'
require 'base64'

module Plants
  class GeminiImageClient
    GenerationError = Class.new(StandardError)
    InvalidImageError = Class.new(GenerationError)
    RateLimitError = Class.new(GenerationError)

    BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent'.freeze
    MAX_ATTEMPTS = 2  # 1 attempt + 1 retry

    def initialize(api_key: ENV.fetch('GEMINI_API_KEY'))
      @api_key = api_key
    end

    def generate(prompt:)
      attempt = 0
      begin
        attempt += 1
        response = post_request(prompt)
        bytes = extract_image_bytes(response)
        validate_image!(bytes)
        bytes
      rescue Net::HTTPServerError, Net::HTTPRetriableError => e
        if attempt < MAX_ATTEMPTS && e.is_a?(Net::HTTPServerError) # 5xx
          sleep 10
          retry
        end
        raise RateLimitError, "Gemini 503 after #{MAX_ATTEMPTS} attempts" if e.message.include?('503')
        raise GenerationError, "Gemini error: #{e.message}"
      end
    end

    private

    def post_request(prompt)
      uri = URI("#{BASE_URL}?key=#{@api_key}")
      payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: %w[TEXT IMAGE] }
      }
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.read_timeout = 120
      req = Net::HTTP::Post.new(uri)
      req['Content-Type'] = 'application/json'
      req.body = payload.to_json
      response = http.request(req)
      raise GenerationError, "HTTP #{response.code}: #{response.body[0..500]}" unless response.is_a?(Net::HTTPSuccess)
      JSON.parse(response.body)
    end

    def extract_image_bytes(response_json)
      part = response_json.dig('candidates', 0, 'content', 'parts')&.find { |p| p['inlineData'] }
      raise GenerationError, 'Gemini did not return an inline image part' unless part
      Base64.decode64(part['inlineData']['data'])
    end

    def validate_image!(bytes)
      raise InvalidImageError, 'Empty bytes returned' if bytes.blank? || bytes.bytesize < 1000
      magic = bytes[0..3].bytes
      png = magic == [137, 80, 78, 71]
      jpeg = magic[0..1] == [255, 216]
      raise InvalidImageError, 'Returned bytes are not PNG or JPEG' unless png || jpeg
    end
  end
end
```

### `IllustrationGenerationJob`

```ruby
# app/jobs/illustration_generation_job.rb
class IllustrationGenerationJob < ApplicationJob
  queue_as :illustrations

  retry_on Plants::GeminiImageClient::RateLimitError, wait: :polynomially_longer, attempts: 1
  discard_on ActiveRecord::RecordNotFound

  def perform(illustration_job_id)
    job = Plant::IllustrationJob.find(illustration_job_id)
    return if job.completed? || job.running?  # idempotent

    job.update!(status: 'running', started_at: Time.current)

    prompt = Plants::IllustrationPromptComposer.new(
      species: job.species,
      style: :a2s,
      feedback: job.feedback
    ).compose
    job.update!(prompt_used: prompt, vds_version: Plants::Vds.version)

    bytes = Plants::GeminiImageClient.new.generate(prompt: prompt)

    job.species.silhouette_illustration.purge_later if job.species.silhouette_illustration.attached?
    job.species.silhouette_illustration.attach(
      io: StringIO.new(bytes),
      filename: "#{job.species.slug}-illustration.png",
      content_type: bytes[0..1].bytes == [255, 216] ? 'image/jpeg' : 'image/png'
    )

    job.update!(status: 'completed', finished_at: Time.current, byte_size: bytes.bytesize)
    broadcast_update(job)
  rescue => e
    job.update!(
      status: 'failed',
      finished_at: Time.current,
      error_message: e.message,
      error_class: e.class.name,
      gemini_attempts: job.gemini_attempts + 1
    )
    broadcast_update(job)
    raise
  end

  private

  def broadcast_update(job)
    Turbo::StreamsChannel.broadcast_replace_to(
      'illustration_jobs',
      target: ActionView::RecordIdentifier.dom_id(job),
      partial: 'plants/illustration_jobs/job_row',
      locals: { job: job }
    )
  end
end
```

### Configuration SolidQueue

```yaml
# config/queue.yml (ou config/solid_queue.yml selon Rails 8)
production:
  default:
    workers:
      - queues: ["default", "*"]
        threads: 5
      - queues: "illustrations"
        threads: 3  # concurrency limit pour Gemini
```

---

## 4. API endpoints

Tous sous `Api::V1::PlantsController` (ou nouveau contrôleur `Api::V1::IllustrationsController` pour séparer).

### `POST /api/v1/plants/illustrations/generate`

**Auth** : Bearer ou session, **admin requis**.

**Payload** :
```json
{
  "species_ids": [894, 256, 470],
  "kind": "regeneration",
  "feedback": "trop dense, plus aéré",
  "style": "a2s"
}
```

`kind` est optionnel ; si omis, le serveur infère :
- `initial` si pas de `silhouette_illustration` attachée
- `regeneration` si une est déjà attachée

**Réponse** :
```json
{
  "created_jobs": 3,
  "skipped": [],
  "estimated_duration_seconds": 90,
  "jobs": [
    { "id": 42, "species_id": 894, "status": "pending" },
    { "id": 43, "species_id": 256, "status": "pending" },
    { "id": 44, "species_id": 470, "status": "pending" }
  ]
}
```

**Logique** :
- Crée 1 `Plant::IllustrationJob` par `species_id` avec `status: 'pending'`, `triggered_by: current_member`, `triggered_at: now`
- Skip silencieusement les espèces qui ont déjà un job `running` ou `pending` (ajoute leur id à `skipped[]`)
- Si nombre total de jobs `pending`+`running` dans la DB excède 100 → 422 + `{ error: "Queue saturée, attendre la fin des jobs en cours" }`
- Enfile `IllustrationGenerationJob.perform_later(job.id)` pour chaque job créé
- `estimated_duration_seconds` ≈ `(created_jobs / 3) * 30` (3 jobs en parallèle, ~30s par job)

### `GET /api/v1/plants/illustrations`

**Query params** :
- `filter` : `with`, `without`, `running`, `failed`, `all` (default: `all`)
- `genus_id`, `strate`, `plant_type` (filtres additionnels)
- `sort` : `latin_name` (default), `recently_generated`, `recently_failed`
- `page` (default 1), `per_page` (default 24, max 100)

**Réponse** :
```json
{
  "items": [
    {
      "id": "894",
      "latinName": "Amelanchier canadensis",
      "commonName": "Amélanchier du Canada",
      "thumbnailUrl": "/rails/active_storage/representations/.../amelanchier-thumb.jpg",
      "fullUrl": "/rails/active_storage/blobs/.../amelanchier.png",
      "lastJobStatus": "completed",
      "lastJobAt": "2026-05-08T11:29:00Z",
      "totalJobs": 2
    }
  ],
  "page": 1,
  "totalPages": 95,
  "totalCount": 1137
}
```

`thumbnailUrl` utilise les **representations** ActiveStorage (variant 200×280, JPEG q85) pré-resized.

### `GET /api/v1/plants/illustrations/stats`

```json
{
  "total": 1137,
  "withIllustration": 234,
  "withoutIllustration": 891,
  "running": 12,
  "failedRecently": 3,
  "completionPct": 20.6
}
```

Cache 30s (`Rails.cache.fetch`).

### `GET /api/v1/plants/illustrations/jobs`

Liste des 50 derniers jobs (default). Filtrable par `?status=running,failed`.

```json
{
  "jobs": [
    {
      "id": 42,
      "speciesId": 894,
      "speciesLatinName": "Amelanchier canadensis",
      "status": "running",
      "kind": "regeneration",
      "triggeredAt": "...",
      "startedAt": "...",
      "finishedAt": null,
      "errorMessage": null,
      "feedback": "trop dense"
    }
  ]
}
```

### `GET /api/v1/plants/illustrations/jobs/:id`

**Admin only**. Détails d'un job (incluant `prompt_used` complet pour debug).

### `POST /api/v1/plants/illustrations/jobs/:id/retry`

**Admin only**. Crée un nouveau `Plant::IllustrationJob` (kind: `regeneration`) pour la même species, en réutilisant le `feedback` du job parent. Le job en `failed` reste en DB pour audit.

### Routes ajoutées

```ruby
# config/routes.rb dans api_v1 namespace
post   'plants/illustrations/generate', to: 'plants#generate_illustrations'
get    'plants/illustrations', to: 'plants#list_illustrations'
get    'plants/illustrations/stats', to: 'plants#illustration_stats'
get    'plants/illustrations/jobs', to: 'plants#list_illustration_jobs'
get    'plants/illustrations/jobs/:id', to: 'plants#show_illustration_job'
post   'plants/illustrations/jobs/:id/retry', to: 'plants#retry_illustration_job'
```

(Ou nouveau `Api::V1::IllustrationsController` — décision d'implémentation, pas critique.)

---

## 5. UI surfaces

### 5.1 — Liste species (`SearchView`) enrichie

**Modifications** :
- **Filtre dans `FilterPanel`** : nouveau radio "Statut illustration" → `Toutes` / `Sans illustration` / `Avec illustration`
- **Indicator sur `SearchResultItem`** : petit rond olive (`#afbd00`) à côté du nom si `silhouette_illustration` attachée, rond pointillé sinon
- **Sticky footer** existant adapté :
  - Bouton secondaire **"Imprimer N fiches"** (limite 12, comportement existant)
  - Bouton primaire **"🎨 Générer N illustrations"** ou **"🔄 Régénérer N illustrations"** (label dynamique selon le mix de la sélection : si toutes sans illustration → "Générer", si toutes avec → "Régénérer", mix → "Générer/Régénérer")
  - Limite illustration : 200 par batch (au-delà, demander confirmation modale)
- **Bouton "Tout sélectionner du filtre courant (903)"** au-dessus de la liste, sélectionne toutes les espèces du filtre+sort courant
- **Authorization** : le bouton de génération est **absent** (pas grisé) si `current_member.is_admin?` est false. Quand présent, wrappé dans le callout amber `Lock` (convention CLAUDE.md)

### 5.2 — Page atelier `/plants/illustrations`

Nouvelle page Inertia `pages/Plants/Illustrations.tsx`.

**Layout** :

```
┌──────────────────────────────────────────────────────────┐
│  Atelier d'illustrations                                 │
│  ──────────────────────────                              │
│  ┌────────┐ ┌────────┐ ┌────────┐                        │
│  │  234   │ │   12   │ │  891   │                        │
│  │Illustrées│ En cours │Restantes │                      │
│  └────────┘ └────────┘ └────────┘                        │
│  ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░  21%                      │
│                                                          │
│  [⚡ Rattraper 891 manquantes]  [Filtres ▼]              │
│                                                          │
│  ────────────────────────  ┌──────────────────────────┐  │
│  ●Avec ○Sans ○En cours    │  Queue jobs              │  │
│  ☐ Voir en contexte fiche │  ────────────────        │  │
│                           │  ⏳ Aronia melanocarpa   │  │
│  ┌────┐┌────┐┌────┐┌────┐ │  ⏳ Asimina triloba     │  │
│  │ 🌳 ││ 🌳 ││ 🌳 ││ 🌳 │ │  ⏳ Atriplex hortensis  │  │
│  └────┘└────┘└────┘└────┘ │  ✓ Pommier (1m)         │  │
│  ┌────┐┌────┐┌────┐┌────┐ │  ✗ Sureau noir [Retry]  │  │
│  │ 🌳 ││ 🌳 ││ 🌳 ││ 🌳 │ │                          │  │
│  └────┘└────┘└────┘└────┘ └──────────────────────────┘  │
│                                                          │
│  [< 1/95 >]                                              │
└──────────────────────────────────────────────────────────┘
```

**Composants** :
- `IllustrationStatsTile` — 3 tiles + barre de progression
- `IllustrationFilterBar` — radio with/without/running/failed + toggle "Voir en contexte fiche"
- `IllustrationGalleryGrid` — grille 6 cols de vignettes paginées
  - Chaque vignette : `<img src={thumbnailUrl} />` avec hover → `latinName`
  - Click vignette → ouvre `PlantSheetDrawer` existant pour la fiche
- `IllustrationQueuePanel` — side panel droit, liste des jobs récents (10-15)
  - Chaque ligne : status icon + species name + temps relatif + (retry button si failed)
  - **Turbo Streams** subscribe au stream `illustration_jobs` pour update live
- `IllustrationCardGalleryGrid` (optionnel, derrière le toggle) — grille 3 cols de mini-cartes complètes

**Action principale "Rattraper N manquantes"** :
- Affiche une modal de confirmation : "Tu vas lancer N générations. Estimation : ~Xh en arrière-plan. Continuer ?"
- Pas d'info sur le coût (Workspace Non Profit, gratuit, sans limite documentée)
- POST `/api/v1/plants/illustrations/generate` avec tous les `species_ids` du filtre "Sans illustration"

### 5.3 — Modal régénération depuis fiche

Bouton **"Régénérer l'illustration"** ajouté à `SpeciesDetail.tsx`, **admin only**, dans le callout amber, à côté de l'illustration actuelle si elle existe (sinon : "Générer l'illustration" pour la première fois).

Click → ouvre `RegenerateIllustrationModal` :

```
┌──────────────────────────────────────────────────┐
│  Régénérer l'illustration                       │
│  ─────────────────────────                       │
│  ┌────────┐  Amelanchier canadensis              │
│  │  🌳    │  Amélanchier du Canada               │
│  │        │  Style A2s · v1.2 · 480 KB           │
│  └────────┘  Générée il y a 2 heures             │
│                                                  │
│  Notes pour la prochaine génération (optionnel)  │
│  ┌──────────────────────────────────────────┐    │
│  │ Ex: trop dense, plus de fleurs visibles  │    │
│  │     troncs plus fins, couronne ouverte   │    │
│  └──────────────────────────────────────────┘    │
│  Ces notes sont ajoutées au prompt.              │
│                                                  │
│  [Annuler]            [Régénérer maintenant]    │
└──────────────────────────────────────────────────┘
```

Behavior :
- POST `/api/v1/plants/illustrations/generate` avec `species_ids: [id]`, `kind: 'regeneration'`, `feedback: <textarea>`
- Modal se ferme
- Toast "✓ Régénération lancée — l'image sera mise à jour automatiquement"
- L'image actuelle dans la fiche est remplacée par un placeholder "Régénération en cours…" jusqu'à ce que Turbo Stream confirme l'update

### 5.4 — Visibilité des jobs et failures

Les jobs en `failed` apparaissent :
- Dans le filter "Erreurs" de la galerie atelier
- Dans le side panel queue avec un bouton **[Retry]** (admin only)
- Sur la fiche species, si le dernier job est en failed, message d'avertissement : "Dernière génération a échoué : {error_message}. [Régénérer]"

### 5.5 — Notifications

**Toast** à la fin d'une génération réussie individuelle (déclenchée depuis la fiche) :
> ✓ Illustration générée pour Amelanchier canadensis [Voir]

**Pas de notification de fin de bulk** dans le MVP — l'utilisateur regarde l'atelier pour voir où ça en est.

---

## 6. Couverture, throttling, auth

### Coverage strategy

Pas de notion de "priorité" stockée en DB dans le MVP. L'utilisateur priorise via les filtres existants :
- Strate (canopée / arbres / arbustes / herbacées / etc.)
- Genus
- Plant type

Si besoin de tier explicite plus tard, ajout d'un champ `Plant::Species.priority` sans casser l'existant.

### Throttling & concurrency

- **SolidQueue** : `concurrency: 3` sur la queue `:illustrations` (3 jobs Gemini en parallèle max)
- **Pause inter-job** : pas de sleep explicite — la concurrency suffit
- **Retry sur 503** : 1× automatique (10s wait) via `retry_on Plants::GeminiImageClient::RateLimitError, attempts: 1`
- **Estimation temps** : ~30-60s par job × N / 3 (concurrency) — affiché dans la confirmation : "Estimation : 3-5h en arrière-plan"
- **Quotas Workspace for Non Profit** : inconnus. Si on commence à voir des 429, on adapte la concurrency dans `config/queue.yml` et on ajoute un rate limiter (instance `Plants::GeminiImageClient` avec semaphore)

### Auth & rôles

Convention CLAUDE.md respectée :

| Action | Auth requise |
|---|---|
| Voir la galerie atelier | Member loggué |
| Voir les stats | Member loggué |
| Voir un job individuel (incluant `prompt_used`) | Admin |
| Lancer génération bulk | Admin |
| Régénérer depuis fiche | Admin |
| Retry job failed | Admin |

**API** : Bearer auth via `KNOWLEDGE_API_KEY` continue à fonctionner (mappe vers un member admin via `Api::V1::BaseController#authenticate_via_api_key`).

**UI** : les boutons admin-only sont **absents** si non-admin. Quand présents, wrappés dans le callout amber `Lock` (convention).

### Nouvelles env vars

| Variable | Pourquoi |
|---|---|
| `ANTHROPIC_API_KEY` | Claude Haiku pour `IllustrationPromptComposer` |
| `GEMINI_API_KEY` | Gemini Imagen pour `GeminiImageClient` |

Ajoutées à `.env.local` en dev, à `config/credentials.yml.enc` en prod.

### Failure modes

| Cas | Comportement |
|---|---|
| Claude Haiku timeout / erreur | Job → `failed`, error_class = `Plants::IllustrationPromptComposer::Error`, retry manuel possible |
| Gemini 503 1ère fois | Auto-retry après 10s |
| Gemini 503 2ème fois | Job → `failed`, retry manuel |
| Gemini 429 (rate limit) | Job → `failed`, error_class = `Plants::GeminiImageClient::RateLimitError`. Si récurrent → adapter concurrency manuellement |
| Image corrompue / non PNG/JPEG | Job → `failed`, error_class = `Plants::GeminiImageClient::InvalidImageError` |
| User déclenche regen sur species qui en a déjà un running | Endpoint skip silencieusement (id ajouté à `skipped[]`) |
| Bulk avec 100+ jobs running en queue | 422 + message "Queue saturée" |

---

## 7. Hors scope MVP

- **Rollback / historique des illustrations** : `purge_later` supprime le blob précédent. Pour revenir → régénérer.
- **Génération sur les variétés et genres** : seulement `Plant::Species`.
- **Génération de styles autres que A2s** : seul A2s côté Terranova. A1 / A2 / A3 / B restent dans le skill standalone.
- **Édition manuelle** (recadrage, retouche couleur) : non.
- **Approbation review** : pas de workflow "pending review" → "published".
- **Notifications email / Slack** quand un bulk est terminé.
- **Export en lot** des illustrations (zip).
- **A/B testing** "génère 2 versions, pick la meilleure".
- **Coverage tier / priority** : pas dans le modèle (filtres existants suffisent).
- **Skill standalone reste utilisable** mais avec rôle redéfini :
  - **Pour les espèces végétales (A1/A2/A2s/A3 avec sujet plante du catalogue)** : le skill ne génère plus localement. Il **délègue** au pipeline Rails en appelant `POST /api/v1/plants/illustrations/generate` (Bearer auth) avec le `species_id` résolu via `GET /api/v1/plants/search`. Le skill retourne immédiatement avec le `job_id` créé et invite l'utilisateur à suivre dans l'atelier.
  - **Pour le reste (B paysages narratifs, A3 pictos hors plante, A1 planches de référence non liées au catalogue)** : le skill garde son fonctionnement actuel — Gemini direct + sauvegarde locale dans `~/Downloads/semisto-imagegen-output/`.
  - **Conséquences** :
    - Single source of truth pour la chaîne de génération species (pipeline Rails avec Claude Haiku + Gemini + attachement automatique)
    - Le skill bénéficie automatiquement de l'évolution du VDS yaml côté Rails (pas de duplication)
    - Le skill devient inopérant pour les espèces si Terranova est injoignable (cloud routine sans accès Rails) — accepté comme trade-off vu la simplicité gagnée
    - Le bloc Python `Plants::GeminiImageClient` côté skill peut être supprimé (gardé seulement pour usages non-species)

## 8. Dépendances

| Dépendance | Pourquoi | Statut |
|---|---|---|
| `anthropic` gem | Client Ruby pour Claude Haiku | À ajouter au Gemfile |
| `solid_queue` | Queue ActiveJob | Déjà dans Rails 8 par défaut |
| `mini_magick` ou `image_processing` | Variants ActiveStorage (vignettes) | Déjà présent |
| `Net::HTTP` | Client Gemini | Builtin Ruby |
| `turbo-rails` | Broadcast queue temps réel | Déjà présent |

Pas de Redis, pas de Sidekiq, pas de SDK Python.

## 9. Migration de données

- Migration `CreatePlantIllustrationJobs` (1 fichier)
- Pas de backfill nécessaire pour les illustrations existantes (Amelanchier 894 = 1 illustration, déjà uploadée — son historique de jobs reste vide, c'est ok)
- `config/visual_design_system.yml` à créer (transcription du contenu actuel de `~/.claude/skills/semisto-imagegen/visual-design-system.md`)

## 10. Critères de succès

### Quantitatifs
- Un admin génère une illustration en 1 click depuis n'importe quelle fiche species sans terminal
- Un admin sélectionne 50+ espèces dans la liste et lance la génération en 1 appel
- Un admin voit la progression du rattrapage dans `/plants/illustrations` sans rafraîchir manuellement
- Le rattrapage des 1136 espèces restantes peut se compléter en arrière-plan sans intervention humaine (modulo les `failed`)

### Qualitatifs
- Les illustrations générées sont **équivalentes** à celles produites par le skill standalone (même VDS, même prompts à terme)
- Le feedback texte libre influence visiblement la régénération (test : régen avec "moins dense" → résultat moins dense)
- L'UI n'introduit pas de confusion : un non-admin ne voit pas de boutons cassés / inaccessibles

## 11. Implémentation phasée

Ordre suggéré (chaque sprint livrable indépendamment) :

1. **Sprint 1 — Backend foundations**
   - Migration `Plant::IllustrationJob`
   - `Plants::Vds` + `config/visual_design_system.yml`
   - `Plants::IllustrationPromptComposer` (avec `anthropic` gem)
   - `Plants::GeminiImageClient` (Net::HTTP)
   - `IllustrationGenerationJob` (ActiveJob + SolidQueue)
   - Tests unitaires des services
2. **Sprint 2 — API endpoints**
   - `POST /illustrations/generate`
   - `GET /illustrations` (galerie data)
   - `GET /illustrations/stats`
   - `GET /illustrations/jobs`
   - `POST /illustrations/jobs/:id/retry`
   - Tests d'intégration
3. **Sprint 3 — Page atelier**
   - Route `/plants/illustrations` + page Inertia
   - Composants `IllustrationStatsTile`, `IllustrationFilterBar`, `IllustrationGalleryGrid`, `IllustrationQueuePanel`
   - Turbo Streams broadcast depuis `IllustrationGenerationJob`
   - Bouton "Rattraper N manquantes" + modal de confirmation
4. **Sprint 4 — UI list + fiche**
   - Filtre statut illustration dans `FilterPanel`
   - Indicateur sur `SearchResultItem`
   - Sticky footer adapté + "Tout sélectionner du filtre courant"
   - `RegenerateIllustrationModal` depuis `SpeciesDetail`
   - Toast notifications

5. **Sprint 5 — Refactor skill standalone**
   - Mise à jour de `~/.claude/skills/semisto-imagegen/SKILL.md` :
     - Pour species : remplacer le block "génération Gemini local + upload multipart manuel" par "appel à `POST /api/v1/plants/illustrations/generate` avec `species_ids: [resolved_id]`, optionnel `feedback`" → retourne le `job_id`
     - Pour non-species : conserver le bloc Python Gemini + sauvegarde locale, inchangé
   - Mise à jour de `~/.claude/skills/semisto-imagegen/visual-design-system.md` :
     - Ajouter une note d'avertissement en tête : "Pour les générations species, le VDS source-de-vérité est `config/visual_design_system.yml` côté Terranova. Ce fichier reste l'éditable humain miroir, mais doit être tenu manuellement en sync."
   - Test manuel : invoquer le skill depuis Claude Code pour une espèce → vérifier qu'un job apparaît dans `/plants/illustrations` et que l'image est attachée
   - Documenter dans le SKILL.md la dépendance à un Terranova reachable pour les species

## 12. Versionnement du VDS

Le `config/visual_design_system.yml` est versionné dans le repo (Git). Chaque modification → bump du `version` field + commit. Les jobs gardent la `vds_version` utilisée pour l'audit historique.

Le SKILL.md (skill standalone) garde sa propre copie de `visual-design-system.md` (markdown). À terme, un script de sync peut traduire YAML ↔ MD si besoin. MVP : édition manuelle des deux pour rester cohérent.
