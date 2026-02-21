# frozen_string_literal: true

module Api
  module V1
    class NotionRecordsController < BaseController
      def search
        query = params[:q].to_s.strip
        return render json: { error: "q parameter is required" }, status: :unprocessable_entity if query.blank?

        limit = (params[:limit] || 20).to_i.clamp(1, 100)
        offset = (params[:offset] || 0).to_i

        records = NotionRecord.all
        records = records.where(database_name: params[:database_name]) if params[:database_name].present?

        # PostgreSQL full-text search across title, database_name, properties (cast to text), content_html
        tsquery = query.split(/\s+/).map { |term| "#{term}:*" }.join(" & ")

        records = records.where(
          <<~SQL.squish,
            to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(database_name, '') || ' ' || coalesce(properties::text, '') || ' ' || coalesce(content_html, ''))
            @@ to_tsquery('simple', ?)
          SQL
          tsquery
        )

        total = records.count

        results = records
          .order(created_at: :desc)
          .offset(offset)
          .limit(limit)
          .select(:id, :notion_id, :title, :database_name, :database_id, :properties, :created_at)

        render json: {
          results: results.map { |r|
            {
              id: r.id,
              notion_id: r.notion_id,
              title: r.title,
              database_name: r.database_name,
              database_id: r.database_id,
              created_at: r.created_at,
              properties_excerpt: truncate_properties(r.properties)
            }
          },
          total: total,
          limit: limit,
          offset: offset
        }
      end

      def upsert
        record = NotionRecord.find_or_initialize_by(notion_id: params[:notion_id])
        record.assign_attributes(notion_record_params)
        if record.save
          render json: { status: "ok", id: record.id, created: record.previously_new_record? }
        else
          render json: { error: record.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def notion_record_params
        params.permit(:notion_id, :database_name, :database_id, :title, :content_html).tap do |p|
          p[:properties] = params[:properties].permit! if params[:properties].present?
          p[:content] = params[:content] if params[:content].present?
        end
      end

      def truncate_properties(props)
        return {} if props.blank?

        props.each_with_object({}) do |(key, value), hash|
          hash[key] = value.is_a?(String) && value.length > 200 ? "#{value[0..197]}..." : value
        end
      end
    end
  end
end
