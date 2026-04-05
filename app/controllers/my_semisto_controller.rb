# frozen_string_literal: true

class MySemistoController < ApplicationController
  include MySemistoRouting


  skip_before_action :track_member_activity

  before_action :require_contact_authentication, except: [:login, :request_magic_link, :verify_magic_link]

  inertia_share do
    {
      auth: {
        contact: if current_contact
          {
            id: current_contact.id.to_s,
            name: current_contact.display_name,
            email: current_contact.email,
            phone: current_contact.phone.to_s,
            city: current_contact.city.to_s,
            bio: current_contact.bio.to_s,
            expertise: current_contact.expertise || [],
            latitude: current_contact.latitude&.to_f,
            longitude: current_contact.longitude&.to_f,
            directoryVisible: current_contact.directory_visible,
            avatarUrl: current_contact.avatar_image.attached? ?
              Rails.application.routes.url_helpers.rails_blob_url(current_contact.avatar_image, only_path: true) : nil
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
    redirect_to my_semisto_path("/") and return if current_contact

    render inertia: "MySemisto/Login"
  end

  def request_magic_link
    email = params[:email].to_s.strip.downcase
    contact = Contact.find_by("LOWER(email) = ?", email)

    if contact
      ContactMailer.magic_link(contact).deliver_later
    end

    # Always redirect with same message (anti-enumeration)
    redirect_to my_semisto_path("/login"), notice: "Si cette adresse est connue, un lien de connexion vient de vous etre envoye par email."

  end

  def verify_magic_link
    token = params[:token].to_s
    data = verify_contact_token(token)
    contact = Contact.find(data[:contact_id] || data["contact_id"])
    session[:contact_id] = contact.id
    redirect_to my_semisto_path("/")
  rescue ActiveSupport::MessageVerifier::InvalidSignature, ActiveRecord::RecordNotFound
    redirect_to my_semisto_path("/login"), alert: "Lien invalide ou expire. Veuillez en demander un nouveau."

  end

  def logout
    session.delete(:contact_id)
    redirect_to my_semisto_path("/login")

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

  def directory
    render inertia: "MySemisto/Directory"
  end

  def directory_contact
    render inertia: "MySemisto/Directory", props: {
      contactId: params[:id].to_s
    }
  end

  def profile
    render inertia: "MySemisto/Profile"
  end

  private

  def current_contact
    @current_contact ||= Contact.find_by(id: session[:contact_id]) if session[:contact_id]
  end
  helper_method :current_contact

  def require_contact_authentication
    unless current_contact
      redirect_to my_semisto_path("/login")

    end
  end

  def verify_contact_token(token)
    verifier = Rails.application.message_verifier(:contact_login)
    begin
      verifier.verify(token, purpose: :contact_login)
    rescue ActiveSupport::MessageVerifier::InvalidSignature
      verifier.verify(token, purpose: :contact_impersonation)
    end
  end

  def contact_registrations
    Academy::TrainingRegistration
      .where("contact_id = :id OR LOWER(contact_email) = :email",
             id: current_contact.id,
             email: current_contact.email&.downcase)
  end
end
