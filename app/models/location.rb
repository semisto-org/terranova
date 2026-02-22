# frozen_string_literal: true

class Location < ApplicationRecord
  has_many :zones, class_name: "Location::Zone", dependent: :destroy

  validates :name, presence: true
end
