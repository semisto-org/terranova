# frozen_string_literal: true

module Api
  module V1
    class GeocodingController < BaseController
      # GET /api/v1/geocoding?address=...
      # Proxies to Google Geocoding API to keep the API key server-side.
      def show
        address = params[:address].to_s.strip
        if address.blank?
          return render json: { error: "Address is required" }, status: :bad_request
        end

        api_key = ENV["GOOGLE_MAPS_API_KEY"]
        if api_key.blank?
          return render json: { error: "Geocoding not configured" }, status: :service_unavailable
        end

        uri = URI("https://maps.googleapis.com/maps/api/geocode/json")
        uri.query = URI.encode_www_form(address: address, key: api_key)

        response = Net::HTTP.get_response(uri)
        body = JSON.parse(response.body)

        if body["status"] == "ZERO_RESULTS"
          return render json: { results: [] }
        end

        if body["status"] != "OK"
          return render json: { error: body["error_message"] || "Geocoding failed" }, status: :unprocessable_entity
        end

        results = (body["results"] || []).map do |r|
          loc = r.dig("geometry", "location") || {}
          { lat: loc["lat"], lng: loc["lng"] }
        end

        render json: { results: results }
      end
    end
  end
end
