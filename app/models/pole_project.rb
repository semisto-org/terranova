# frozen_string_literal: true

class PoleProject < ApplicationRecord
  has_many :task_lists, dependent: :destroy
  has_many :actions, dependent: :destroy
  has_many :events, dependent: :nullify
  has_many :timesheets, dependent: :nullify

  validates :name, presence: true
end
