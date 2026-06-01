# frozen_string_literal: true

# Décision séance 2 (Michael × Mohammad) : le statut « en construction » fait
# doublon avec « en préparation ». On fusionne — les activités en construction
# passent en préparation et le statut disparaît du workflow.
class MergeInConstructionIntoInPreparation < ActiveRecord::Migration[8.1]
  def up
    execute <<~SQL
      UPDATE academy_trainings SET status = 'in_preparation' WHERE status = 'in_construction'
    SQL
  end

  def down
    # Irréversible (perte de l'information « en construction ») : no-op.
  end
end
