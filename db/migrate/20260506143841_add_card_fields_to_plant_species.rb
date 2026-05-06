class AddCardFieldsToPlantSpecies < ActiveRecord::Migration[8.1]
  def change
    # Identité forestière
    add_column :plant_species, :strate, :string
    add_column :plant_species, :successional_role, :string

    # Temporel
    add_column :plant_species, :lifespan_min_years, :integer
    add_column :plant_species, :lifespan_max_years, :integer

    # Spatial
    add_column :plant_species, :planting_spacing_cm, :integer

    # Sol
    add_column :plant_species, :soil_ph, :jsonb, default: [], null: false
    add_column :plant_species, :soil_texture, :jsonb, default: [], null: false

    # Pollinisation
    add_column :plant_species, :pollination_distance_m, :integer
    add_column :plant_species, :specific_pollinators, :jsonb, default: [], null: false

    # Précautions
    add_column :plant_species, :is_drageonnant, :boolean, default: false, null: false
    add_column :plant_species, :toxicity, :jsonb, default: {}, null: false
    add_column :plant_species, :allelopathy, :string, default: "", null: false

    # Eco services / besoins (vocabulaire partagé)
    add_column :plant_species, :eco_services_provided, :jsonb, default: [], null: false
    add_column :plant_species, :eco_services_needed, :jsonb, default: [], null: false

    # Resources : parties par usage
    add_column :plant_species, :resource_parts, :jsonb, default: {}, null: false

    # Indices
    add_index :plant_species, :strate
    add_index :plant_species, :successional_role
    add_index :plant_species, "lower(replace(latin_name, ' ', '-'))",
              name: 'index_plant_species_on_slug'
  end
end
