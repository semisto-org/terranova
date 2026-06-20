# frozen_string_literal: true

module Tally
  # Transforme une soumission du formulaire d'intake Tally (« Envisager un
  # projet avec Semisto », formId w77j70) en un Design::Project en phase
  # « réception », avec le demandeur comme premier contact client (capacité A)
  # et l'intégralité des réponses consignées dans le Bloc-notes (notes HTML).
  #
  # Idempotent : un rejeu de la même soumission (data.submissionId, à défaut
  # data.responseId) ne crée ni second projet ni second contact.
  #
  # Entrée : le hash `data` du webhook Tally (clés `submissionId`, `responseId`,
  # `formId`, `fields`).
  class ProjectIntakeImporter
    Result = Struct.new(:project, :created, keyword_init: true)

    def self.call(data)
      new(data).call
    end

    def initialize(data)
      @data = (data || {}).to_h.with_indifferent_access
      @fields = Array(@data[:fields])
    end

    def call
      submission_id = (@data[:submissionId].presence || @data[:responseId]).to_s
      raise ArgumentError, "submissionId/responseId manquant" if submission_id.blank?

      existing = Design::Project.find_by(tally_submission_id: submission_id)
      return Result.new(project: existing, created: false) if existing

      # Libellés multi-mots spécifiques d'abord (prioritaires), puis le libellé
      # court « Nom » en égalité stricte (sinon « Prénom » ou « Nom et prénom »
      # seraient captés à tort). Cf. #158 : le vrai formulaire utilise « Nom ».
      name  = text_for("nom et prénom", "nom et prenom", "votre nom")
      name  = text_for("nom", exact: true) if name.blank?
      email = text_for("e-mail", "email")
      phone = text_for("téléphone", "telephone")
      street = text_for("rue")
      city = text_for("localité", "localite")

      project = build_and_persist!(submission_id, name, email, phone, street, city)
      Result.new(project: project, created: true)
    rescue ActiveRecord::RecordNotUnique
      # Course entre deux rejeux concurrents : on retombe sur l'existant.
      Result.new(project: Design::Project.find_by(tally_submission_id: submission_id), created: false)
    end

    private

    def build_and_persist!(submission_id, name, email, phone, street, city)
      project = nil
      ActiveRecord::Base.transaction do
        project = Design::Project.create!(
          name: synthesized_name(name, city),
          client_id: "client-#{SecureRandom.hex(4)}",
          client_name: name.presence || "Demande web",
          client_email: email.to_s,
          client_phone: phone.to_s,
          street: street.to_s,
          city: city.to_s,
          phase: "reception",
          status: "active",
          project_type: map_project_type,
          client_interests: map_client_interests,
          acquisition_channel: map_acquisition_channel,
          project_manager_id: "",
          notes: build_notes_html,
          tally_submission_id: submission_id
        )

        # Nom de repli non-vide : un lead n'est jamais perdu. Sans ce repli,
        # Contact.create!(name: "") lèverait une validation et ferait un ROLLBACK
        # total (projet + contact) → 422 renvoyée à Tally. Cf. #158.
        contact_id = Academy::RegistrationContactResolver.call(name: name.presence || "Demande web", email: email, phone: phone)
        if contact_id
          project.project_clients.create!(contact_id: contact_id, is_primary: true, position: 0)
          project.sync_primary_client!
        end
      end
      project
    end

    # === Résolution des champs Tally ===

    # Recherche d'un champ par libellé, **en priorité par mot-clé** : on parcourt
    # les mots-clés dans l'ordre donné et on renvoie le premier champ qui matche
    # le mot-clé courant. Les libellés spécifiques l'emportent ainsi sur les
    # génériques (ex. « Nom et prénom » avant le « Nom » nu).
    # `exact: true` exige une égalité stricte du libellé — indispensable pour le
    # libellé court « Nom » afin de ne capter ni « Prénom » ni « Nom et prénom ».
    def field_by_label(*keywords, exact: false)
      keywords.each do |keyword|
        k = utf8(keyword).downcase.strip
        match = @fields.find do |f|
          label = utf8(f[:label]).downcase.strip
          exact ? label == k : label.include?(k)
        end
        return match if match
      end
      nil
    end

    def text_for(*keywords, exact: false)
      field = field_by_label(*keywords, exact: exact)
      field ? display_value(field) : ""
    end

    # Les corps de webhook arrivent en ASCII-8BIT ; on réinterprète en UTF-8
    # (les octets JSON sont déjà de l'UTF-8 valide) pour éviter les
    # Encoding::CompatibilityError lors des comparaisons de chaînes.
    def utf8(value)
      value.to_s.dup.force_encoding(Encoding::UTF_8)
    end

    # Pour les champs à choix, `value` est un tableau d'ids d'options ;
    # on les résout en texte via `options` (fallback : l'id brut).
    def option_texts(field)
      options = Array(field[:options])
      Array(field[:value]).filter_map do |id|
        opt = options.find { |o| o[:id].to_s == id.to_s }
        opt ? utf8(opt[:text]) : utf8(id)
      end
    end

    def display_value(field)
      case field[:type].to_s
      when "MULTIPLE_CHOICE", "CHECKBOXES", "DROPDOWN", "MULTI_SELECT", "RANKING"
        option_texts(field).join(", ")
      when "FILE_UPLOAD"
        file_urls(field).join(", ")
      else
        value = field[:value]
        value.is_a?(Array) ? value.map { |v| utf8(v) }.join(", ") : utf8(value)
      end
    end

    def file_urls(field)
      Array(field[:value]).filter_map { |file| utf8(file.is_a?(Hash) ? (file[:url] || file[:name]) : file).presence }
    end

    # === Mappings vers les colonnes structurées ===

    def map_project_type
      field = field_by_label("type de projet")
      return "" unless field

      txt = option_texts(field).first.to_s.downcase
      return "" if txt.blank?

      if txt.include?("privé") || txt.include?("prive")
        "prive"
      elsif txt.include?("habitat") || txt.include?("collectif")
        "collectif"
      elsif txt.include?("école") || txt.include?("ecole") || txt.include?("université") || txt.include?("universite") || txt.include?("service")
        "public"
      elsif txt.include?("professionnel") || txt.include?("agricole") || txt.include?("entreprise")
        "professionnel"
      else
        ""
      end
    end

    def map_client_interests
      field = field_by_label("intéressés par", "interesses par", "intéressé par", "interesse par")
      return [] unless field

      option_texts(field).filter_map do |text|
        t = text.downcase
        if t.include?("design")
          "design"
        elsif t.include?("plante") || t.include?("sélection") || t.include?("selection")
          "plant_selection"
        elsif t.include?("coaching")
          "personalized_coaching"
        elsif t.include?("mise en") || t.include?("soutien") || t.include?("œuvre") || t.include?("oeuvre")
          "implementation_support"
        elsif t.include?("suivi") || t.include?("5 ans") || t.include?("cinq ans")
          "five_year_follow_up"
        end
      end.uniq
    end

    def map_acquisition_channel
      field = field_by_label("connu semisto", "connu via", "comment avez-vous connu")
      return "" unless field

      txt = option_texts(field).first.to_s.downcase
      return "" if txt.blank?

      if txt.include?("bouche") || txt.include?("oreille")
        "bouche_a_oreille"
      elsif txt.include?("presse")
        "presse"
      else
        "autre"
      end
    end

    # === Synthèse ===

    def synthesized_name(name, city)
      base = name.presence || "Demande"
      city.present? ? "Demande — #{base} (#{city})" : "Demande web — #{base}"
    end

    def build_notes_html
      date = Time.current.strftime("%d/%m/%Y")
      rows = @fields.map do |field|
        label = h(utf8(field[:label]))
        value = display_value(field)
        value = "—" if value.blank?
        "<li><strong>#{label} :</strong> #{h(value)}</li>"
      end.join

      html = +"<h3>Demande reçue via Tally le #{h(date)}</h3>"
      html << "<ul>#{rows}</ul>"

      attachments = @fields.select { |f| f[:type].to_s == "FILE_UPLOAD" }.flat_map { |f| file_urls(f) }
      if attachments.any?
        items = attachments.map { |url| "<li><a href=\"#{h(url)}\">#{h(url)}</a></li>" }.join
        html << "<h4>Pièces jointes</h4><ul>#{items}</ul>"
      end

      html
    end

    def h(text)
      ERB::Util.html_escape(text)
    end
  end
end
