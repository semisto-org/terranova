# frozen_string_literal: true

namespace :notion do
  desc "Rewrite Notion URLs in content_html to local Active Storage URLs (dry-run by default)"
  task rewrite_urls: :environment do
    dry_run = ENV["DRY_RUN"] != "false"
    database_name = ENV["DATABASE_NAME"]

    puts "=" * 70
    puts "📝 NOTION HTML URL REWRITER"
    puts "=" * 70
    puts "Mode: #{dry_run ? 'DRY RUN (no changes)' : 'LIVE (will update records)'}"
    puts "Database: #{database_name || 'all'}"
    puts ""

    rewriter = NotionHtmlRewriter.new(logger: Logger.new($stdout))
    stats = rewriter.run(dry_run: dry_run, database_name: database_name)

    puts ""
    puts "=" * 70
    puts "Results:"
    puts "  #{stats[:rewritten]} URLs rewritten"
    puts "  #{stats[:skipped]} URLs skipped (asset not found)"
    puts "  #{stats[:errors]} errors"
    puts "  #{stats[:total]} records processed"
    puts "=" * 70

    if dry_run && stats[:rewritten] > 0
      puts ""
      puts "To apply changes, run:"
      puts "  DRY_RUN=false bundle exec rails notion:rewrite_urls"
    end
  end
end
