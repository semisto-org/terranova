class ScopeTask < ApplicationRecord
  belongs_to :scope

  validates :title, presence: true
end
