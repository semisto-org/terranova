module Design
  class Quote < ApplicationRecord
    self.table_name = 'design_quotes'

    STATUSES = %w[draft sent approved rejected expired].freeze

    belongs_to :project, class_name: 'Design::Project'
    has_many :lines, class_name: 'Design::QuoteLine', foreign_key: :quote_id, dependent: :destroy

    validates :title, :valid_until, :status, presence: true
    validates :status, inclusion: { in: STATUSES }
  end
end
