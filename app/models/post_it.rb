# frozen_string_literal: true

class PostIt < ApplicationRecord
  belongs_to :design_project, class_name: "Design::Project", optional: true
  belongs_to :training, class_name: "Academy::Training", optional: true
  belongs_to :pole_project, optional: true
end
