# frozen_string_literal: true

# Délibération #20 — « Rémunération, rétrocession et attribution des projets #design »
# (adoptée par consentement le 27/05/2026). Outille le nouveau cadre économique
# du bureau d'études : taux designer par projet, formats de projet avec leur taux
# de rétrocession, contribution Semisto sur offres + recettes, et clôture de projet.
class AddDesignEconomicsFrameworkDelib20 < ActiveRecord::Migration[8.1]
  def change
    change_table :design_projects, bulk: true do |t|
      # Taux horaire designer choisi librement entre 40 et 60 €/h, projet par projet.
      # Tarif client aligné sur ce taux. NULL => valeur par défaut BillingConfig.hourly_rate.
      t.decimal :designer_rate, precision: 8, scale: 2
      # Format reconnu par la délibération : a/b (standard, petit projet) = 15 %,
      # c (collaboration facilitée hors mission) = commission 5 %, d (projet perso) = hors Semisto.
      t.string :format_code
      # Taux de rétrocession effectif du projet. NULL => défaut du format, puis BillingConfig.asbl_support_rate.
      t.decimal :retrocession_rate, precision: 5, scale: 4
      # Clôture de projet : retour d'expérience consigné dans Terranova à la clôture.
      t.datetime :closed_at
      t.text :closure_feedback
    end

    # Ligne « Contribution au fonctionnement de Semisto ASBL » sur les offres (devis).
    change_table :design_quotes, bulk: true do |t|
      t.decimal :contribution_rate, precision: 5, scale: 4, default: 0, null: false
      t.decimal :contribution_amount, precision: 12, scale: 2, default: 0, null: false
    end

    # Part « Contribution Semisto » portée par une recette.
    add_column :revenues, :contribution_semisto_amount, :decimal, precision: 12, scale: 2, default: 0, null: false
  end
end
