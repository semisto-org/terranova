# frozen_string_literal: true

require "net/http"
require "uri"
require "json"

class SlackNotifier
  # Slack n'est plus le canal par défaut (#106, « remplacer Slack ») : la source
  # de vérité est la boîte interne Hey! + le digest email. Slack reste un canal
  # de DÉBORDEMENT optionnel, OFF par défaut — on l'active explicitement en
  # posant SLACK_OVERFLOW_ENABLED=true.
  def self.overflow_enabled?
    ENV["SLACK_OVERFLOW_ENABLED"] == "true"
  end

  def self.post(text:, url: nil)
    return if Rails.env.test?
    return unless overflow_enabled?

    webhook_url = url || ENV["SLACK_WEBHOOK_URL"]
    return if webhook_url.blank?

    uri = URI.parse(webhook_url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"
    http.open_timeout = 5
    http.read_timeout = 5

    request = Net::HTTP::Post.new(uri.request_uri, { "Content-Type" => "application/json" })
    request.body = { text: text }.to_json
    http.request(request)
  rescue StandardError => e
    Rails.logger.error("[SlackNotifier] Failed to post: #{e.message}")
  end
end
