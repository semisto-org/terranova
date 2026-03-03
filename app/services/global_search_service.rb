# frozen_string_literal: true

class GlobalSearchService
  DEFAULT_LIMIT = 24
  MAX_LIMIT = 60

  TYPE_CONFIG = {
    "projects" => {
      section: "Projets", model: Design::Project, table: "design_projects",
      title_sql: "coalesce(design_projects.name, '')",
      content_sql: "coalesce(design_projects.client_name, '') || ' ' || coalesce(design_projects.project_type, '') || ' ' || coalesce(design_projects.city, '') || ' ' || coalesce(design_projects.phase, '') || ' ' || coalesce(design_projects.status, '')",
      url: ->(r) { "/design/#{r.id}" },
      meta: ->(r) { { status: r.status, phase: r.phase, city: r.city, owner: r.project_manager_id }.compact },
      filters: ->(s, f) { s = s.where(status: f[:status]) if f[:status].present?; s = s.where(phase: f[:pole]) if f[:pole].present?; s = s.where(project_manager_id: f[:owner]) if f[:owner].present?; s }
    },
    "contacts" => {
      section: "Contacts", model: Contact, table: "contacts",
      title_sql: "coalesce(contacts.name, '')",
      content_sql: "coalesce(contacts.email, '') || ' ' || coalesce(contacts.notes, '') || ' ' || coalesce(contacts.position, '') || ' ' || coalesce(contacts.region, '')",
      url: ->(_r) { "/lab" },
      meta: ->(r) { { contactType: r.contact_type, email: r.email }.compact },
      filters: ->(s, f) { s = s.where(contact_type: f[:status]) if f[:status].present?; s = s.where(region: f[:pole]) if f[:pole].present?; s }
    },
    "plants" => {
      section: "Plantes", model: Plant::Species, table: "plant_species",
      title_sql: "coalesce(plant_species.latin_name, '')",
      content_sql: "coalesce(plant_species.common_names_fr, '') || ' ' || coalesce(plant_species.description, '') || ' ' || coalesce(plant_species.plant_type, '')",
      url: ->(r) { "/plants/species/#{r.id}" },
      meta: ->(r) { { plantType: r.plant_type, origin: r.origin }.compact },
      filters: ->(s, f) { s = s.where(plant_type: f[:status]) if f[:status].present?; s = s.where(origin: f[:pole]) if f[:pole].present?; s }
    },
    "trainings" => {
      section: "Formations", model: Academy::Training, table: "academy_trainings",
      title_sql: "coalesce(academy_trainings.title, '')",
      content_sql: "coalesce(academy_trainings.description, '') || ' ' || coalesce(academy_trainings.coordinator_note, '') || ' ' || coalesce(academy_trainings.status, '')",
      url: ->(r) { "/academy/#{r.id}" },
      meta: ->(r) { { status: r.status, registrationMode: r.registration_mode }.compact },
      filters: ->(s, f) { s = s.where(status: f[:status]) if f[:status].present?; s }
    },
    "notes" => {
      section: "Notes", model: Note, table: "notes",
      title_sql: "coalesce(notes.title, '')",
      content_sql: "coalesce(notes.body, '') || ' ' || coalesce(notes.author_name, '') || ' ' || coalesce(notes.note_type, '')",
      url: ->(_r) { "/knowledge" },
      meta: ->(r) { { noteType: r.note_type, author: r.author_name }.compact },
      filters: ->(s, f) { s = s.where(note_type: f[:status]) if f[:status].present?; s = s.where(author_name: f[:owner]) if f[:owner].present?; s }
    },
    "documents" => {
      section: "Documents", model: Design::ProjectDocument, table: "design_project_documents",
      title_sql: "coalesce(design_project_documents.name, '')",
      content_sql: "coalesce(design_project_documents.category, '') || ' ' || coalesce(design_project_documents.phase, '') || ' ' || coalesce(design_project_documents.uploaded_by, '')",
      url: ->(r) { r.url.presence || "/design/#{r.project_id}" },
      meta: ->(r) { { category: r.category, uploadedAt: r.uploaded_at&.iso8601 }.compact },
      filters: ->(s, f) { s = s.where(category: f[:status]) if f[:status].present?; s = s.where(phase: f[:pole]) if f[:pole].present?; s }
    },
    "kb" => {
      section: "KB", model: KnowledgeTopic, table: "knowledge_topics",
      title_sql: "coalesce(knowledge_topics.title, '')",
      content_sql: "coalesce(knowledge_topics.content, '') || ' ' || coalesce(knowledge_topics.author_name, '') || ' ' || coalesce(knowledge_topics.status, '')",
      url: ->(_r) { "/knowledge" },
      meta: ->(r) { { status: r.status, author: r.author_name }.compact },
      filters: ->(s, f) { s = s.where(status: f[:status]) if f[:status].present?; s = s.where(author_name: f[:owner]) if f[:owner].present?; s }
    },
    "notion" => {
      section: "Notion", model: NotionRecord, table: "notion_records",
      title_sql: "coalesce(notion_records.title, '')",
      content_sql: "coalesce(notion_records.database_name, '') || ' ' || coalesce(notion_records.content_html, '') || ' ' || coalesce(notion_records.properties::text, '')",
      url: ->(_r) { "/knowledge" },
      meta: ->(r) { { database: r.database_name }.compact },
      filters: ->(s, f) { s = s.where(database_name: f[:status]) if f[:status].present?; s }
    }
  }.freeze

  SYNONYMS = { "formation" => "training", "formations" => "training", "projet" => "project", "projets" => "project", "plante" => "plant", "plantes" => "plant" }.freeze

  def initialize(query:, types: nil, limit: DEFAULT_LIMIT, filters: {})
    @query = query.to_s.strip
    @types = Array(types).flat_map { |t| t.to_s.split(',') }.map(&:strip).reject(&:blank?)
    @limit = limit.to_i.clamp(1, MAX_LIMIT)
    @filters = filters
  end

  def call
    return [] if @query.blank?
    active_types.filter_map do |type|
      cfg = TYPE_CONFIG[type]
      items = search_type(cfg, type)
      items.empty? ? nil : { section: cfg[:section], items: items }
    end
  end

  private

  def active_types
    return TYPE_CONFIG.keys if @types.blank?
    @types & TYPE_CONFIG.keys
  end

  def query_tokens
    @query.downcase.split(/\s+/).flat_map { |t| [t, SYNONYMS[t]].compact }.uniq
  end

  def ts_query
    query_tokens.map { |token| "#{ActiveRecord::Base.sanitize_sql_like(token)}:*" }.join(' | ')
  end

  def trigram_enabled?
    value = ActiveRecord::Base.connection.select_value("SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_trgm')")
    @trigram_enabled = (value == true || value.to_s == 't' || value.to_s == 'true') if @trigram_enabled.nil?
    @trigram_enabled
  rescue StandardError
    false
  end

  def search_type(cfg, type)
    scope = cfg[:model].all
    scope = cfg[:filters].call(scope, @filters)
    scope = apply_date_filter(scope)
    vector_sql = "setweight(to_tsvector('simple', #{cfg[:title_sql]}), 'A') || setweight(to_tsvector('simple', #{cfg[:content_sql]}), 'B')"
    sanitized_ts = ActiveRecord::Base.sanitize_sql_array(["to_tsquery('simple', ?)", ts_query])
    scored = scope.select("#{cfg[:table]}.*, ts_rank_cd((#{vector_sql}), #{sanitized_ts}) AS rank_score")
                  .where("(#{vector_sql}) @@ #{sanitized_ts} OR #{cfg[:title_sql]} ILIKE :like_query OR #{cfg[:content_sql]} ILIKE :like_query", like_query: "%#{ActiveRecord::Base.sanitize_sql_like(@query)}%")
    scored = if trigram_enabled?
      sim = ActiveRecord::Base.connection.quote(query_tokens.join(' '))
      scored.select("GREATEST(similarity(#{cfg[:title_sql]}, #{sim}), similarity(#{cfg[:content_sql]}, #{sim})) AS trigram_score")
            .order(Arel.sql("(rank_score * 1.4 + trigram_score) DESC, #{cfg[:table]}.updated_at DESC"))
    else
      scored.select("0.0 AS trigram_score").order(Arel.sql("rank_score DESC, #{cfg[:table]}.updated_at DESC"))
    end

    scored.limit(per_type_limit).map { |record| build_item(type, record, cfg) }
  end

  def per_type_limit
    [(@limit.to_f / [active_types.size, 1].max).ceil + 2, 12].min
  end

  def apply_date_filter(scope)
    from = safe_date(@filters[:from]); to = safe_date(@filters[:to])
    return scope if from.nil? && to.nil?
    return scope.where(updated_at: from.beginning_of_day..to.end_of_day) if from && to
    return scope.where('updated_at >= ?', from.beginning_of_day) if from
    scope.where('updated_at <= ?', to.end_of_day)
  end

  def safe_date(value)
    Date.parse(value.to_s)
  rescue StandardError
    nil
  end

  def build_item(type, record, cfg)
    text = [record.try(:title), record.try(:name), record.try(:latin_name), record.try(:content), record.try(:body), record.try(:description), record.try(:notes), record.try(:content_html)].compact.join(' ')
    { id: record.id, type: type, title: (record.try(:title).presence || record.try(:name).presence || record.try(:latin_name).presence || 'Sans titre'), snippet: highlight_snippet(text), url: cfg[:url].call(record), score: ((record.try(:rank_score).to_f * 1.4) + record.try(:trigram_score).to_f).round(4), meta: cfg[:meta].call(record) }
  end

  def highlight_snippet(text)
    raw = ActionController::Base.helpers.strip_tags(text.to_s).squish
    return '' if raw.blank?
    token = query_tokens.find { |t| raw.downcase.include?(t) }
    return raw.first(180) unless token
    idx = raw.downcase.index(token); start = [idx - 60, 0].max
    snippet = raw[start, 180]; snippet = "...#{snippet}" if start.positive?
    query_tokens.each { |t| snippet = snippet.gsub(/(#{Regexp.escape(t)})/i, '<mark>\\1</mark>') }
    snippet
  end
end
