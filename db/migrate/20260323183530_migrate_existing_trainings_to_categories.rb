class MigrateExistingTrainingsToCategories < ActiveRecord::Migration[8.1]
  def up
    execute <<~SQL
      INSERT INTO academy_participant_categories (training_id, label, price, max_spots, deposit_amount, position, created_at, updated_at)
      SELECT id, 'Tarif standard', price, max_participants, deposit_amount, 0, NOW(), NOW()
      FROM academy_trainings
      WHERE deleted_at IS NULL
    SQL

    execute <<~SQL
      INSERT INTO academy_registration_items (registration_id, participant_category_id, quantity, unit_price, discount_percent, subtotal, created_at, updated_at)
      SELECT r.id, c.id, 1, c.price, 0.0, c.price, NOW(), NOW()
      FROM academy_training_registrations r
      INNER JOIN academy_participant_categories c ON c.training_id = r.training_id
      WHERE r.deleted_at IS NULL
    SQL

    execute <<~SQL
      UPDATE academy_training_registrations
      SET payment_amount = (
        SELECT COALESCE(SUM(ri.subtotal), 0)
        FROM academy_registration_items ri
        WHERE ri.registration_id = academy_training_registrations.id
      )
      WHERE payment_amount = 0
        AND deleted_at IS NULL
        AND EXISTS (
          SELECT 1 FROM academy_registration_items ri
          WHERE ri.registration_id = academy_training_registrations.id AND ri.subtotal > 0
        )
    SQL
  end

  def down
    execute "DELETE FROM academy_registration_items"
    execute "DELETE FROM academy_participant_categories"
  end
end
