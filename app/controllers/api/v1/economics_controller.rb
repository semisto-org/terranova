module Api
  module V1
    class EconomicsController < BaseController
      before_action :require_effective_member

      def inputs
        render json: { inputs: filter_scope(EconomicInput.all).order(date: :desc, id: :desc).map { |item| serialize_input(item) } }
      end

      def create_input
        input = EconomicInput.create!(economic_input_params)
        render json: serialize_input(input), status: :created
      end

      def update_input
        input = EconomicInput.find(params[:id])
        input.update!(economic_input_params)
        render json: serialize_input(input)
      end

      def destroy_input
        EconomicInput.find(params[:id]).destroy!
        head :no_content
      end

      def outputs
        render json: { outputs: filter_scope(EconomicOutput.all).order(date: :desc, id: :desc).map { |item| serialize_output(item) } }
      end

      def create_output
        output = EconomicOutput.create!(economic_output_params)
        render json: serialize_output(output), status: :created
      end

      def update_output
        output = EconomicOutput.find(params[:id])
        output.update!(economic_output_params)
        render json: serialize_output(output)
      end

      def destroy_output
        EconomicOutput.find(params[:id]).destroy!
        head :no_content
      end

      def dashboard
        service = EconomicsDashboardService.new(filter_params)
        render json: service.call
      end

      private

      def economic_input_params
        params.require(:economic_input).permit(:date, :category, :amount_cents, :quantity, :unit, :notes, :location_id, :zone_id, :design_project_id)
      end

      def economic_output_params
        params.require(:economic_output).permit(:date, :category, :amount_cents, :quantity, :unit, :species_name, :notes, :location_id, :zone_id, :design_project_id)
      end

      def filter_params
        params.permit(:from, :to, :location_id, :zone_id, :design_project_id).to_h.symbolize_keys
      end

      def filter_scope(scope)
        filters = filter_params
        scope = scope.where("date >= ?", filters[:from]) if filters[:from].present?
        scope = scope.where("date <= ?", filters[:to]) if filters[:to].present?
        scope = scope.where(location_id: filters[:location_id]) if filters[:location_id].present?
        scope = scope.where(zone_id: filters[:zone_id]) if filters[:zone_id].present?
        scope = scope.where(design_project_id: filters[:design_project_id]) if filters[:design_project_id].present?
        scope
      end

      def serialize_input(item)
        {
          id: item.id,
          date: item.date,
          category: item.category,
          amount_cents: item.amount_cents,
          quantity: item.quantity.to_f,
          unit: item.unit,
          notes: item.notes,
          location_id: item.location_id,
          zone_id: item.zone_id,
          design_project_id: item.design_project_id
        }
      end

      def serialize_output(item)
        {
          id: item.id,
          date: item.date,
          category: item.category,
          amount_cents: item.amount_cents,
          quantity: item.quantity.to_f,
          unit: item.unit,
          species_name: item.species_name,
          notes: item.notes,
          location_id: item.location_id,
          zone_id: item.zone_id,
          design_project_id: item.design_project_id
        }
      end
    end
  end
end
