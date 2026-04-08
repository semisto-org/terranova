# frozen_string_literal: true

module Api
  module V1
    class ProjectMembershipsController < BaseController
      before_action :set_projectable, only: [:index, :create]
      before_action :set_membership, only: [:update, :destroy]

      # GET /api/v1/projects/:type/:id/members
      def index
        memberships = @projectable.project_memberships.includes(:member).order(:role, :created_at)
        render json: { items: memberships.map { |pm| serialize_membership(pm) } }
      end

      # POST /api/v1/projects/:type/:id/members
      def create
        membership = @projectable.project_memberships.build(membership_params)
        membership.joined_at ||= Time.current

        if membership.save
          render json: serialize_membership(membership), status: :created
        else
          render json: { error: membership.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/project-memberships/:id
      def update
        if @membership.update(membership_params)
          render json: serialize_membership(@membership)
        else
          render json: { error: @membership.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/project-memberships/:id
      def destroy
        @membership.destroy!
        head :no_content
      end

      private

      def set_projectable
        type_key = params[:type]
        klass_name = Projectable::PROJECT_TYPE_KEYS.key(type_key)
        raise ActiveRecord::RecordNotFound, "Unknown project type: #{type_key}" unless klass_name

        @projectable = klass_name.constantize.find(params[:id])
      end

      def set_membership
        @membership = ProjectMembership.find(params[:id])
      end

      def membership_params
        params.permit(:member_id, :role, :is_paid)
      end

      def serialize_membership(pm)
        member = pm.member
        {
          id: pm.id.to_s,
          memberId: member.id.to_s,
          memberName: "#{member.first_name} #{member.last_name}".strip,
          memberEmail: member.email,
          memberAvatar: member.avatar_url,
          role: pm.role,
          isPaid: pm.is_paid,
          joinedAt: pm.joined_at&.iso8601
        }
      end
    end
  end
end
