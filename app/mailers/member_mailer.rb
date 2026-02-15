# frozen_string_literal: true

class MemberMailer < ApplicationMailer
  def password_reset(member)
    @member = member
    @token = Rails.application.message_verifier(:password_reset).generate(
      { member_id: member.id },
      purpose: :password_reset,
      expires_in: 2.hours
    )
    @reset_url = reset_password_url(token: @token)

    mail(
      to: @member.email,
      subject: "Reinitialisation de votre mot de passe — Terranova"
    )
  end
end
