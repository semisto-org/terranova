# frozen_string_literal: true

module Api
  module V1
    module Public
      # Réception des webhooks Tally (soumissions de formulaires).
      #
      # Seules les soumissions FORM_RESPONSE du formulaire d'intake
      # (ENV["TALLY_INTAKE_FORM_ID"], défaut "w77j70") sont traitées : elles
      # créent un Design::Project en phase « réception » via
      # Tally::ProjectIntakeImporter. Tout autre formId est ignoré (200).
      #
      # La configuration du webhook côté Tally (URL + signing secret) est une
      # étape manuelle dans l'admin Tally — ce contrôleur ne fait que recevoir.
      class TallyWebhooksController < ApplicationController
        skip_before_action :verify_authenticity_token

        def create
          payload = request.body.read

          unless valid_signature?(payload)
            head :unauthorized
            return
          end

          event = JSON.parse(payload)
          data = event["data"] || {}

          return head :ok unless event["eventType"] == "FORM_RESPONSE"
          return head :ok unless data["formId"].to_s == intake_form_id

          Tally::ProjectIntakeImporter.call(data)
          head :ok
        rescue JSON::ParserError
          head :bad_request
        end

        private

        # Tally signe le corps brut : base64(HMAC-SHA256(rawBody, signingSecret))
        # dans l'en-tête `tally-signature`. Sans secret configuré, on accepte
        # (dev/test), comme pour le webhook Stripe.
        def valid_signature?(payload)
          secret = ENV.fetch("TALLY_SIGNING_SECRET", "")
          return true if secret.blank?

          provided = request.headers["tally-signature"].to_s
          return false if provided.blank?

          expected = Base64.strict_encode64(OpenSSL::HMAC.digest("SHA256", secret, payload))
          ActiveSupport::SecurityUtils.secure_compare(provided, expected)
        end

        def intake_form_id
          ENV.fetch("TALLY_INTAKE_FORM_ID", "w77j70")
        end
      end
    end
  end
end
