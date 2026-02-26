# frozen_string_literal: true

module Api
  module V1
    class SearchController < BaseController
      def global
        query = params[:q].to_s.strip
        return render json: { query: query, sections: [], total: 0 } if query.blank?

        sections = GlobalSearchService.new(
          query: query,
          types: params[:types],
          limit: (params[:limit] || 24).to_i,
          filters: {
            status: params[:status],
            pole: params[:pole],
            owner: params[:owner],
            from: params[:from],
            to: params[:to]
          }
        ).call

        render json: { query: query, sections: sections, total: sections.sum { |s| s[:items].size } }
      end

      def recent
        render json: { items: [] }
      end
    end
  end
end
