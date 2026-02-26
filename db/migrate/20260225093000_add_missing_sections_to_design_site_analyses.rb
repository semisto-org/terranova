# frozen_string_literal: true

class AddMissingSectionsToDesignSiteAnalyses < ActiveRecord::Migration[8.0]
  def change
    add_column :design_site_analyses, :zoning, :jsonb, default: {}, null: false, if_not_exists: true
    add_column :design_site_analyses, :aesthetics, :jsonb, default: {}, null: false, if_not_exists: true
  end
end
