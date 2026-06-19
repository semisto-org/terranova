# frozen_string_literal: true

# Préférences de distribution calme (#106) : digest email + heures calmes.
# Fuseau des heures calmes = Europe/Brussels FIXE pour tous (décision 18/06) ;
# seule la plage est ajustable par membre. Push email autorisé dans
# [quiet_hours_end_hour, quiet_hours_start_hour) ; défaut 8h–19h (silence 19h–8h).
class AddNotificationPreferencesToMembers < ActiveRecord::Migration[8.1]
  def change
    add_column :members, :email_digest_opt_in, :boolean, default: true, null: false
    add_column :members, :quiet_hours_start_hour, :integer, default: 19, null: false
    add_column :members, :quiet_hours_end_hour, :integer, default: 8, null: false
    # Idempotence du digest : un seul envoi par jour et par membre (un rejeu du
    # job le même jour ne renvoie pas un second email).
    add_column :members, :digest_last_sent_on, :date
  end
end
