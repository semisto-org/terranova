# frozen_string_literal: true

module Api
  module V1
    module Knowledge
      class SectionsController < BaseController
        def index
          sections = if params[:projectable_type].present? && params[:projectable_id].present?
                       KnowledgeSection.where(projectable_type: params[:projectable_type], projectable_id: params[:projectable_id]).ordered
                     elsif params[:guild_id].present?
                       KnowledgeSection.where(projectable_type: "Guild", projectable_id: params[:guild_id]).ordered
                     else
                       KnowledgeSection.where(projectable_type: nil).ordered
                     end
          render json: { sections: sections.map(&:as_json_brief) }
        end

        def show
          section = KnowledgeSection.find(params[:id])
          render json: { section: section.as_json_brief }
        end

        def create
          section = KnowledgeSection.new(section_params)
          section.created_by_id = current_member&.id
          if section.save
            render json: { section: section.as_json_brief }, status: :created
          else
            render json: { errors: section.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          section = KnowledgeSection.find(params[:id])
          if section.update(section_params)
            render json: { section: section.as_json_brief }
          else
            render json: { errors: section.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          section = KnowledgeSection.find(params[:id])
          section.destroy!
          head :no_content
        end

        private

        def section_params
          params.permit(:name, :description, :position, :projectable_type, :projectable_id)
        end
      end
    end
  end
end
