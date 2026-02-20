# frozen_string_literal: true

module Api
  module V1
    module Knowledge
      class TopicsController < BaseController
        skip_before_action :require_authentication, if: :valid_api_key?

        def index
          topics = if valid_api_key?
                     KnowledgeTopic.all
                   else
                     KnowledgeTopic.visible_to(current_member)
                   end

          topics = topics.by_section(params[:section_id])
          topics = topics.by_tag(params[:tag])
          topics = topics.search(params[:search])
          topics = topics.where(status: params[:status]) if params[:status].present?
          topics = topics.order(pinned: :desc, created_at: :desc)

          render json: { topics: topics.map { |t| t.as_json_brief(current_member: current_member) } }
        end

        def show
          topic = KnowledgeTopic.find(params[:id])
          render json: { topic: topic.as_json_full(current_member: current_member) }
        end

        def create
          topic = KnowledgeTopic.new(topic_params)
          topic.created_by_id = current_member&.id unless valid_api_key?

          if topic.save
            render json: { topic: topic.as_json_full(current_member: current_member) }, status: :created
          else
            render json: { errors: topic.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          topic = KnowledgeTopic.find(params[:id])

          # Create revision before update
          create_revision(topic)

          if topic.update(topic_params)
            # Track editor
            if current_member
              KnowledgeTopicEditor.find_or_initialize_by(topic: topic, user: current_member).tap do |te|
                te.edited_at = Time.current
                te.save!
              end
            end
            render json: { topic: topic.as_json_full(current_member: current_member) }
          else
            render json: { errors: topic.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          topic = KnowledgeTopic.find(params[:id])
          topic.destroy!
          head :no_content
        end

        def pin
          topic = KnowledgeTopic.find(params[:id])
          topic.update!(pinned: true)
          render json: { topic: topic.as_json_brief(current_member: current_member) }
        end

        def unpin
          topic = KnowledgeTopic.find(params[:id])
          topic.update!(pinned: false)
          render json: { topic: topic.as_json_brief(current_member: current_member) }
        end

        def related
          topic = KnowledgeTopic.find(params[:id])
          related = topic.related_topics(5)
          render json: { topics: related.map { |t| t.as_json_brief(current_member: current_member) } }
        end

        # POST /api/v1/knowledge/topics/:id/attachments
        def add_attachment
          topic = KnowledgeTopic.find(params[:id])
          topic.attachments.attach(params[:file])
          render json: { topic: topic.reload.as_json_full(current_member: current_member) }
        end

        # DELETE /api/v1/knowledge/topics/:id/attachments/:attachment_id
        def remove_attachment
          topic = KnowledgeTopic.find(params[:id])
          attachment = topic.attachments.find(params[:attachment_id])
          attachment.purge
          render json: { topic: topic.reload.as_json_full(current_member: current_member) }
        end

        # POST /api/v1/knowledge/topics/:id/bookmark
        def bookmark
          topic = KnowledgeTopic.find(params[:id])
          KnowledgeBookmark.find_or_create_by!(user: current_member, topic: topic)
          render json: { bookmarked: true }
        end

        # DELETE /api/v1/knowledge/topics/:id/bookmark
        def unbookmark
          topic = KnowledgeTopic.find(params[:id])
          KnowledgeBookmark.find_by(user: current_member, topic: topic)&.destroy!
          render json: { bookmarked: false }
        end

        # GET /api/v1/knowledge/topics/:id/revisions
        def revisions
          topic = KnowledgeTopic.find(params[:id])
          render json: { revisions: topic.revisions.order(created_at: :desc).map(&:as_json_brief) }
        end

        # GET /api/v1/knowledge/topics/:id/comments
        def comments
          topic = KnowledgeTopic.find(params[:id])
          render json: { comments: topic.comments.ordered.map(&:as_json_brief) }
        end

        # POST /api/v1/knowledge/topics/:id/comments
        def create_comment
          topic = KnowledgeTopic.find(params[:id])
          comment = topic.comments.build(comment_params)
          comment.user = current_member if current_member
          comment.author_name ||= current_member ? "#{current_member.first_name} #{current_member.last_name}" : "Anonyme"

          if comment.save
            render json: { comment: comment.as_json_brief }, status: :created
          else
            render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/knowledge/topics/:topic_id/comments/:id
        def update_comment
          comment = KnowledgeComment.find(params[:id])
          if comment.update(comment_params)
            render json: { comment: comment.as_json_brief }
          else
            render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/knowledge/topics/:topic_id/comments/:id
        def destroy_comment
          comment = KnowledgeComment.find(params[:id])
          comment.destroy!
          head :no_content
        end

        private

        def topic_params
          params.permit(:title, :content, :section_id, :pinned, :status, :author_name, tags: [])
        end

        def comment_params
          params.permit(:content, :author_name)
        end

        def create_revision(topic)
          changed = topic_params.to_h.select { |k, v| topic.send(k).to_s != v.to_s rescue false }
          return if changed.empty?

          topic.revisions.create!(
            user: current_member,
            user_name: current_member ? "#{current_member.first_name} #{current_member.last_name}" : "API",
            changes_data: changed
          )
        end

        def valid_api_key?
          key = request.headers["X-API-Key"]
          key.present? && ENV["KNOWLEDGE_API_KEY"].present? &&
            ActiveSupport::SecurityUtils.secure_compare(key, ENV["KNOWLEDGE_API_KEY"])
        end
      end
    end
  end
end
