module Api
  module V1
    class BaseController < ApplicationController
      skip_forgery_protection
      before_action :require_authentication, unless: -> { Rails.env.test? }

      private

      def current_member
        @current_member ||= authenticate_via_api_key || super
      end

      def authenticate_via_api_key
        api_key = ENV["KNOWLEDGE_API_KEY"]
        return nil if api_key.blank?

        auth_header = request.headers["Authorization"]
        return nil unless auth_header&.start_with?("Bearer ")

        token = auth_header.delete_prefix("Bearer ")
        return nil unless ActiveSupport::SecurityUtils.secure_compare(token, api_key)

        # Return first admin member, or create a system API member
        Member.find_by(is_admin: true) || Member.find_or_create_by!(email: "api@system.local") do |m|
          m.first_name = "API"
          m.last_name = "System"
          m.is_admin = true
        end
      end
    end
  end
end
