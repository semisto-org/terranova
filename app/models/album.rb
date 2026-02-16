# frozen_string_literal: true

class Album < ApplicationRecord
  include SoftDeletable

  STATUSES = %w[active archived].freeze

  belongs_to :albumable, polymorphic: true, optional: true
  has_many :media_items, class_name: "AlbumMediaItem", dependent: :destroy

  before_validation :set_default_status, on: :create

  validates :title, presence: true
  validates :status, inclusion: { in: STATUSES }

  def media_count
    media_items.count
  end

  def cover_media_item
    media_items.order(Arel.sql("taken_at ASC NULLS LAST"), created_at: :asc).first
  end

  private

  def set_default_status
    self.status = "active" if status.blank?
  end
end
