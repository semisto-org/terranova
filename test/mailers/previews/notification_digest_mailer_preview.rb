# Aperçu du digest calme (#106) : http://localhost:PORT/rails/mailers/notification_digest_mailer/daily_digest
# Objets construits en mémoire (aucune écriture en base) pour rendre l'email.
class NotificationDigestMailerPreview < ActionMailer::Preview
  def daily_digest
    member = Member.new(first_name: "Ada", email: "ada@semisto.org")
    task = Task.new(name: "Préparer la réunion d'équipe")
    other = Member.new(first_name: "Boris", last_name: "H")

    notifications = [
      Notification.new(kind: "assignment", notifiable: task, created_at: Time.current),
      Notification.new(kind: "comment", notifiable: task, actor: other, created_at: 3.hours.ago),
      Notification.new(kind: "mention", notifiable: task, actor: other, created_at: 6.hours.ago)
    ]

    NotificationDigestMailer.daily_digest(member, notifications)
  end
end
