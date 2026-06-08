class AddClosureFlagsToAcademyTrainings < ActiveRecord::Migration[8.1]
  def change
    # Critères de clôture manuels (#48) : cochés par l'équipe en post-production.
    # Les paiements participants sont calculés (payment_status), pas stockés ici.
    add_column :academy_trainings, :documents_sent, :boolean, default: false, null: false
    add_column :academy_trainings, :expenses_received, :boolean, default: false, null: false
  end
end
