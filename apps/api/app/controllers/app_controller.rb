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
end
