# frozen_string_literal: true

class PasswordResetsController < ApplicationController
  # GET /forgot-password
  # Renders the "enter your email" form
  def new
    redirect_to root_path and return if current_member

    render inertia: "Auth/ForgotPassword"
  end

  # POST /forgot-password
  # Sends the reset email (always shows success to avoid email enumeration)
  def create
    member = Member.find_by(email: params[:email]&.strip&.downcase)

    if member&.active?
      MemberMailer.password_reset(member).deliver_later
    end

    redirect_to forgot_password_path, notice: "Si cette adresse existe dans notre systeme, un email de reinitialisation a ete envoye."
  end

  # GET /reset-password?token=xxx
  # Renders the "choose a new password" form
  def edit
    redirect_to root_path and return if current_member

    token = params[:token]
    member_data = verify_token(token)

    if member_data.nil?
      redirect_to forgot_password_path, alert: "Ce lien est invalide ou a expire. Veuillez refaire une demande."
      return
    end

    render inertia: "Auth/ResetPassword", props: { token: token }
  end

  # PATCH /reset-password
  # Updates the password
  def update
    member_data = verify_token(params[:token])

    if member_data.nil?
      redirect_to forgot_password_path, alert: "Ce lien est invalide ou a expire. Veuillez refaire une demande."
      return
    end

    member = Member.find_by(id: member_data[:member_id])

    if member.nil?
      redirect_to forgot_password_path, alert: "Compte introuvable."
      return
    end

    if params[:password].blank? || params[:password].length < 8
      redirect_to reset_password_path(token: params[:token]), alert: "Le mot de passe doit contenir au moins 8 caracteres."
      return
    end

    if params[:password] != params[:password_confirmation]
      redirect_to reset_password_path(token: params[:token]), alert: "Les mots de passe ne correspondent pas."
      return
    end

    member.update!(password: params[:password])
    session[:member_id] = member.id

    redirect_to root_path, notice: "Votre mot de passe a ete reinitialise avec succes."
  end

  private

  def verify_token(token)
    return nil if token.blank?

    Rails.application.message_verifier(:password_reset).verify(token, purpose: :password_reset)
  rescue ActiveSupport::MessageVerifier::InvalidSignature
    nil
  end
end
