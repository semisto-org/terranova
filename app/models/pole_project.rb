# frozen_string_literal: true

class PoleProject < ApplicationRecord
  validates :name, presence: true
end
