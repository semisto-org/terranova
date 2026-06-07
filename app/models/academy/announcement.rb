# frozen_string_literal: true

module Academy
  # Actu / notification éditoriale liée à une activité, affichée aux
  # participant·es dans MySemisto (#17). Une actu est publiée en « confirmé »
  # ou « à confirmer » (contrôle éditorial du coordinateur).
  class Announcement < ApplicationRecord
    include SoftDeletable
    self.table_name = "academy_announcements"

    STATUSES = %w[confirmed to_confirm].freeze

    belongs_to :training, class_name: "Academy::Training", foreign_key: :training_id
    belongs_to :created_by, class_name: "Member", optional: true

    validates :body, presence: true
    validates :status, inclusion: { in: STATUSES }

    before_validation :default_published_at, on: :create

    scope :recent_first, -> { order(published_at: :desc, created_at: :desc) }

    private

    def default_published_at
      self.published_at ||= Time.current
    end
  end
end
