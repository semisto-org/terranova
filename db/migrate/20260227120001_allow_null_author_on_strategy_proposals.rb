# frozen_string_literal: true

class AllowNullAuthorOnStrategyProposals < ActiveRecord::Migration[8.0]
  def change
    change_column_null :strategy_proposals, :author_id, true
    change_column_null :strategy_reactions, :member_id, true
  end
end
