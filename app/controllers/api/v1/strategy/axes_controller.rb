# frozen_string_literal: true

module Api
  module V1
    module Strategy
      class AxesController < BaseController
        def index
          axes = ::Strategy::Axis.all
          axes = axes.by_status(params[:status])
          axes = axes.ordered

          render json: { axes: axes.includes(:key_results).map(&:as_json_full) }
        end

        def show
          axis = ::Strategy::Axis.find(params[:id])
          render json: { axis: axis.as_json_full }
        end

        def create
          axis = ::Strategy::Axis.new(axis_params)
          axis.created_by_id = current_member&.id

          if axis.save
            render json: { axis: axis.as_json_full }, status: :created
          else
            render json: { errors: axis.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          axis = ::Strategy::Axis.find(params[:id])

          if axis.update(axis_params)
            render json: { axis: axis.as_json_full }
          else
            render json: { errors: axis.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          axis = ::Strategy::Axis.find(params[:id])
          axis.destroy!
          head :no_content
        end

        # Key Results
        def create_key_result
          axis = ::Strategy::Axis.find(params[:id])
          key_result = axis.key_results.build(key_result_params)

          if key_result.save
            render json: { keyResult: key_result.as_json_brief }, status: :created
          else
            render json: { errors: key_result.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update_key_result
          key_result = ::Strategy::KeyResult.find(params[:id])

          if key_result.update(key_result_params)
            render json: { keyResult: key_result.as_json_brief }
          else
            render json: { errors: key_result.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy_key_result
          key_result = ::Strategy::KeyResult.find(params[:id])
          key_result.destroy!
          head :no_content
        end

        private

        def axis_params
          params.permit(:title, :description, :status, :target_year, :progress, :color, :position)
        end

        def key_result_params
          params.permit(:title, :metric_type, :target_value, :current_value, :status, :position)
        end
      end
    end
  end
end
