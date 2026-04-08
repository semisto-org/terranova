# frozen_string_literal: true

class BackfillProjectableColumns < ActiveRecord::Migration[8.1]
  def up
    # Expenses: design_project_id takes precedence over training_id
    execute <<~SQL
      UPDATE expenses SET projectable_type = 'Design::Project', projectable_id = design_project_id
      WHERE design_project_id IS NOT NULL
    SQL
    execute <<~SQL
      UPDATE expenses SET projectable_type = 'Academy::Training', projectable_id = training_id
      WHERE training_id IS NOT NULL AND design_project_id IS NULL
    SQL

    # Revenues: same precedence
    execute <<~SQL
      UPDATE revenues SET projectable_type = 'Design::Project', projectable_id = design_project_id
      WHERE design_project_id IS NOT NULL
    SQL
    execute <<~SQL
      UPDATE revenues SET projectable_type = 'Academy::Training', projectable_id = training_id
      WHERE training_id IS NOT NULL AND design_project_id IS NULL
    SQL

    # Timesheets: design_project_id > training_id > pole_project_id
    execute <<~SQL
      UPDATE timesheets SET projectable_type = 'Design::Project', projectable_id = design_project_id
      WHERE design_project_id IS NOT NULL
    SQL
    execute <<~SQL
      UPDATE timesheets SET projectable_type = 'Academy::Training', projectable_id = training_id
      WHERE training_id IS NOT NULL AND design_project_id IS NULL
    SQL
    execute <<~SQL
      UPDATE timesheets SET projectable_type = 'PoleProject', projectable_id = pole_project_id
      WHERE pole_project_id IS NOT NULL AND design_project_id IS NULL AND training_id IS NULL
    SQL

    # Events: pole_project_id only
    execute <<~SQL
      UPDATE events SET projectable_type = 'PoleProject', projectable_id = pole_project_id
      WHERE pole_project_id IS NOT NULL
    SQL

    # KnowledgeSections: guild_id only
    execute <<~SQL
      UPDATE knowledge_sections SET projectable_type = 'Guild', projectable_id = guild_id
      WHERE guild_id IS NOT NULL
    SQL
  end

  def down
    # Reverse: copy polymorphic back to legacy FK columns
    execute <<~SQL
      UPDATE expenses SET design_project_id = projectable_id WHERE projectable_type = 'Design::Project'
    SQL
    execute <<~SQL
      UPDATE expenses SET training_id = projectable_id WHERE projectable_type = 'Academy::Training'
    SQL

    execute <<~SQL
      UPDATE revenues SET design_project_id = projectable_id WHERE projectable_type = 'Design::Project'
    SQL
    execute <<~SQL
      UPDATE revenues SET training_id = projectable_id WHERE projectable_type = 'Academy::Training'
    SQL

    execute <<~SQL
      UPDATE timesheets SET design_project_id = projectable_id WHERE projectable_type = 'Design::Project'
    SQL
    execute <<~SQL
      UPDATE timesheets SET training_id = projectable_id WHERE projectable_type = 'Academy::Training'
    SQL
    execute <<~SQL
      UPDATE timesheets SET pole_project_id = projectable_id WHERE projectable_type = 'PoleProject'
    SQL

    execute <<~SQL
      UPDATE events SET pole_project_id = projectable_id WHERE projectable_type = 'PoleProject'
    SQL

    execute <<~SQL
      UPDATE knowledge_sections SET guild_id = projectable_id WHERE projectable_type = 'Guild'
    SQL

    # Clear polymorphic columns
    %w[expenses revenues timesheets events knowledge_sections].each do |table|
      execute "UPDATE #{table} SET projectable_type = NULL, projectable_id = NULL"
    end
  end
end
