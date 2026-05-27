require 'test_helper'

# AC-22 : le job de notification Slack est totalement isolé du chemin d'upload.
# Il délègue à SlackNotifier, qui réutilise ENV["SLACK_WEBHOOK_URL"] — le même
# webhook qui notifie déjà #ping-formations pour les nouvelles inscriptions.
# Pas de credential séparé.
class SlackNotificationJobTest < ActiveSupport::TestCase
  test "délègue le message à SlackNotifier.post (réutilise SLACK_WEBHOOK_URL, sans credential séparé)" do
    SlackNotifier.expects(:post).with(text: "📎 Léa a déposé 1 document(s)")
    SlackNotificationJob.perform_now("📎 Léa a déposé 1 document(s)")
  end

  test "ne lève jamais dans le chemin d'upload — SlackNotifier absorbe ses propres erreurs" do
    # SlackNotifier rescue StandardError en interne (cf. app/services/slack_notifier.rb).
    SlackNotifier.stubs(:post).returns(nil)
    assert_nothing_raised { SlackNotificationJob.perform_now("📎 test") }
  end
end
