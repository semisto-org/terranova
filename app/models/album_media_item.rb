# frozen_string_literal: true

class AlbumMediaItem < ApplicationRecord
  include SoftDeletable

  MEDIA_TYPES = %w[image video].freeze
  ACCEPTED_IMAGE_TYPES = %w[image/jpeg image/png image/webp image/heic].freeze
  ACCEPTED_VIDEO_TYPES = %w[video/mp4 video/quicktime video/webm].freeze
  ACCEPTED_CONTENT_TYPES = (ACCEPTED_IMAGE_TYPES + ACCEPTED_VIDEO_TYPES).freeze

  belongs_to :album
  has_one_attached :file

  validates :media_type, presence: true, inclusion: { in: MEDIA_TYPES }
  validate :file_attached
  validate :file_content_type_allowed

  before_validation :set_media_type_from_file, if: -> { file.attached? }
  after_commit :extract_exif_after_attach, on: [:create, :update]

  def device_display_name
    [device_make, device_model].reject(&:blank?).join(" ").presence || "Unknown device"
  end

  private

  def file_attached
    errors.add(:file, "must be attached") unless file.attached?
  end

  def file_content_type_allowed
    return unless file.attached?

    content_type = file.blob.content_type
    return if ACCEPTED_CONTENT_TYPES.include?(content_type)

    errors.add(:file, "must be an image (JPEG, PNG, WebP, HEIC) or video (MP4, MOV, WebM)")
  end

  def set_media_type_from_file
    return unless file.attached?

    content_type = file.blob.content_type
    self.media_type = if ACCEPTED_IMAGE_TYPES.include?(content_type)
      "image"
    elsif ACCEPTED_VIDEO_TYPES.include?(content_type)
      "video"
    end
  end

  def extract_exif_after_attach
    return unless file.attached?
    return if file.blob.nil?

    file.blob.open do |tmp_file|
      result = ExifExtractor.extract(tmp_file.path) || {}
      attrs = {
        taken_at: result[:taken_at].presence || created_at,
        device_make: result[:device_make].to_s,
        device_model: result[:device_model].to_s,
        width: result[:width],
        height: result[:height],
        exif_data: result[:exif_data] || {}
      }
      update_columns(attrs)
    end
  rescue Errno::ENOENT, StandardError
    update_columns(taken_at: created_at) if taken_at.nil?
  end
end
