# frozen_string_literal: true

class TaskList < ApplicationRecord
  belongs_to :pole_project, optional: true
  belongs_to :training, class_name: "Academy::Training", optional: true

  has_many :actions, dependent: :nullify

  validates :name, presence: true
end
