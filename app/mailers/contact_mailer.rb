# frozen_string_literal: true

class ContactMailer < ApplicationMailer
  def magic_link(contact)
    @contact = contact
    @token = Rails.application.message_verifier(:contact_login).generate(
      { contact_id: contact.id },
      purpose: :contact_login,
      expires_in: 24.hours
    )
    my_host = ENV["MY_SEMISTO_HOST"]
    if my_host.present?
      protocol = Rails.env.production? ? "https" : "http"
      @verify_url = "#{protocol}://#{my_host}/api/v1/auth/verify?token=#{CGI.escape(@token)}"
    else
      @verify_url = "#{root_url.chomp('/')}/api/v1/my/auth/verify?token=#{CGI.escape(@token)}"
    end

    mail(
      to: @contact.email,
      subject: "Votre lien de connexion — Mon Espace Semisto"
    )
  end
end
