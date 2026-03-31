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

    attachments.inline["academy-logo.png"] = File.read(
      Rails.root.join("public/icons/academy.png")
    )

    mail(
      to: @registration.contact_email,
      subject: "Confirmation d'inscription — #{@training.title}"
    )
  end
end
