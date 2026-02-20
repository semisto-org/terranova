# frozen_string_literal: true

module Api
  module V1
    module Knowledge
      class SectionsController < BaseController
        def index
          sections = KnowledgeSection.ordered
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
          params.permit(:name, :description, :position)
        end
      end
    end
  end
end
