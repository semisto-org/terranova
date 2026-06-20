# frozen_string_literal: true

module Api
  module V1
    # Message Board par projet (#118, epic #101 — Phase 4).
    # Posts async structurés rattachés à un Projectable (PoleProject,
    # Design::Project, Academy::Training, Guild) — routes imbriquées par projet :
    # /api/v1/projects/:type/:id/posts. Aucune liste fermée côté modèle ; la
    # résolution du parent passe par Projectable::PROJECT_TYPE_KEYS (même
    # mécanique que ProjectsController#set_projectable).
    class PostsController < BaseController
      before_action :set_projectable, only: [:index, :create]
      before_action :set_post, only: [:show, :update, :destroy]

      # GET /api/v1/projects/:type/:id/posts
      def index
        posts = @projectable.posts.recent_first.includes(:author)
        render json: { posts: posts.map { |p| serialize_post(p) } }
      end

      # GET /api/v1/posts/:id
      def show
        render json: { post: serialize_post(@post, full: true) }
      end

      # POST /api/v1/projects/:type/:id/posts
      def create
        post = @projectable.posts.create!(
          author: current_member,
          title: params[:title],
          body: params[:body]
        )
        render json: { post: serialize_post(post, full: true) }, status: :created
      end

      # PATCH /api/v1/posts/:id
      def update
        unless can_edit?(@post)
          return render json: { error: "Seul l'auteur ou un admin peut modifier ce message." }, status: :forbidden
        end

        @post.update!(post_params)
        render json: { post: serialize_post(@post, full: true) }
      end

      # DELETE /api/v1/posts/:id
      def destroy
        unless can_edit?(@post)
          return render json: { error: "Seul l'auteur ou un admin peut supprimer ce message." }, status: :forbidden
        end

        @post.destroy!
        head :no_content
      end

      private

      def set_projectable
        type_key = params[:type]
        klass_name = Projectable::PROJECT_TYPE_KEYS.key(type_key)
        raise ActiveRecord::RecordNotFound, "Unknown project type: #{type_key}" unless klass_name

        @projectable = klass_name.constantize.find(params[:id])
      end

      def set_post
        @post = Post.find(params[:id])
      end

      def post_params
        params.permit(:title, :body)
      end

      def can_edit?(post)
        return false unless current_member

        post.author_id == current_member.id || current_member.is_admin
      end

      def serialize_post(post, full: false)
        author = post.author
        data = {
          id: post.id.to_s,
          title: post.title,
          authorId: post.author_id&.to_s,
          authorName: author ? "#{author.first_name} #{author.last_name}".strip : nil,
          authorAvatar: author&.try(:avatar_url),
          createdAt: post.created_at&.iso8601,
          updatedAt: post.updated_at&.iso8601,
          commentsCount: post.comments.size,
          canEdit: can_edit?(post),
        }
        data[:body] = post.body if full
        data
      end
    end
  end
end
