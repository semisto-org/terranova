# frozen_string_literal: true

class AddDesignAnalysisAndProjectParamsFields < ActiveRecord::Migration[8.0]
  def change
    add_column :design_site_analyses, :water_access, :boolean
    add_column :design_site_analyses, :zoning_categories, :jsonb, default: [], null: false

    add_column :design_projects, :client_interests, :jsonb, default: [], null: false
    add_column :design_projects, :acquisition_channel, :string
  end
end
