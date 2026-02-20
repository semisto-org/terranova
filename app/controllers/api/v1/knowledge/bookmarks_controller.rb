# frozen_string_literal: true

module Api
  module V1
    module Knowledge
      class BookmarksController < BaseController
        def index
          bookmarks = KnowledgeBookmark.where(user: current_member).includes(topic: [:section, :creator])
          topics = bookmarks.map(&:topic)
          render json: { topics: topics.map { |t| t.as_json_brief(current_member: current_member) } }
        end
      end
    end
  end
end
