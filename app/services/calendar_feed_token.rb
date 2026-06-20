class CalendarFeedToken
  PURPOSE = "calendar_feed".freeze
  MEMBER_PURPOSE = "calendar_feed_member".freeze

  def self.issue(feed:, expires_in: 90.days)
    verifier.generate({ feed: feed }, purpose: PURPOSE, expires_in: expires_in)
  end

  def self.valid_for_feed?(token, feed:)
    payload = verifier.verified(token, purpose: PURPOSE)
    payload.is_a?(Hash) && payload["feed"] == feed
  rescue ActiveSupport::MessageVerifier::InvalidSignature
    false
  end

  # Flux iCal personnel : on signe { member_id, nonce } où nonce est lu dans
  # members.calendar_token. Régénérer ce nonce (via Member#regenerate_calendar_token!)
  # invalide tous les anciens tokens, qui portent l'ancien nonce.
  def self.issue_member(member)
    member.ensure_calendar_token!
    verifier.generate({ member_id: member.id, nonce: member.calendar_token }, purpose: MEMBER_PURPOSE)
  end

  # Retourne le Member si le token est valide ET que son nonce correspond encore
  # au calendar_token courant du membre ; nil sinon (signature invalide, membre
  # introuvable, ou token révoqué par régénération du nonce).
  def self.member_from(token)
    payload = verifier.verified(token.to_s, purpose: MEMBER_PURPOSE)
    return nil unless payload.is_a?(Hash)

    member = Member.find_by(id: payload["member_id"])
    return nil if member.nil?

    nonce = payload["nonce"].to_s
    return nil if nonce.blank? || member.calendar_token.blank?
    return nil unless ActiveSupport::SecurityUtils.secure_compare(nonce, member.calendar_token)

    member
  rescue ActiveSupport::MessageVerifier::InvalidSignature
    nil
  end

  def self.verifier
    @verifier ||= ActiveSupport::MessageVerifier.new(Rails.application.secret_key_base, digest: "SHA256", serializer: JSON)
  end
end
