# frozen_string_literal: true

class MySemistoController < ApplicationController
  skip_before_action :track_member_activity

  before_action :require_contact_authentication, except: [:login, :request_magic_link, :verify_magic_link]

  inertia_share do
    {
      auth: {
        contact: if current_contact
          {
            id: current_contact.id.to_s,
            name: current_contact.display_name,
            email: current_contact.email
          }
        end,
        member: nil
      },
      flash: {
        notice: flash[:notice],
        alert: flash[:alert]
      }
    }
  end

  # ── Auth actions ──

  def login
    redirect_to "/my" and return if current_contact
    render inertia: "MySemisto/Login"
  end

  def request_magic_link
    email = params[:email].to_s.strip.downcase
    contact = Contact.find_by("LOWER(email) = ?", email)

    if contact
      ContactMailer.magic_link(contact).deliver_later
    end

    # Always redirect with same message (anti-enumeration)
    redirect_to "/my/login", notice: "Si cette adresse est connue, un lien de connexion vient de vous etre envoye par email."
  end

  def verify_magic_link
    token = params[:token].to_s
    data = Rails.application.message_verifier(:contact_login).verify(token, purpose: :contact_login)
    contact = Contact.find(data[:contact_id])
    session[:contact_id] = contact.id
    redirect_to "/my"
  rescue ActiveSupport::MessageVerifier::InvalidSignature, ActiveRecord::RecordNotFound
    redirect_to "/my/login", alert: "Lien invalide ou expire. Veuillez en demander un nouveau."
  end

  def logout
    session.delete(:contact_id)
    redirect_to "/my/login"
  end

  # ── Page actions ──

  def dashboard
    registrations = contact_registrations
    training_ids = registrations.map(&:training_id).uniq
    trainings = Academy::Training.where(id: training_ids).includes(:sessions, :training_type)

    upcoming = trainings.select { |t| t.sessions.any? { |s| s.start_date > Time.current } }

    render inertia: "MySemisto/Dashboard", props: {
      contactName: current_contact.display_name,
      upcomingTrainingsCount: upcoming.size,
      totalTrainingsCount: trainings.size
    }
  end

  def academy
    render inertia: "MySemisto/Academy"
  end

  def training_detail
    render inertia: "MySemisto/TrainingDetail", props: {
      trainingId: params[:training_id].to_s
    }
  end

  private

  def current_contact
    @current_contact ||= Contact.find_by(id: session[:contact_id]) if session[:contact_id]
  end
  helper_method :current_contact

  def require_contact_authentication
    unless current_contact
      redirect_to "/my/login"
    end
  end

  def contact_registrations
    Academy::TrainingRegistration
      .where("contact_id = :id OR LOWER(contact_email) = :email",
             id: current_contact.id,
             email: current_contact.email&.downcase)
  end
end
