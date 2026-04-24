# frozen_string_literal: true

module Strategy
  class DeliberationDecider < ApplicationRecord
    self.table_name = "strategy_deliberation_deciders"

    belongs_to :deliberation, class_name: "Strategy::Deliberation"
    belongs_to :member

    validates :member_id, uniqueness: { scope: :deliberation_id }
    validate :member_must_be_effective

    private

    def member_must_be_effective
      return if member&.effective?
      errors.add(:member, "doit être un membre effectif")
    end
  end
end
