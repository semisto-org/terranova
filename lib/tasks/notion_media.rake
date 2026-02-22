# frozen_string_literal: true

namespace :notion do
  desc "Download all Notion media files to Active Storage"
  task download_media: :environment do
    downloader = NotionMediaDownloader.new(logger: Logger.new($stdout))
    stats = downloader.run
    puts "\nSummary: #{stats[:downloaded]} downloaded, #{stats[:skipped]} skipped, #{stats[:errors]} errors"
  end
end
