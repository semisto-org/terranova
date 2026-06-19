# frozen_string_literal: true

# Digest email calme (#106) — un seul récapitulatif par membre et par jour des
# notifications internes non-lues (boîte Hey! #105), au lieu d'un email par
# événement. Envoyé via SES (`:ses_v2` en prod) par NotificationDigestJob, qui
# garantit l'unicité quotidienne et le respect des heures calmes.
class NotificationDigestMailer < ApplicationMailer
  def daily_digest(member, notifications)
    @member = member
    @notifications = notifications
    @count = notifications.size
    # Lien « voir dans Terranova » : la boîte Hey! est une cloche présente dans
    # le shell sur toutes les pages, donc on pointe vers la racine de l'app.
    @app_url = root_url

    mail(
      to: @member.email,
      subject: "Votre récap Terranova — #{@count} #{@count > 1 ? 'nouveautés' : 'nouveauté'}"
    )
  end
end
