# frozen_string_literal: true

module Api
  module V1
    class KnowledgeController < BaseController
      def index
        articles = KnowledgeArticle.all
        articles = articles.by_category(params[:category])
        articles = articles.by_pole(params[:pole])
        articles = articles.by_lab(params[:lab_id])
        articles = articles.by_tag(params[:tag])
        articles = articles.search(params[:search])
        articles = articles.where(status: params[:status]) if params[:status].present?

        articles = articles.order(pinned: :desc, created_at: :desc)

        render json: { articles: articles.map(&:as_json_brief) }
      end

      def show
        article = KnowledgeArticle.find(params[:id])
        render json: { article: article.as_json_full }
      end

      def create
        article = KnowledgeArticle.new(article_params)
        if article.save
          render json: { article: article.as_json_full }, status: :created
        else
          render json: { errors: article.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        article = KnowledgeArticle.find(params[:id])
        if article.update(article_params)
          render json: { article: article.as_json_full }
        else
          render json: { errors: article.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        article = KnowledgeArticle.find(params[:id])
        article.destroy!
        head :no_content
      end

      def pin
        article = KnowledgeArticle.find(params[:id])
        article.update!(pinned: true)
        render json: { article: article.as_json_brief }
      end

      def unpin
        article = KnowledgeArticle.find(params[:id])
        article.update!(pinned: false)
        render json: { article: article.as_json_brief }
      end

      private

      def article_params
        params.permit(:title, :content, :summary, :category, :source_url, :lab_id, :pole, :pinned, :status, :author_name, tags: [])
      end
    end
  end
end
