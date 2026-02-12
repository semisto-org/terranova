class AppController < ApplicationController
  def index
    render inertia: "Foundation/AppIndex", props: {
      message: "Terranova app shell via Inertia.js",
      milestone: "Foundation"
    }
  end

  def lab
    first_member_id = Member.order(:id).pick(:id)&.to_s

    render inertia: "Lab/Index", props: {
      milestone: "Lab Management",
      currentMemberId: first_member_id,
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
end
