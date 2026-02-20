# frozen_string_literal: true

module Api
  module V1
    module Knowledge
      class SearchController < BaseController
        def index
          query = params[:q]
          return render(json: { topics: [] }) if query.blank?

          topics = KnowledgeTopic.visible_to(current_member).search(query).order(created_at: :desc).limit(20)
          render json: { topics: topics.map { |t| t.as_json_brief(current_member: current_member) } }
        end
      end
    end
  end
end
