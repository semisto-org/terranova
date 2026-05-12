# frozen_string_literal: true

namespace :strategy do
  desc "Advance deliberations past their phase deadline"
  task advance_deliberations: :environment do
    result = Strategy::Deliberation.advance_due!
    Rails.logger.info(
      "[strategy:advance_deliberations] open->voting=#{result[:open_to_voting]} voting->outcome_pending=#{result[:voting_to_outcome_pending]}"
    )
  end
end
