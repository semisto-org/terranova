module Api
  module V1
    module Public
      class AcademyRegistrationsController < ApplicationController
        skip_before_action :verify_authenticity_token, only: [:create_payment_intent]

        def training_info
          training = Academy::Training.includes(:training_type, :sessions, :registrations, :participant_categories)
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

          setting = Academy::Setting.current

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
            participantCategories: training.participant_categories.order(:position).map { |c|
              { id: c.id.to_s, label: c.label, price: c.price.to_f,
                maxSpots: c.max_spots, depositAmount: c.deposit_amount.to_f,
                spotsRemaining: c.spots_remaining }
            },
            volumeDiscount: {
              perSpot: setting.volume_discount_per_spot.to_f,
              max: setting.volume_discount_max.to_f
            },
            sessions: sessions,
            locations: locations
          }
        end

        def create_payment_intent
          training = Academy::Training.includes(:participant_categories).find(params[:training_id])

          unless training.status == "registrations_open"
            render json: { error: "Les inscriptions ne sont pas ouvertes." }, status: :gone
            return
          end

          setting = Academy::Setting.current
          payment_type = params[:payment_type] # "full" or "deposit"
          items_data = []

          if params[:items].present?
            total_amount = 0
            deposit_total = 0
            params[:items].each do |item_param|
              cat = training.participant_categories.find(item_param[:category_id])
              qty = item_param[:quantity].to_i
              next if qty <= 0

              if qty > cat.spots_remaining
                render json: { error: "Plus assez de places pour '#{cat.label}'." }, status: :unprocessable_entity
                return
              end

              discount = setting.discount_for_quantity(qty)
              subtotal = (cat.price * qty * (1 - discount / 100.0)).round(2)
              total_amount += subtotal

              if cat.deposit_amount.to_f > 0
                deposit_total += (cat.deposit_amount * qty).round(2)
              else
                deposit_total += subtotal
              end

              items_data << { category_id: cat.id, quantity: qty, unit_price: cat.price.to_f, discount_percent: discount }
            end

            amount = if payment_type == "deposit" && deposit_total < total_amount
              deposit_total
            else
              total_amount
            end
          else
            amount = if payment_type == "deposit" && training.deposit_amount.positive?
              training.deposit_amount
            else
              training.price
            end
          end

          amount_cents = (amount * 100).to_i

          if amount_cents <= 0
            render json: { error: "Montant de paiement invalide." }, status: :unprocessable_entity
            return
          end

          metadata = {
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
          metadata[:items] = items_data.to_json if items_data.present?

          intent = Stripe::PaymentIntent.create(
            amount: amount_cents,
            currency: "eur",
            payment_method_types: %w[card bancontact],
            metadata: metadata
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
