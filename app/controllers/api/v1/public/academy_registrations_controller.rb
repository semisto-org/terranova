module Api
  module V1
    module Public
      class AcademyRegistrationsController < ApplicationController
        skip_before_action :verify_authenticity_token, only: [:create_payment_intent]

        def training_info
          training = Academy::Training.includes(:training_type, :sessions, :registrations)
                                       .find(params[:training_id])

          unless training.status == "registrations_open"
            render json: { error: "Les inscriptions ne sont pas ouvertes pour cette formation." }, status: :gone
            return
          end

          spots_taken = training.registrations.count
          spots_remaining = training.max_participants.positive? ? [training.max_participants - spots_taken, 0].max : nil

          sessions = training.sessions.order(:start_date).map do |s|
            {
              startDate: s.start_date.iso8601,
              endDate: s.end_date.iso8601,
              topic: s.topic,
              locationIds: s.location_ids
            }
          end

          locations = Academy::TrainingLocation.where(
            id: training.sessions.flat_map(&:location_ids).uniq
          ).map do |loc|
            { id: loc.id.to_s, name: loc.name, address: loc.address }
          end

          render json: {
            id: training.id.to_s,
            title: training.title,
            description: training.description,
            price: training.price.to_f,
            depositAmount: training.deposit_amount.to_f,
            vatRate: training.vat_rate.to_f,
            maxParticipants: training.max_participants,
            spotsRemaining: spots_remaining,
            requiresAccommodation: training.requires_accommodation,
            trainingType: {
              name: training.training_type.name,
              description: training.training_type.description
            },
            sessions: sessions,
            locations: locations
          }
        end

        def create_payment_intent
          training = Academy::Training.find(params[:training_id])

          unless training.status == "registrations_open"
            render json: { error: "Les inscriptions ne sont pas ouvertes." }, status: :gone
            return
          end

          spots_taken = training.registrations.count
          if training.max_participants.positive? && spots_taken >= training.max_participants
            render json: { error: "Cette formation est complète." }, status: :unprocessable_entity
            return
          end

          payment_type = params[:payment_type] # "full" or "deposit"
          amount = if payment_type == "deposit" && training.deposit_amount.positive?
            training.deposit_amount
          else
            training.price
          end

          amount_cents = (amount * 100).to_i

          if amount_cents <= 0
            render json: { error: "Montant de paiement invalide." }, status: :unprocessable_entity
            return
          end

          intent = Stripe::PaymentIntent.create(
            amount: amount_cents,
            currency: "eur",
            payment_method_types: %w[card bancontact],
            metadata: {
              training_id: training.id.to_s,
              contact_name: params[:contact_name],
              contact_email: params[:contact_email],
              phone: params[:phone],
              departure_city: params[:departure_city],
              departure_postal_code: params[:departure_postal_code],
              departure_country: params[:departure_country],
              carpooling: params[:carpooling],
              payment_type: payment_type
            }
          )

          render json: {
            clientSecret: intent.client_secret,
            paymentIntentId: intent.id,
            amount: amount.to_f
          }
        end
      end
    end
  end
end
