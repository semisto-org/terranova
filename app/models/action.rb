# frozen_string_literal: true

class Action < ApplicationRecord
  belongs_to :parent, class_name: "Action", optional: true
  belongs_to :pole_project, optional: true
  belongs_to :training, class_name: "Academy::Training", optional: true

  has_many :children, class_name: "Action", foreign_key: :parent_id, dependent: :nullify
end
