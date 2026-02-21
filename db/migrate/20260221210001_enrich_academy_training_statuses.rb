# frozen_string_literal: true

class EnrichAcademyTrainingStatuses < ActiveRecord::Migration[7.1]
  def up
    # Status values are validated at the model level, not DB level.
    # Update any existing records using old statuses to new ones.
    execute <<~SQL
      UPDATE academy_trainings SET status = 'in_preparation' WHERE status = 'draft';
      UPDATE academy_trainings SET status = 'published' WHERE status = 'registrations_open';
      UPDATE academy_trainings SET status = 'in_progress' WHERE status = 'in_progress';
    SQL
  end

  def down
    execute <<~SQL
      UPDATE academy_trainings SET status = 'draft' WHERE status IN ('idea', 'to_organize', 'in_preparation', 'to_publish');
      UPDATE academy_trainings SET status = 'registrations_open' WHERE status = 'published';
    SQL
  end
end
