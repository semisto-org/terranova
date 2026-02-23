# frozen_string_literal: true

namespace :notion do
  desc "Download inline media (images, files) from Notion HTML content to Active Storage"
  task download_inline_media: :environment do
    dry_run = ENV["DRY_RUN"] != "false"
    database_name = ENV["DATABASE_NAME"]

    puts "=" * 70
    puts "📥 NOTION INLINE MEDIA DOWNLOADER"
    puts "=" * 70
    puts "Mode: #{dry_run ? 'DRY RUN (no downloads)' : 'LIVE (will download)'}"
    puts "Database: #{database_name || 'all'}"
    puts ""

    downloader = NotionInlineMediaDownloader.new(logger: Logger.new($stdout))
    stats = downloader.run(database_name: database_name, dry_run: dry_run)

    puts ""
    puts "=" * 70
    puts "Results:"
    puts "  #{stats[:downloaded]} files downloaded"
    puts "  #{stats[:skipped]} files skipped (already exist)"
    puts "  #{stats[:errors]} errors"
    puts "  #{stats[:total]} URLs processed"
    puts "=" * 70

    if dry_run && stats[:total] > 0
      puts ""
      puts "To download files, run:"
      puts "  DRY_RUN=false bundle exec rails notion:download_inline_media"
    end
  end
end
