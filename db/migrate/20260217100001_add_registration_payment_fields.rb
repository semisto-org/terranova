class AddRegistrationPaymentFields < ActiveRecord::Migration[8.1]
  def change
    # Deposit amount configurable per training
    add_column :academy_trainings, :deposit_amount, :decimal, precision: 12, scale: 2, default: 0.0, null: false

    # Carpooling preference and Stripe payment tracking for registrations
    add_column :academy_training_registrations, :carpooling, :string, default: "none", null: false
    add_column :academy_training_registrations, :departure_city, :string, default: "", null: false
    add_column :academy_training_registrations, :stripe_payment_intent_id, :string
    add_column :academy_training_registrations, :payment_amount, :decimal, precision: 12, scale: 2, default: 0.0, null: false

    add_index :academy_training_registrations, :stripe_payment_intent_id, unique: true,
              where: "stripe_payment_intent_id IS NOT NULL",
              name: "idx_academy_registrations_stripe_pi"
  end
end
