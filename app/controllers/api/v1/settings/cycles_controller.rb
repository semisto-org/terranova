module Api
  module V1
    module Settings
      class CyclesController < BaseController
        before_action :set_cycle_period, only: [:update, :destroy]

        def index
          render json: { items: CyclePeriod.ordered.map { |cycle| serialize_cycle(cycle) } }
        end

        def create
          cycle = CyclePeriod.new(cycle_params)
          if cycle.save
            render json: serialize_cycle(cycle), status: :created
          else
            render json: { error: cycle.errors.full_messages.to_sentence }, status: :unprocessable_entity
          end
        end

        def update
          if @cycle_period.update(cycle_params)
            render json: serialize_cycle(@cycle_period)
          else
            render json: { error: @cycle_period.errors.full_messages.to_sentence }, status: :unprocessable_entity
          end
        end

        def destroy
          @cycle_period.destroy!
          head :no_content
        end

        private

        def set_cycle_period
          @cycle_period = CyclePeriod.find(params.require(:id))
        end

        def cycle_params
          params.permit(:name, :starts_on, :ends_on, :cooldown_starts_on, :cooldown_ends_on).merge(active: true)
        end

        def serialize_cycle(cycle)
          {
            id: cycle.id.to_s,
            name: cycle.name,
            startsOn: cycle.starts_on.iso8601,
            endsOn: cycle.ends_on.iso8601,
            cooldownStartsOn: cycle.cooldown_starts_on.iso8601,
            cooldownEndsOn: cycle.cooldown_ends_on.iso8601,
            color: cycle.color,
            notes: cycle.notes,
            active: cycle.active
          }
        end
      end
    end
  end
end
