# frozen_string_literal: true

class Location::Zone < ApplicationRecord
  self.table_name = "location_zones"

  belongs_to :location, class_name: "Location", optional: true

  validates :name, presence: true
end
