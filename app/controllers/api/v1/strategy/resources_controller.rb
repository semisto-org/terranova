# frozen_string_literal: true

module Api
  module V1
    module Strategy
      class ResourcesController < BaseController
        def index
          resources = ::Strategy::Resource.all
          resources = resources.by_type(params[:resource_type])
          resources = resources.by_tag(params[:tag])
          resources = resources.search(params[:search])
          resources = resources.order(pinned: :desc, created_at: :desc)

          render json: { resources: resources.map(&:as_json_brief) }
        end

        def show
          resource = ::Strategy::Resource.find(params[:id])
          render json: { resource: resource.as_json_full }
        end

        def create
          resource = ::Strategy::Resource.new(resource_params)
          resource.created_by_id = current_member&.id

          if resource.save
            render json: { resource: resource.as_json_full }, status: :created
          else
            render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          resource = ::Strategy::Resource.find(params[:id])

          if resource.update(resource_params)
            render json: { resource: resource.as_json_full }
          else
            render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          resource = ::Strategy::Resource.find(params[:id])
          resource.destroy!
          head :no_content
        end

        def pin
          resource = ::Strategy::Resource.find(params[:id])
          resource.update!(pinned: !resource.pinned)
          render json: { resource: resource.as_json_brief }
        end

        private

        def resource_params
          params.permit(:title, :summary, :content, :source_url, :resource_type, :pinned, tags: [])
        end
      end
    end
  end
end
