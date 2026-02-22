# frozen_string_literal: true

class PlantRecord < ApplicationRecord
  belongs_to :species, class_name: "Plant::Species", optional: true
  belongs_to :variety, class_name: "Plant::Variety", optional: true
  belongs_to :location, class_name: "Location", optional: true
  belongs_to :zone, class_name: "Location::Zone", optional: true
end
