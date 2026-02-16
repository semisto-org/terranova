# frozen_string_literal: true

require "open3"

# Extracts EXIF metadata from image/video files using the system exiftool binary.
# Requires: exiftool installed (brew install exiftool / apt-get install libimage-exiftool-perl)
# Output: taken_at, device_make, device_model, width, height, exif_data (hash)
class ExifExtractor
  ALLOWED_KEYS = %w[
    DateTimeOriginal CreateDate ModifyDate MediaCreateDate
    Make Model ImageWidth ImageHeight
    GPSLatitude GPSLongitude LensModel FNumber ISO
  ].freeze

  class << self
    def extract(file_path)
      return {} unless File.exist?(file_path)

      output = run_exiftool(file_path)
      return {} if output.blank?

      data = output.is_a?(Array) ? output.first : output
      data = data.transform_keys { |k| k.to_s.strip }
      build_result(data)
    rescue Errno::ENOENT
      # exiftool not installed
      {}
    end

    private

    def run_exiftool(path)
      result = nil
      Open3.popen3("exiftool", "-j", "-q", path) do |_stdin, stdout, _stderr, _wait_thr|
        result = JSON.parse(stdout.read)
      end
      result
    end

    def build_result(data)
      taken_at = parse_datetime(
        data["DateTimeOriginal"] || data["CreateDate"] || data["ModifyDate"] || data["MediaCreateDate"]
      )
      make = data["Make"].to_s.strip
      model = data["Model"].to_s.strip
      width = data["ImageWidth"]&.to_i
      height = data["ImageHeight"]&.to_i

      exif_data = data.slice(*ALLOWED_KEYS).compact

      {
        taken_at: taken_at,
        device_make: make,
        device_model: model,
        width: width,
        height: height,
        exif_data: exif_data
      }
    end

    def parse_datetime(value)
      return nil if value.blank?

      value = value.to_s.strip
      return nil if value.empty?

      Time.zone.parse(value)
    rescue ArgumentError
      nil
    end
  end
end
