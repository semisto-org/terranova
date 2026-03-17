class AddStatusToAcademyTrainingAttendances < ActiveRecord::Migration[8.1]
  def up
    add_column :academy_training_attendances, :status, :string, null: false, default: 'absent'

    execute <<~SQL
      UPDATE academy_training_attendances
      SET status = CASE WHEN is_present THEN 'present' ELSE 'absent' END
    SQL

    remove_column :academy_training_attendances, :is_present
  end

  def down
    add_column :academy_training_attendances, :is_present, :boolean, null: false, default: false

    execute <<~SQL
      UPDATE academy_training_attendances
      SET is_present = (status = 'present')
    SQL

    remove_column :academy_training_attendances, :status
  end
end
