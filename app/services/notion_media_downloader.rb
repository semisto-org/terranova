# frozen_string_literal: true

require "down"

class NotionMediaDownloader
  NOTION_HOST_PATTERN = "prod-files-secure.s3.us-west-2.amazonaws.com"
  MAX_RETRIES = 2
  RETRY_DELAY = 5

  def initialize(logger: Rails.logger)
    @logger = logger
    @importer = NotionImporter.new
    @stats = { downloaded: 0, skipped: 0, errors: 0, total: 0 }
  end

  def run(database_name: nil)
    scope = NotionRecord.all
    scope = scope.where(database_name: database_name) if database_name.present?

    records = scope.to_a
    @logger.info "[NotionMedia] Processing #{records.size} NotionRecords#{" (#{database_name})" if database_name}"

    records.each_with_index do |record, idx|
      process_record(record, idx + 1, records.size)
    end

    log_stats
    @stats
  end

  # Download media for a specific model's records by re-fetching from Notion API
  def download_for_database(database_id, database_name)
    @logger.info "[NotionMedia] Fetching fresh pages from Notion DB: #{database_name}"
    pages = @importer.fetch_database(database_id)
    @stats[:total] = pages.size

    pages.each_with_index do |page, idx|
      process_notion_page(page, database_name, idx + 1, pages.size)
    end

    log_stats
    @stats
  end

  private

  def process_record(record, idx, total)
    properties = record.properties
    return unless properties.is_a?(Hash)

    properties.each do |prop_name, prop_value|
      next unless prop_value.is_a?(Hash) && prop_value["type"] == "files"
      extract_and_download_files(prop_value["files"], record.notion_id, prop_name, record, idx, total)
    end
  end

  def process_notion_page(page, database_name, idx, total)
    notion_id = page["id"]
    props = page["properties"] || {}
    record = NotionRecord.find_by(notion_id: notion_id)

    props.each do |prop_name, prop_value|
      next unless prop_value.is_a?(Hash) && prop_value["type"] == "files"
      extract_and_download_files(prop_value["files"], notion_id, prop_name, record, idx, total)
    end
  end

  def extract_and_download_files(files, notion_id, prop_name, record, idx, total)
    return unless files.is_a?(Array)

    files.each do |file_entry|
      url = file_entry.dig("file", "url") if file_entry["type"] == "file"
      next unless url.present? && url.include?(NOTION_HOST_PATTERN)

      filename = file_entry["name"] || begin
        File.basename(URI.parse(url).path)
      rescue
        "file"
      end
      stable_url = strip_expiry_params(url)

      # Skip if already downloaded
      existing = NotionAsset.find_by(notion_url: stable_url)
      if existing&.downloaded_at.present? && existing&.file&.attached?
        @stats[:skipped] += 1
        next
      end

      download_and_attach(
        fresh_url: url,
        stable_url: stable_url,
        filename: filename,
        source_id: notion_id,
        property_name: prop_name,
        record: record,
        index: idx,
        total: total
      )
    end
  end

  def download_and_attach(fresh_url:, stable_url:, filename:, source_id:, property_name:, record:, index:, total:)
    retries = 0
    begin
      tempfile = Down.download(fresh_url, max_size: 100 * 1024 * 1024)
      size_mb = (tempfile.size / 1_048_576.0).round(2)
      @logger.info "[NotionMedia] #{index}/#{total} Downloading: #{filename} (#{size_mb} MB) from #{source_id}##{property_name}"

      content_type = tempfile.content_type || "application/octet-stream"

      asset = NotionAsset.find_or_initialize_by(notion_url: stable_url)
      asset.assign_attributes(
        original_url: fresh_url,
        source_type: "property",
        source_id: source_id,
        property_name: property_name,
        filename: filename,
        content_type: content_type,
        downloaded_at: Time.current,
        notion_record: record
      )
      asset.save!
      asset.file.attach(io: tempfile, filename: filename, content_type: content_type)

      @stats[:downloaded] += 1
    rescue Down::Error, Net::OpenTimeout, Net::ReadTimeout, Errno::ECONNRESET, Down::TooLarge => e
      if retries < MAX_RETRIES
        retries += 1
        @logger.warn "[NotionMedia] Retry #{retries}/#{MAX_RETRIES} for #{filename}: #{e.message}"
        sleep RETRY_DELAY
        retry
      else
        @stats[:errors] += 1
        @logger.error "[NotionMedia] Failed: #{filename} (#{source_id}): #{e.message}"
      end
    rescue => e
      @stats[:errors] += 1
      @logger.error "[NotionMedia] Error: #{filename} (#{source_id}): #{e.class} #{e.message}"
    ensure
      tempfile&.close
      tempfile&.unlink if tempfile.respond_to?(:unlink)
    end
  end

  def strip_expiry_params(url)
    uri = URI.parse(url)
    uri.query = nil
    uri.fragment = nil
    uri.to_s
  rescue URI::InvalidURIError
    url
  end

  def log_stats
    @logger.info "[NotionMedia] Done. Downloaded: #{@stats[:downloaded]}, Skipped: #{@stats[:skipped]}, Errors: #{@stats[:errors]}"
  end
end
