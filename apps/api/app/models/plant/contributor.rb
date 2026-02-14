module Plant
  class Contributor < ApplicationRecord
    self.table_name = 'plant_contributors'

    has_many :photos, class_name: 'Plant::Photo', foreign_key: :contributor_id, dependent: :destroy
    has_many :notes, class_name: 'Plant::Note', foreign_key: :contributor_id, dependent: :destroy

    validates :name, :joined_at, presence: true
  end
end
