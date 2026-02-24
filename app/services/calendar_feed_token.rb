class CalendarFeedToken
  PURPOSE = "calendar_feed".freeze

  def self.issue(feed:, expires_in: 90.days)
    verifier.generate({ feed: feed }, purpose: PURPOSE, expires_in: expires_in)
  end

  def self.valid_for_feed?(token, feed:)
    payload = verifier.verified(token, purpose: PURPOSE)
    payload.is_a?(Hash) && payload["feed"] == feed
  rescue ActiveSupport::MessageVerifier::InvalidSignature
    false
  end

  def self.verifier
    @verifier ||= ActiveSupport::MessageVerifier.new(Rails.application.secret_key_base, digest: "SHA256", serializer: JSON)
  end
end
