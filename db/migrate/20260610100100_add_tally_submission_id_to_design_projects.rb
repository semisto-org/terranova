# frozen_string_literal: true

class AddTallySubmissionIdToDesignProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :design_projects, :tally_submission_id, :string
    add_index :design_projects, :tally_submission_id, unique: true,
              where: "tally_submission_id IS NOT NULL",
              name: "index_design_projects_on_tally_submission_id"
  end
end
