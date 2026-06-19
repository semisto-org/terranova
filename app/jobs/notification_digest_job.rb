# frozen_string_literal: true

# Digest email calme (#106) — tourne chaque matin (~8h Europe/Brussels) via
# solid_queue (config/recurring.yml). Remplace l'email-par-événement par UN
# seul récapitulatif quotidien des notifications internes non-lues.
#
# Garanties :
#   • Heures calmes — aucun email poussé hors de la plage choisie par le membre
#     (la boîte interne, elle, continue de se remplir).
#   • Pas de doublon — un seul digest par membre et par jour (idempotent au
#     rejeu via `digest_last_sent_on`).
#   • Opt-out — un membre peut couper le digest (`email_digest_opt_in = false`).
class NotificationDigestJob < ApplicationJob
  queue_as :default

  def perform(now: Time.current)
    today = now.in_time_zone(Member::QUIET_HOURS_TIME_ZONE).to_date

    Member.where(status: "active", email_digest_opt_in: true)
          .where.not(email: [nil, ""])
          .find_each do |member|
      deliver_for(member, now, today)
    end
  end

  private

  def deliver_for(member, now, today)
    return if member.digest_last_sent_on == today          # déjà envoyé aujourd'hui
    return unless member.email_push_allowed_at?(now)        # heures calmes

    notifications = member.received_notifications.unread.recent_first.includes(:actor, :notifiable).to_a
    return if notifications.empty?                          # rien à dire → pas d'email

    NotificationDigestMailer.daily_digest(member, notifications).deliver_now
    member.update_column(:digest_last_sent_on, today)
  end
end
