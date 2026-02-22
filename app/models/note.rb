# frozen_string_literal: true

class Note < ApplicationRecord
  belongs_to :pole_project, optional: true
end
