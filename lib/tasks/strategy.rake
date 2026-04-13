# frozen_string_literal: true

namespace :strategy do
  desc "Advance deliberations past their phase deadline"
  task advance_deliberations: :environment do
    open_count = 0
    Strategy::Deliberation
      .where(status: "open")
      .where("opened_at <= ?", 15.days.ago)
      .find_each do |delib|
        delib.transition_to_voting!
        open_count += 1
      end

    voting_count = 0
    Strategy::Deliberation
      .where(status: "voting")
      .where("voting_deadline <= ?", Time.current)
      .find_each do |delib|
        delib.transition_to_outcome_pending!
        voting_count += 1
      end

    Rails.logger.info(
      "[strategy:advance_deliberations] open->voting=#{open_count} voting->outcome_pending=#{voting_count}"
    )
  end
end
