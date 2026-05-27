require 'test_helper'

# AC-22: the Slack notification job is fully isolated — a missing webhook or a
# failing post is logged and never raises into the upload path.
class SlackNotificationJobTest < ActiveSupport::TestCase
  test "no configured webhook → logged no-op, never raises" do
    SlackNotificationJob.stubs(:webhook_url).returns(nil)
    SlackNotifier.expects(:post).never
    assert_nothing_raised { SlackNotificationJob.perform_now("📎 test") }
  end

  test "with a webhook it delegates the message to SlackNotifier.post" do
    SlackNotificationJob.stubs(:webhook_url).returns("https://hooks.example/test")
    SlackNotifier.expects(:post).with(
      text: "📎 Léa a déposé 1 document(s)",
      url: "https://hooks.example/test"
    )
    SlackNotificationJob.perform_now("📎 Léa a déposé 1 document(s)")
  end

  test "webhook_url reads from credentials and is nil when absent" do
    # No :slack section configured in the test credentials → safe nil via dig.
    assert_nil SlackNotificationJob.webhook_url
  end
end
