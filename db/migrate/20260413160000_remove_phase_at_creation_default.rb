class RemovePhaseAtCreationDefault < ActiveRecord::Migration[8.1]
  def up
    change_column_default :strategy_deliberation_comments, :phase_at_creation, from: "draft", to: nil
  end

  def down
    change_column_default :strategy_deliberation_comments, :phase_at_creation, from: nil, to: "draft"
  end
end
