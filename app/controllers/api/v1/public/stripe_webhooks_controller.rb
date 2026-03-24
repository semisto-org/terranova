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

          registration = nil

          ActiveRecord::Base.transaction do
            registration = Academy::TrainingRegistration.create!(
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
              payment_status: "pending",
              stripe_payment_intent_id: payment_intent.id,
              registered_at: Time.current
            )

            if metadata["items"].present?
              items = JSON.parse(metadata["items"])
              items.each do |item_data|
                cat = training.participant_categories.find_by(id: item_data["category_id"])
                next unless cat

                registration.registration_items.create!(
                  participant_category: cat,
                  quantity: item_data["quantity"].to_i,
                  unit_price: item_data["unit_price"].to_f,
                  discount_percent: item_data["discount_percent"].to_f
                )
              end
              registration.recompute_payment_amount!
            end

            total_due = if registration.registration_items.any?
              registration.payment_amount.to_f
            else
              training.price.to_f
            end

            payment_status = if payment_type == "deposit" && amount_paid < total_due
              "partial"
            else
              "paid"
            end

            registration.update!(payment_status: payment_status)
          end

          if registration
            payment_method_label = resolve_payment_method(payment_intent)
            AcademyMailer.registration_confirmation(registration, payment_method: payment_method_label).deliver_later
            notify_slack(registration, payment_intent)
          end
        end

        def notify_slack(registration, payment_intent)
          training = registration.training
          app_host = ENV.fetch("APP_HOST", "localhost:3000")
          scheme = app_host.include?("localhost") ? "http" : "https"
          training_url = "#{scheme}://#{app_host}/academy/#{training.id}"

          status_label = registration.payment_status == "partial" ? "acompte" : "paiement complet"
          amount = format_amount(registration.amount_paid.to_f)

          payment_method = resolve_payment_method(payment_intent)

          items_lines = registration.registration_items.includes(:participant_category).map do |item|
            label = item.participant_category&.label || "Place"
            "    #{label} x #{item.quantity}"
          end

          lines = [
            ":tada: *Nouvelle inscription*",
            "*#{registration.contact_name}* s'est inscrit(e) à <#{training_url}|#{training.title}>"
          ]
          lines.concat(items_lines) if items_lines.any?
          lines << "Montant payé : *#{amount}* (#{status_label} — #{payment_method})"

          SlackNotifier.post(text: lines.join("\n"))
        end

        def resolve_payment_method(payment_intent)
          type = nil
          last4 = nil
          begin
            charges = payment_intent.try(:charges)
            if charges.respond_to?(:data) && charges.data.is_a?(Array) && charges.data.any?
              details = charges.data.first.try(:payment_method_details)
              type = details&.try(:type)
              last4 = details&.try(:card)&.try(:last4) if type == "card"
            end
          rescue StandardError
            # Ignore — charges may not be present in test/webhook payloads
          end
          type ||= Array(payment_intent.try(:payment_method_types)).first
          case type
          when "bancontact" then "Bancontact"
          when "card" then last4.present? ? "Carte ***#{last4}" : "Carte"
          else type&.capitalize || "Carte"
          end
        end

        def format_amount(value)
          if value == value.to_i.to_f
            "#{value.to_i} \u20AC"
          else
            "#{sprintf('%.2f', value).gsub('.', ',')} \u20AC"
          end
        end
      end
    end
  end
end
