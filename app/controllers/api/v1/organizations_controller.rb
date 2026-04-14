module Api
  module V1
    class OrganizationsController < BaseController
      before_action :require_admin!, except: [:index]
      before_action :load_organization, only: [:show, :update, :destroy]

      def index
        render json: { items: Organization.active.order(:name).map { |o| serialize(o) } }
      end

      def show
        render json: serialize(@organization)
      end

      def create
        org = Organization.create!(organization_params)
        org.logo.attach(params[:logo]) if params[:logo].present?
        render json: serialize(org), status: :created
      end

      def update
        @organization.update!(organization_params)
        @organization.logo.attach(params[:logo]) if params[:logo].present?
        @organization.logo.purge if params[:remove_logo].to_s == "true"
        render json: serialize(@organization.reload)
      end

      def destroy
        if @organization.expense_notes.exists?
          @organization.update!(archived_at: Time.current)
        else
          @organization.destroy!
        end
        head :no_content
      end

      private

      def load_organization
        @organization = Organization.find(params[:id])
      end

      def require_admin!
        unless current_member&.is_admin?
          render json: { error: "Accès réservé aux administrateurs" }, status: :forbidden
        end
      end

      def organization_params
        params.require(:organization).permit(
          :name, :legal_form, :registration_number, :address, :iban, :email, :phone, :is_default
        )
      end

      def serialize(org)
        {
          id: org.id.to_s,
          name: org.name,
          legalForm: org.legal_form,
          registrationNumber: org.registration_number,
          address: org.address,
          iban: org.iban,
          email: org.email,
          phone: org.phone,
          isDefault: org.is_default,
          logoUrl: org.logo.attached? ? Rails.application.routes.url_helpers.rails_blob_url(org.logo, only_path: true) : nil,
          archivedAt: org.archived_at&.iso8601,
          createdAt: org.created_at.iso8601
        }
      end
    end
  end
end
