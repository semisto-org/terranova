module Api
  module V1
    module Public
      class StripeWebhooksController < ApplicationController
        skip_before_action :verify_authenticity_token

        def create
          payload = request.body.read
          sig_header = request.env["HTTP_STRIPE_SIGNATURE"]
          webhook_secret = ENV.fetch("STRIPE_WEBHOOK_SECRET", "")

          begin
            event = if webhook_secret.present?
              Stripe::Webhook.construct_event(payload, sig_header, webhook_secret)
            else
              Stripe::Event.construct_from(JSON.parse(payload, symbolize_names: true))
            end
          rescue JSON::ParserError
            head :bad_request
            return
          rescue Stripe::SignatureVerificationError
            head :bad_request
            return
          end

          case event.type
          when "payment_intent.succeeded"
            handle_payment_intent_succeeded(event.data.object)
          end

          head :ok
        end

        private

        def handle_payment_intent_succeeded(payment_intent)
          metadata = payment_intent.metadata
          training_id = metadata["training_id"]
          return unless training_id.present?

          training = Academy::Training.find_by(id: training_id)
          return unless training

          existing = Academy::TrainingRegistration.find_by(stripe_payment_intent_id: payment_intent.id)
          return if existing

          amount_paid = payment_intent.amount / 100.0
          payment_type = metadata["payment_type"]
          payment_status = if payment_type == "deposit" && training.deposit_amount.positive?
            "partial"
          else
            "paid"
          end

          Academy::TrainingRegistration.create!(
            training: training,
            contact_name: metadata["contact_name"],
            contact_email: metadata["contact_email"] || "",
            phone: metadata["phone"] || "",
            departure_city: metadata["departure_city"] || "",
            departure_postal_code: metadata["departure_postal_code"] || "",
            departure_country: metadata["departure_country"] || "",
            carpooling: metadata["carpooling"] || "none",
            amount_paid: amount_paid,
            payment_amount: amount_paid,
            payment_status: payment_status,
            stripe_payment_intent_id: payment_intent.id,
            registered_at: Time.current
          )
        end
      end
    end
  end
end
