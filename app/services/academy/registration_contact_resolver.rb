# frozen_string_literal: true

module Academy
  # Find-or-create du Contact rattaché à une inscription Academy.
  #
  # Point d'ingestion unique : toute inscription (admin OU paiement Stripe en
  # ligne OU backfill historique) passe par ici pour garantir qu'un Contact
  # existe et est relié. Le matching se fait sur l'email (case-insensitive) ;
  # un contact existant n'est jamais dupliqué.
  #
  # Retourne l'id du Contact résolu, ou nil si aucun email n'est fourni et
  # qu'aucun contact_id explicite n'est passé.
  class RegistrationContactResolver
    def self.call(...)
      new(...).call
    end

    # contact_id  : id explicite (priorité absolue, ex. sélection admin)
    # name / email / phone : données de l'inscription
    # newsletter  : marque le contact comme abonné si vrai
    def initialize(contact_id: nil, name: nil, email: nil, phone: nil, newsletter: false)
      @contact_id = contact_id.presence
      @name = name.to_s.strip
      @email = email.to_s.strip
      @phone = phone.to_s.strip.presence
      @newsletter = ActiveModel::Type::Boolean.new.cast(newsletter) || false
    end

    def call
      if @contact_id.present?
        Contact.where(id: @contact_id).update_all(newsletter_subscribed: true) if @newsletter
        return @contact_id
      end

      return nil if @email.blank?

      existing = Contact.find_by("LOWER(email) = ?", @email.downcase)
      if existing
        existing.update!(newsletter_subscribed: true) if @newsletter
        return existing.id
      end

      Contact.create!(
        contact_type: "person",
        name: @name,
        email: @email,
        phone: @phone,
        newsletter_subscribed: @newsletter
      ).id
    end
  end
end
