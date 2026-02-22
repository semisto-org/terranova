# frozen_string_literal: true

require "down"
require "marcel"

class NotionMediaDownloader
  NOTION_HOST_PATTERN = "prod-files-secure.s3.us-west-2.amazonaws.com"
  MAX_RETRIES = 1
  RETRY_DELAY = 5

  def initialize(logger: Rails.logger)
    @logger = logger
    @stats = { downloaded: 0, skipped: 0, errors: 0 }
  end

  def run
    media_items = extract_all_media
    total = media_items.size
    @logger.info "[NotionMediaDownloader] Found #{total} Notion-hosted media items to process"

    media_items.each_with_index do |item, index|
      process_media_item(item, index + 1, total)
    end

    @logger.info "[NotionMediaDownloader] Done. Downloaded: #{@stats[:downloaded]}, Skipped: #{@stats[:skipped]}, Errors: #{@stats[:errors]}"
    @stats
  end

  private

  def extract_all_media
    items = []

    NotionRecord.find_each do |record|
      items.concat(extract_property_files(record))
      items.concat(extract_content_images(record))
    end

    items
  end

  # Extract files from properties of type "files"
  def extract_property_files(record)
    items = []
    properties = record.properties || {}

    properties.each do |prop_name, prop_value|
      next unless prop_value.is_a?(Hash) && prop_value["type"] == "files"

      files = prop_value["files"] || []
      files.each do |file_entry|
        url = nil
        if file_entry["type"] == "file" && file_entry.dig("file", "url")
          url = file_entry.dig("file", "url")
        end
        # Skip external files (Google Drive, Unsplash, etc.)
        next unless url && url.include?(NOTION_HOST_PATTERN)

        filename = file_entry["name"] || File.basename(URI.parse(url).path)
        items << {
          notion_url: strip_expiry_params(url),
          fresh_url: url,
          source_type: "property",
          source_id: record.notion_id,
          property_name: prop_name,
          filename: filename
        }
      end
    end

    items
  end

  # Extract images from stored HTML content
  def extract_content_images(record)
    items = []
    html = record.content_html
    return items if html.blank?

    # Find all img src URLs that are Notion-hosted
    html.scan(/src=["']([^"']+)["']/).flatten.each do |url|
      next unless url.include?(NOTION_HOST_PATTERN)

      filename = File.basename(URI.parse(url).path) rescue "image"
      items << {
        notion_url: strip_expiry_params(url),
        fresh_url: url,
        source_type: "block",
        source_id: record.notion_id,
        property_name: nil,
        filename: filename
      }
    end

    items
  end

  def process_media_item(item, index, total)
    # Check if already downloaded (by base URL without expiry params)
    existing = NotionAsset.find_by(notion_url: item[:notion_url])
    if existing&.downloaded_at.present? && existing.file.attached?
      @stats[:skipped] += 1
      return
    end

    download_and_attach(item, existing, index, total)
  rescue => e
    @stats[:errors] += 1
    @logger.error "[NotionMediaDownloader] Error processing #{item[:filename]}: #{e.message}"
  end

  def download_and_attach(item, existing_asset, index, total)
    retries = 0
    begin
      tempfile = Down.download(item[:fresh_url], max_size: 100 * 1024 * 1024) # 100MB max

      size_mb = (tempfile.size / 1_048_576.0).round(2)
      @logger.info "Downloading asset #{index}/#{total}: #{item[:filename]} (#{size_mb} MB)"

      content_type = tempfile.content_type || Marcel::MimeType.for(tempfile, name: item[:filename])

      asset = existing_asset || NotionAsset.new(
        notion_url: item[:notion_url],
        source_type: item[:source_type],
        source_id: item[:source_id],
        property_name: item[:property_name]
      )

      asset.filename = item[:filename]
      asset.content_type = content_type
      asset.downloaded_at = Time.current
      asset.save!

      asset.file.attach(
        io: tempfile,
        filename: item[:filename],
        content_type: content_type
      )

      @stats[:downloaded] += 1
    rescue Down::Error, Net::OpenTimeout, Net::ReadTimeout, Errno::ECONNRESET => e
      if retries < MAX_RETRIES
        retries += 1
        @logger.warn "[NotionMediaDownloader] Retry #{retries}/#{MAX_RETRIES} for #{item[:filename]}: #{e.message}"
        sleep RETRY_DELAY
        retry
      else
        raise
      end
    ensure
      tempfile&.close
      tempfile&.unlink if tempfile.respond_to?(:unlink)
    end
  end

  # Strip AWS expiry query params to get a stable URL for deduplication
  def strip_expiry_params(url)
    uri = URI.parse(url)
    uri.query = nil
    uri.fragment = nil
    uri.to_s
  rescue URI::InvalidURIError
    url
  end
end
