class Scope < ApplicationRecord
  belongs_to :pitch
  has_many :scope_tasks, dependent: :destroy

  validates :name, presence: true
  validates :hill_position, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
end
