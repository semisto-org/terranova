# frozen_string_literal: true

class TaskList < ApplicationRecord
  belongs_to :taskable, polymorphic: true

  has_many :actions, dependent: :nullify
  has_many :tasks, dependent: :destroy

  validates :name, presence: true
end
