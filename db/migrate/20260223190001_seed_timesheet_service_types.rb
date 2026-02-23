# frozen_string_literal: true

class SeedTimesheetServiceTypes < ActiveRecord::Migration[8.1]
  SERVICE_TYPES = [
    ["Administratif", nil],
    ["Animation", nil],
    ["Arpentage", "pre-projet"],
    ["Commercial", "offre"],
    ["Communication", nil],
    ["Conseil / partages", nil],
    ["Coordination (Academy)", nil],
    ["Coordination (Bureau)", nil],
    ["Design", nil],
    ["Formations", nil],
    ["Gestion de projet", nil],
    ["Gouvernance", nil],
    ["IT", nil],
    ["Jardins d'ici", nil],
    ["Maintenance", "co-gestion"],
    ["Maitrise d'oeuvre", "mise-en-oeuvre"],
    ["Mise en oeuvre", "mise-en-oeuvre"],
    ["Organisation de formations", nil],
    ["Peer Review", nil],
    ["Plantations", "mise-en-oeuvre"],
    ["Pré-projet", "pre-projet"],
    ["Prospection", "offre"],
    ["Réunion", nil],
    ["Structure du collectif", nil],
    ["Support technique", nil],
    ["Visite de suivi", nil],
  ].freeze

  def up
    return unless table_exists?(:timesheet_service_types)

    SERVICE_TYPES.each do |label, default_phase|
      TimesheetServiceType.find_or_create_by!(label: label) do |st|
        st.default_phase = default_phase
      end
    end
  end

  def down
    return unless table_exists?(:timesheet_service_types)

    execute "UPDATE design_project_timesheets SET service_type_id = NULL WHERE service_type_id IS NOT NULL"
    execute "UPDATE timesheets SET service_type_id = NULL WHERE service_type_id IS NOT NULL" if table_exists?(:timesheets)
    TimesheetServiceType.delete_all
  end
end
