class SessionsController < ApplicationController
  def new
    redirect_to root_path and return if current_member

    render inertia: "Auth/Login"
  end

  def create
    member = Member.find_by(email: params[:email]&.strip&.downcase)

    if member&.authenticate(params[:password])
      if member.inactive?
        redirect_to login_path, alert: "Ce compte est desactive."
        return
      end

      session[:member_id] = member.id
      redirect_to root_path
    else
      redirect_to login_path, alert: "Email ou mot de passe incorrect."
    end
  end

  def destroy
    reset_session
    redirect_to login_path
  end
end
