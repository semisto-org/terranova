# frozen_string_literal: true

class DesignAction < ApplicationRecord
  belongs_to :design_project, class_name: "Design::Project", optional: true
end
