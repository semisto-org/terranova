class AppController < ApplicationController
  before_action :require_authentication, except: [:design_client_portal]
  before_action :verify_client_portal_token!, only: [:design_client_portal]

  def index
    render inertia: "Foundation/AppIndex", props: {
      message: "Terranova app shell via Inertia.js",
      milestone: "Foundation"
    }
  end

  def lab
    render inertia: "Lab/Index", props: {
      milestone: "Lab Management",
      currentMemberId: current_member.id.to_s,
      stats: {
        members: Member.count,
        pitches: Pitch.count,
        bets: Bet.count,
        events: Event.count,
        wallets: Wallet.count,
        timesheets: Timesheet.count
      }
    }
  end

  def plants
    render inertia: "Plants/Index", props: {
      milestone: "Plant Database",
      currentContributorId: Plant::Contributor.order(:id).pick(:id)&.to_s,
      initialPaletteId: Plant::Palette.order(:id).pick(:id)&.to_s
    }
  end

  def design
    render inertia: "Design/Index", props: {
      milestone: "Design Studio",
      initialProjectId: nil
    }
  end

  def academy
    render inertia: "Academy/Index", props: {
      milestone: "Academy",
      initialTrainingId: nil
    }
  end

  def academy_training
    render inertia: "Academy/Index", props: {
      milestone: "Academy",
      initialTrainingId: params[:training_id].to_s
    }
  end

  def academy_training_type_form
    render inertia: "Academy/TrainingTypeForm", props: {
      milestone: "Academy",
      trainingTypeId: params[:id]
    }
  end

  def nursery
    render inertia: "Nursery/Index", props: {
      milestone: "Nursery"
    }
  end

  def design_project
    render inertia: "Design/Index", props: {
      milestone: "Design Studio",
      initialProjectId: params[:project_id].to_s
    }
  end

  def design_client_portal
    render inertia: "Design/ClientPortal", props: {
      milestone: "Design Studio Client Portal",
      initialProjectId: params[:project_id].to_s
    }
  end

  def profile
    render inertia: "Profile/Index", props: {
      milestone: "Profile"
    }
  end

  private

  def verify_client_portal_token!
    token = params[:token]
    unless token.present?
      render plain: "Lien invalide ou manquant.", status: :unauthorized
      return
    end

    begin
      data = Rails.application.message_verifier(:client_portal).verify(token, purpose: :client_portal_access)
      unless data[:project_id].to_s == params[:project_id].to_s
        render plain: "Lien invalide.", status: :unauthorized
      end
    rescue ActiveSupport::MessageVerifier::InvalidSignature
      render plain: "Lien invalide.", status: :unauthorized
    end
  end
end
