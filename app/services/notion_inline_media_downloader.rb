# frozen_string_literal: true

require "down"

class NotionInlineMediaDownloader
  NOTION_HOST_PATTERN = "prod-files-secure.s3.us-west-2.amazonaws.com"
  MAX_RETRIES = 2
  RETRY_DELAY = 5

  def initialize(logger: Rails.logger)
    @logger = logger
    @importer = NotionImporter.new
    @stats = { downloaded: 0, skipped: 0, errors: 0, total: 0, pages_processed: 0 }
  end

  # Re-fetch blocks from Notion API to get fresh URLs, then download inline images
  def run(database_name: nil, dry_run: false)
    scope = NotionRecord.where.not(content_html: [nil, ""])
    scope = scope.where("content_html LIKE ?", "%#{NOTION_HOST_PATTERN}%")
    scope = scope.where(database_name: database_name) if database_name.present?

    records = scope.to_a
    @logger.info "[NotionInlineMedia] Found #{records.size} records with Notion URLs in HTML"

    records.each_with_index do |record, idx|
      process_record(record, idx + 1, records.size, dry_run: dry_run)
    end

    log_stats
    @stats
  end

  private

  def process_record(record, idx, total, dry_run:)
    @stats[:pages_processed] += 1
    @logger.info "[#{idx}/#{total}] Re-fetching blocks for: #{record.notion_id} (#{record.title})"

    begin
      blocks = @importer.fetch_page_blocks(record.notion_id)
      fresh_html = @importer.blocks_to_html(blocks)

      # Extract fresh image URLs from the re-fetched blocks
      extract_and_download_from_blocks(blocks, record, idx, total, dry_run: dry_run)

      # Update HTML with fresh content (which has fresh URLs for now)
      unless dry_run
        record.update!(content_html: fresh_html)
      end

    rescue => e
      @logger.error "  [#{idx}/#{total}] Error fetching blocks for #{record.notion_id}: #{e.message}"
      @stats[:errors] += 1
    end
  end

  def extract_and_download_from_blocks(blocks, record, idx, total, dry_run:)
    blocks.each do |block|
      type = block["type"]

      if type == "image"
        url = block.dig("image", "file", "url") || block.dig("image", "external", "url")
        next unless url.present? && url.include?(NOTION_HOST_PATTERN)

        @stats[:total] += 1
        download_and_store(url, record.notion_id, idx, total, dry_run: dry_run)
      end

      # Process children recursively
      if block["children"].is_a?(Array)
        extract_and_download_from_blocks(block["children"], record, idx, total, dry_run: dry_run)
      end
    end
  end

  def download_and_store(url, source_id, idx, total, dry_run:)
    stable_url = strip_expiry_params(url)
    filename = extract_filename(url)

    # Skip if already downloaded
    existing = NotionAsset.find_by(notion_url: stable_url)
    if existing&.file&.attached?
      @logger.info "  [#{idx}/#{total}] Already exists: #{filename}"
      @stats[:skipped] += 1
      return
    end

    if dry_run
      @logger.info "  [DRY RUN] [#{idx}/#{total}] Would download: #{filename}"
      return
    end

    retries = 0
    begin
      @logger.info "  [#{idx}/#{total}] Downloading: #{filename}"

      tempfile = Down.download(url, max_redirects: 5)

      asset = existing || NotionAsset.new(
        notion_url: stable_url,
        source_id: source_id,
        property_name: "inline_image",
        filename: filename
      )

      asset.content_type = Marcel::MimeType.for(Pathname.new(tempfile.path))
      asset.downloaded_at = Time.current
      asset.file.attach(io: File.open(tempfile.path), filename: filename)
      asset.save!

      @stats[:downloaded] += 1
      @logger.info "  [#{idx}/#{total}] ✓ Downloaded: #{filename}"

    rescue Down::Error => e
      retries += 1
      if retries <= MAX_RETRIES
        @logger.warn "  [#{idx}/#{total}] Retry #{retries}/#{MAX_RETRIES}: #{e.message}"
        sleep(RETRY_DELAY)
        retry
      else
        @logger.error "  [#{idx}/#{total}] ✗ Failed: #{filename}: #{e.message}"
        @stats[:errors] += 1
      end
    rescue => e
      @logger.error "  [#{idx}/#{total}] ✗ Error: #{filename}: #{e.message}"
      @stats[:errors] += 1
    ensure
      tempfile&.close
      tempfile&.unlink
    end
  end

  def strip_expiry_params(url)
    return url unless url.include?("?")
    url.split("?").first
  end

  def extract_filename(url)
    base = strip_expiry_params(url)
    File.basename(URI.parse(base).path)
  rescue
    "file"
  end

  def log_stats
    @logger.info "[NotionInlineMedia] Done: #{@stats[:downloaded]} downloaded, #{@stats[:skipped]} skipped, #{@stats[:errors]} errors, #{@stats[:total]} URLs, #{@stats[:pages_processed]} pages"
  end
end
