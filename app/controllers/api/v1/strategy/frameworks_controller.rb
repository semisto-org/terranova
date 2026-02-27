# frozen_string_literal: true

module Api
  module V1
    module Strategy
      class FrameworksController < BaseController
        def index
          frameworks = ::Strategy::Framework.all
          frameworks = frameworks.by_type(params[:framework_type])
          frameworks = frameworks.by_status(params[:status])
          frameworks = frameworks.search(params[:search])
          frameworks = frameworks.order(created_at: :desc)

          render json: { frameworks: frameworks.map(&:as_json_brief) }
        end

        def show
          framework = ::Strategy::Framework.find(params[:id])
          render json: { framework: framework.as_json_full }
        end

        def create
          framework = ::Strategy::Framework.new(framework_params)
          framework.created_by_id = current_member&.id

          if framework.save
            render json: { framework: framework.as_json_full }, status: :created
          else
            render json: { errors: framework.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          framework = ::Strategy::Framework.find(params[:id])

          if framework.update(framework_params)
            render json: { framework: framework.as_json_full }
          else
            render json: { errors: framework.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          framework = ::Strategy::Framework.find(params[:id])
          framework.destroy!
          head :no_content
        end

        private

        def framework_params
          params.permit(:title, :content, :framework_type, :status, :version, :deliberation_id)
        end
      end
    end
  end
end
