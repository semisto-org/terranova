module Api
  module V1
    # Serves the auto-generated OpenAPI spec, split per domain for progressive
    # disclosure. The spec is the public API contract, so these endpoints skip
    # authentication to allow discovery without a key.
    #
    # Files live under doc/openapi/ and are regenerated from the Minitest
    # integration suite (OPENAPI=1 bin/rails test) + `bin/rails openapi:split`.
    class OpenapiController < BaseController
      skip_before_action :require_authentication, raise: false

      SPEC_DIR = Rails.root.join("doc/openapi")

      def index
        serve_spec("index")
      end

      def show
        domain = params[:domain].to_s
        return render(json: { error: "Invalid domain" }, status: :bad_request) unless domain.match?(/\A[a-z0-9_]+\z/)

        serve_spec(domain)
      end

      private

      def serve_spec(name)
        path = SPEC_DIR.join("#{name}.json")
        return render(json: { error: "Spec not found" }, status: :not_found) unless File.exist?(path)

        render json: File.read(path)
      end
    end
  end
end
