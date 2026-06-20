module Api
  module V1
    class ProfileController < BaseController
      def show
        render json: serialize_member(current_member)
      end

      def update
        ActiveRecord::Base.transaction do
          current_member.update!(profile_params.except(:password, :password_confirmation, :avatar_image))

          if params[:avatar_image].present?
            current_member.avatar_image.attach(params[:avatar_image])
          end

          if profile_params[:password].present?
            unless current_member.update(password: profile_params[:password], password_confirmation: profile_params[:password_confirmation])
              raise ActiveRecord::RecordInvalid.new(current_member)
            end
          end
        end

        render json: serialize_member(current_member.reload)
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
      end

      def remove_avatar
        current_member.avatar_image.purge if current_member.avatar_image.attached?
        current_member.update!(avatar: "")
        render json: serialize_member(current_member.reload)
      end

      # Flux iCal personnel (#143) : renvoie l'URL signée du membre courant.
      def calendar_feed
        render json: calendar_feed_payload(current_member)
      end

      # Régénère le nonce du membre → invalide l'ancien token, renvoie la nouvelle URL.
      def regenerate_calendar_feed
        current_member.regenerate_calendar_token!
        render json: calendar_feed_payload(current_member)
      end

      private

      def calendar_feed_payload(member)
        token = CalendarFeedToken.issue_member(member)
        {
          url: "#{request.base_url}/calendar/my/#{token}.ics",
          instructions: [
            "Dans Google Agenda, cliquez sur + à côté de ‘Autres agendas’.",
            "Choisissez ‘À partir de l’URL’, collez le lien puis validez.",
            "Le lien est personnel : ne le partagez pas. En cas de fuite, régénérez-le."
          ]
        }
      end

      def profile_params
        params.permit(:first_name, :last_name, :email, :password, :password_confirmation, :avatar_image)
      end

      def serialize_member(member)
        {
          id: member.id.to_s,
          firstName: member.first_name,
          lastName: member.last_name,
          email: member.email,
          avatar: member.avatar_url,
          roles: member.member_roles.map(&:role),
          status: member.status,
          isAdmin: member.is_admin,
          joinedAt: member.joined_at&.iso8601,
          walletId: member.wallet&.id&.to_s,
          guildIds: member.guild_ids_list.map(&:to_s)
        }
      end
    end
  end
end
