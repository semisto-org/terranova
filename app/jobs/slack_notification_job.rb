# frozen_string_literal: true

# Posts a best-effort notification to the Semisto Slack channel #ping-formations
# after a trainer deposits document(s) on a training page in My Semisto.
#
# Fully isolated from the upload transaction (D6): a failing webhook (missing
# credential, network error, 4xx/5xx) never breaks the upload — the document is
# already saved and visible. SlackNotifier itself rescues and logs without
# raising; this job bounds its retries and then gives up quietly.
class SlackNotificationJob < ApplicationJob
  queue_as :documents

  # Bounded retries for transient network blips. After that, abandon silently:
  # a missed Slack ping must never cascade into a failure the user can feel.
  retry_on StandardError, wait: :polynomially_longer, attempts: 3

  def perform(text)
    webhook_url = self.class.webhook_url

    if webhook_url.blank?
      Rails.logger.warn("[SlackNotificationJob] No #ping-formations webhook configured — skipping")
      return
    end

    SlackNotifier.post(text: text, url: webhook_url)
  end

  # Webhook URL lives in Rails credentials (never hardcoded, never plain ENV).
  # `dig` returns nil safely when the :slack section does not exist yet, so the
  # job degrades to a logged no-op instead of crashing.
  def self.webhook_url
    Rails.application.credentials.dig(:slack, :ping_formations_webhook_url)
  end
end
