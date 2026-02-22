# frozen_string_literal: true

class NotionAsset < ApplicationRecord
  has_one_attached :file

  belongs_to :notion_record, optional: true
  belongs_to :attachable, polymorphic: true, optional: true

  validates :source_type, inclusion: { in: %w[property block] }, allow_nil: true

  scope :downloaded, -> { where.not(downloaded_at: nil) }
  scope :pending, -> { where(downloaded_at: nil) }

  # Notion URLs expire after ~1h. Check if the original URL base matches.
  def notion_hosted?
    (notion_url || original_url).to_s.include?("prod-files-secure.s3.us-west-2.amazonaws.com")
  end
end
