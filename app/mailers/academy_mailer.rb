# frozen_string_literal: true

class AcademyMailer < ApplicationMailer
  layout "academy_mailer"

  def registration_confirmation(registration, payment_method: "Carte")
    @registration = registration
    @training = registration.training
    @sessions = @training.sessions.order(:start_date)
    @items = registration.registration_items.includes(:participant_category)
    @registration_packs = registration.registration_packs.includes(pack: { pack_items: :participant_category })

    location_ids = @sessions.flat_map(&:location_ids).uniq
    @locations = Academy::TrainingLocation.where(id: location_ids)

    @amount_paid = registration.amount_paid.to_f
    @payment_status = registration.payment_status
    @payment_amount = registration.payment_amount.to_f
    @payment_method = payment_method

    # Lien MySemisto (#39) — magic-link basé sur le contact (login par code
    # email, pas de doublon de compte). Mène à la page de l'activité, où
    # l'inscrit voit les détails et le covoiturage des autres inscrits.
    contact = registration.contact ||
              (registration.contact_email.present? && Contact.find_by("LOWER(email) = ?", registration.contact_email.downcase)) ||
              nil
    @my_semisto_url = participant_session_url(@training, contact)

    attachments.inline["academy-logo.png"] = File.read(
      Rails.root.join("public/icons/academy.png")
    )

    mail(
      to: @registration.contact_email,
      subject: "Confirmation d'inscription — #{@training.title}"
    )
  end

  # Rappel envoyé quelques jours avant une session, à un inscrit donné.
  # intro_html / bonus_html : HTML custom (déjà sanitizé ici) rédigé par le
  # coordinateur au moment de l'envoi. Le détail logistique vit sur la page
  # MySemisto vers laquelle pointe le bouton (lien one-click via magic-link).
  def session_reminder(session, registration, intro_html: "", bonus_html: "")
    @session = session
    @training = session.training
    @registration = registration
    @contact_name = registration.contact_name.to_s

    @intro_html = sanitize_rich(intro_html)
    @bonus_html = sanitize_rich(bonus_html)

    @meeting_point = session.meeting_point.to_s
    @meeting_time = session.meeting_time.to_s
    @meals_info = session.meals_info.to_s
    @accommodation_info = session.accommodation_info.to_s
    @packing_list = session.packing_list || []

    location_ids = session.location_ids || []
    @locations = Academy::TrainingLocation.where(id: location_ids).map { |l| { name: l.name, address: l.address.to_s } }

    trainer_ids = (session.trainer_ids || [])
    @trainers = trainer_ids.any? ? Contact.where(id: trainer_ids).pluck(:name) : []

    contact = registration.contact || (registration.contact_email.present? && Contact.find_by("LOWER(email) = ?", registration.contact_email.downcase)) || nil
    @session_url = participant_session_url(@training, contact)

    @other_trainings = build_other_trainings(@training)

    attachments.inline["academy-logo.png"] = File.read(
      Rails.root.join("public/icons/academy.png")
    )

    mail(
      to: @registration.contact_email,
      subject: "🗓️ Infos pratiques — #{@training.title}"
    )
  end

  # Rappel envoyé ~24h après la fin d'une session à chacun de ses formateurs,
  # pour les inviter à déposer leurs documents (slides, ressources) sur la page
  # de la session dans Terranova. Le lien profond les amène directement sur la
  # page d'upload. trainer_contact est un Contact (les trainer_ids de la session
  # référencent des Contacts).
  def trainer_document_request(session, trainer_contact)
    @session = session
    @training = session.training
    @trainer_name = trainer_contact.name.to_s
    @session_topic = session.topic.to_s
    @upload_url = academy_admin_training_url(@training)
    @login_email = trainer_contact.email

    attachments.inline["academy-logo.png"] = File.read(
      Rails.root.join("public/icons/academy.png")
    )

    mail(
      to: trainer_contact.email,
      cc: "formations@semisto.org",
      subject: "📎 Vos documents de formation — #{@training.title}"
    )
  end

  # Relais covoiturage : message d'un inscrit à un autre. L'adresse de
  # l'expéditeur n'apparaît jamais sur la plateforme ; on la place en Reply-To
  # pour que la réponse du destinataire lui parvienne directement.
  def carpooling_message(from_registration:, to_registration:, message:)
    @training = from_registration.training
    @from_name = from_registration.contact_name.to_s
    @from_city = from_registration.departure_city.to_s
    @from_carpooling = from_registration.carpooling
    @message = message.to_s

    attachments.inline["academy-logo.png"] = File.read(
      Rails.root.join("public/icons/academy.png")
    )

    mail(
      to: to_registration.contact_email,
      reply_to: from_registration.contact_email,
      subject: "🚗 Covoiturage — #{@training.title}"
    )
  end

  private

  def sanitize_rich(html)
    return "".html_safe if html.blank?
    ActionController::Base.helpers.sanitize(
      html,
      tags: %w[p br strong em u a ul ol li h3 h4 blockquote span],
      attributes: %w[href target rel style]
    )
  end

  # Lien vers la page d'activité du portail participant. Quand un Contact est
  # connu, on génère un magic-link (purpose :contact_login) qui connecte ET
  # redirige vers la page de l'activité — un seul clic depuis l'email.
  def participant_session_url(training, contact)
    path = "/academy/#{training.id}"
    my_host = ENV["MY_SEMISTO_HOST"]
    protocol = Rails.env.production? ? "https" : "http"

    if contact && my_host.present?
      token = Rails.application.message_verifier(:contact_login).generate(
        { contact_id: contact.id },
        purpose: :contact_login,
        expires_in: 21.days
      )
      "#{protocol}://#{my_host}/api/v1/auth/verify?token=#{CGI.escape(token)}&redirect=#{CGI.escape(path)}"
    elsif my_host.present?
      "#{protocol}://#{my_host}#{path}"
    else
      "#{root_url.chomp('/')}#{path}"
    end
  end

  # Autres activités ouvertes aux inscriptions (cross-promo), hors activité courante.
  def build_other_trainings(current_training)
    app_host = ENV.fetch("APP_HOST", "terranova.semisto.org")
    protocol = Rails.env.production? ? "https" : "http"

    Academy::Training
      .where(status: "registrations_open")
      .where.not(id: current_training.id)
      .includes(:training_type, :sessions)
      .limit(3)
      .map do |t|
        first = t.sessions.min_by(&:start_date)
        { title: t.title,
          type_name: t.training_type&.name,
          date_label: first ? date_fr_short(first.start_date) : nil,
          url: "#{protocol}://#{app_host}/academy/#{t.id}/register" }
      end
  end

  # Lien vers la page admin Terranova d'une formation (où l'on dépose les
  # documents de session). Contrairement au portail participant, c'est l'app
  # admin (APP_HOST) qui est visée.
  def academy_admin_training_url(training)
    app_host = ENV.fetch("APP_HOST", "terranova.semisto.org")
    protocol = Rails.env.production? ? "https" : "http"
    "#{protocol}://#{app_host}/academy/#{training.id}"
  end

  def date_fr_short(date)
    mois = %w[janvier février mars avril mai juin juillet août septembre octobre novembre décembre]
    "#{date.day} #{mois[date.month - 1]} #{date.year}"
  end
end
