# frozen_string_literal: true

require "nokogiri"
require "down"
require "uri"

class NotionInlineMediaDownloader
  NOTION_HOST_PATTERN = "prod-files-secure.s3.us-west-2.amazonaws.com"
  MAX_RETRIES = 2
  RETRY_DELAY = 5

  def initialize(logger: Rails.logger)
    @logger = logger
    @stats = { downloaded: 0, skipped: 0, errors: 0, total: 0 }
  end

  def run(database_name: nil, dry_run: false)
    scope = NotionRecord.where.not(content_html: [nil, ""])
    scope = scope.where(database_name: database_name) if database_name.present?

    records = scope.to_a
    @logger.info "[NotionInlineMedia] Processing #{records.size} records#{" (#{database_name})" if database_name}"

    records.each_with_index do |record, idx|
      process_record(record, idx + 1, records.size, dry_run: dry_run)
    end

    log_stats
    @stats
  end

  private

  def process_record(record, idx, total, dry_run:)
    doc = Nokogiri::HTML5.fragment(record.content_html)
    
    # Find all img tags with Notion URLs
    doc.css("img").each do |img|
      src = img["src"]
      next unless src.present? && src.include?(NOTION_HOST_PATTERN)
      
      @stats[:total] += 1
      download_url(src, record.notion_id, "image", idx, total, dry_run: dry_run)
    end

    # Find all a tags with Notion file URLs
    doc.css("a").each do |link|
      href = link["href"]
      next unless href.present? && href.include?(NOTION_HOST_PATTERN)
      
      @stats[:total] += 1
      download_url(href, record.notion_id, "file", idx, total, dry_run: dry_run)
    end

  rescue => e
    @logger.error "  [#{idx}/#{total}] Error processing #{record.notion_id}: #{e.message}"
    @stats[:errors] += 1
  end

  def download_url(url, source_id, type, idx, total, dry_run:)
    stable_url = strip_expiry_params(url)
    filename = extract_filename(url)
    
    # Skip if already downloaded
    existing = NotionAsset.find_by(notion_url: stable_url)
    if existing
      @logger.info "  [#{idx}/#{total}] Skipping (already exists): #{filename}"
      @stats[:skipped] += 1
      return
    end

    if dry_run
      @logger.info "  [DRY RUN] [#{idx}/#{total}] Would download: #{filename}"
      return
    end

    # Download with retries
    retries = 0
    begin
      @logger.info "  [#{idx}/#{total}] Downloading: #{filename}"
      
      tempfile = Down.download(url, max_redirects: 5)
      
      asset = NotionAsset.new(
        notion_url: stable_url,
        source_id: source_id,
        property_name: "inline_#{type}",
        filename: filename,
        content_type: Marcel::MimeType.for(Pathname.new(tempfile.path)),
        downloaded_at: Time.current
      )
      
      asset.file.attach(io: File.open(tempfile.path), filename: filename)
      asset.save!
      
      @stats[:downloaded] += 1
      @logger.info "  [#{idx}/#{total}] ✓ Downloaded: #{filename}"
      
    rescue Down::Error => e
      retries += 1
      if retries <= MAX_RETRIES
        @logger.warn "  [#{idx}/#{total}] Retry #{retries}/#{MAX_RETRIES} after error: #{e.message}"
        sleep(RETRY_DELAY)
        retry
      else
        @logger.error "  [#{idx}/#{total}] ✗ Failed to download #{filename}: #{e.message}"
        @stats[:errors] += 1
      end
    rescue => e
      @logger.error "  [#{idx}/#{total}] ✗ Error saving #{filename}: #{e.message}"
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
    @logger.info "[NotionInlineMedia] Done: #{@stats[:downloaded]} downloaded, #{@stats[:skipped]} skipped, #{@stats[:errors]} errors, #{@stats[:total]} total"
  end
end
