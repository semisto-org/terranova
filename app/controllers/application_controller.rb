class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  inertia_share do
    {
      auth: {
        member: if current_member
          {
            id: current_member.id.to_s,
            firstName: current_member.first_name,
            lastName: current_member.last_name,
            email: current_member.email,
            avatar: current_member.avatar_url,
            isAdmin: current_member.is_admin,
            slackUserId: current_member.slack_user_id,
            membershipType: current_member.membership_type
          }
        end
      },
      flash: {
        notice: flash[:notice],
        alert: flash[:alert]
      }
    }
  end

  rescue_from ActiveRecord::RecordNotFound do |error|
    render json: { error: error.message }, status: :not_found
  end

  rescue_from ActionController::ParameterMissing do |error|
    render json: { error: error.message }, status: :unprocessable_entity
  end

  private

  def current_member
    @current_member ||= Member.find_by(id: session[:member_id]) if session[:member_id]
  end
  helper_method :current_member

  def require_effective_member
    if current_member&.adherent?
      if request.path.start_with?("/api/")
        render json: { error: "Accès réservé aux membres effectifs" }, status: :forbidden
      else
        redirect_to root_path, alert: "Accès réservé aux membres effectifs"
      end
    end
  end

  def require_authentication
    unless current_member
      if request.path.start_with?("/api/")
        render json: { error: "Non autorise" }, status: :unauthorized
      else
        redirect_to login_path
      end
    end
  end
end
