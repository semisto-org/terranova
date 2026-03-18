# frozen_string_literal: true

module Api
  module V1
    class LabsController < BaseController
      before_action :require_effective_member
      before_action :set_lab, only: [:show, :update, :destroy, :add_member, :remove_member]

      def index
        labs = Lab.all.order(:name)
        render json: { labs: labs.map { |l| serialize_lab_brief(l) } }
      end

      def show
        render json: { lab: serialize_lab_full(@lab) }
      end

      def create
        lab = Lab.new(lab_params)
        if lab.save
          render json: { lab: serialize_lab_brief(lab) }, status: :created
        else
          render json: { errors: lab.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @lab.update(lab_params)
          render json: { lab: serialize_lab_brief(@lab) }
        else
          render json: { errors: @lab.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @lab.destroy!
        head :no_content
      end

      def add_member
        membership = @lab.lab_memberships.build(member_id: params[:member_id])
        if membership.save
          render json: { memberIds: @lab.lab_memberships.pluck(:member_id).map(&:to_s) }, status: :created
        else
          render json: { errors: membership.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def remove_member
        membership = @lab.lab_memberships.find_by!(member_id: params[:member_id])
        membership.destroy!
        head :no_content
      end

      private

      def set_lab
        @lab = Lab.find(params[:lab_id] || params[:id])
      end

      def lab_params
        params.permit(:name, :slug)
      end

      def serialize_lab_brief(lab)
        {
          id: lab.id.to_s,
          name: lab.name,
          slug: lab.slug,
          memberCount: lab.lab_memberships.count,
          guildCount: lab.guilds.count,
          createdAt: lab.created_at&.iso8601
        }
      end

      def serialize_lab_full(lab)
        serialize_lab_brief(lab).merge(
          memberIds: lab.lab_memberships.pluck(:member_id).map(&:to_s),
          guilds: lab.guilds.map do |g|
            {
              id: g.id.to_s,
              name: g.name,
              color: g.color,
              icon: g.icon,
              memberCount: g.guild_memberships.count
            }
          end
        )
      end
    end
  end
end
