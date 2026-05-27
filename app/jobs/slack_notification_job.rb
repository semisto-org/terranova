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
    # Réutilise l'intégration Slack existante : SlackNotifier retombe sur
    # ENV["SLACK_WEBHOOK_URL"] — le même webhook qui notifie déjà #ping-formations
    # pour les nouvelles inscriptions. Pas de credential séparé à configurer.
    SlackNotifier.post(text: text)
  end
end
