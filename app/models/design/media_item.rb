module Design
  class MediaItem < ApplicationRecord
    include SoftDeletable
    self.table_name = 'design_media_items'

    TYPES = %w[image video].freeze

    belongs_to :project, class_name: 'Design::Project'

    validates :media_type, :url, :uploaded_at, :taken_at, presence: true
    validates :media_type, inclusion: { in: TYPES }
  end
end
