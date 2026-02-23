# frozen_string_literal: true

require "nokogiri"

class NotionHtmlRewriter
  NOTION_HOST_PATTERN = "prod-files-secure.s3.us-west-2.amazonaws.com"

  def initialize(logger: Rails.logger)
    @logger = logger
    @stats = { rewritten: 0, skipped: 0, errors: 0, total: 0 }
  end

  def run(dry_run: false, database_name: nil)
    scope = NotionRecord.where.not(content_html: [nil, ""])
    scope = scope.where(database_name: database_name) if database_name.present?

    records = scope.to_a
    @logger.info "[NotionHtmlRewriter] Processing #{records.size} records#{" (#{database_name})" if database_name}"

    records.each_with_index do |record, idx|
      process_record(record, idx + 1, records.size, dry_run: dry_run)
    end

    log_stats
    @stats
  end

  private

  def process_record(record, idx, total, dry_run:)
    @stats[:total] += 1
    html = record.content_html

    return unless html.include?(NOTION_HOST_PATTERN)

    doc = Nokogiri::HTML5.fragment(html)
    changed = false

    # Find all img tags with Notion URLs
    doc.css("img").each do |img|
      src = img["src"]
      next unless src.present? && src.include?(NOTION_HOST_PATTERN)

      stable_url = strip_expiry_params(src)
      asset = NotionAsset.find_by(notion_url: stable_url)

      if asset&.file&.attached?
        new_url = Rails.application.routes.url_helpers.url_for(asset.file)
        @logger.info "  [#{idx}/#{total}] Replacing image URL in #{record.notion_id}"
        img["src"] = new_url
        changed = true
        @stats[:rewritten] += 1
      else
        @logger.warn "  [#{idx}/#{total}] Asset not found for: #{stable_url[0..100]}..."
        @stats[:skipped] += 1
      end
    end

    # Find all a tags with Notion file URLs
    doc.css("a").each do |link|
      href = link["href"]
      next unless href.present? && href.include?(NOTION_HOST_PATTERN)

      stable_url = strip_expiry_params(href)
      asset = NotionAsset.find_by(notion_url: stable_url)

      if asset&.file&.attached?
        new_url = Rails.application.routes.url_helpers.url_for(asset.file)
        @logger.info "  [#{idx}/#{total}] Replacing link URL in #{record.notion_id}"
        link["href"] = new_url
        changed = true
        @stats[:rewritten] += 1
      else
        @logger.warn "  [#{idx}/#{total}] Asset not found for: #{stable_url[0..100]}..."
        @stats[:skipped] += 1
      end
    end

    if changed && !dry_run
      record.update!(content_html: doc.to_html)
    elsif changed && dry_run
      @logger.info "  [DRY RUN] Would update #{record.notion_id}"
    end

  rescue => e
    @logger.error "  [#{idx}/#{total}] Error processing #{record.notion_id}: #{e.message}"
    @stats[:errors] += 1
  end

  def strip_expiry_params(url)
    return url unless url.include?("?")
    url.split("?").first
  end

  def log_stats
    @logger.info "[NotionHtmlRewriter] Done: #{@stats[:rewritten]} rewritten, #{@stats[:skipped]} skipped, #{@stats[:errors]} errors, #{@stats[:total]} total"
  end
end
