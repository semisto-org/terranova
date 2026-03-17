class SimplifyAcademyTrainingStatuses < ActiveRecord::Migration[8.1]
  def up
    execute <<~SQL
      UPDATE academy_trainings SET status = 'idea' WHERE status = 'draft';
      UPDATE academy_trainings SET status = 'in_construction' WHERE status = 'to_organize';
      UPDATE academy_trainings SET status = 'in_preparation' WHERE status IN ('planned', 'to_publish');
      UPDATE academy_trainings SET status = 'registrations_open' WHERE status = 'published';
      UPDATE academy_trainings SET status = 'post_production' WHERE status = 'post_training';
    SQL

    change_column_default :academy_trainings, :status, from: 'draft', to: 'idea'
  end

  def down
    execute <<~SQL
      UPDATE academy_trainings SET status = 'to_organize' WHERE status = 'in_construction';
      UPDATE academy_trainings SET status = 'post_training' WHERE status = 'post_production';
    SQL

    change_column_default :academy_trainings, :status, from: 'idea', to: 'draft'
  end
end
