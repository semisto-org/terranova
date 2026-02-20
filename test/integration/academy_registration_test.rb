require 'test_helper'

class AcademyRegistrationTest < ActionDispatch::IntegrationTest
  setup do
    [
      Academy::TrainingAttendance,
      Academy::TrainingRegistration,
      Academy::TrainingSession,
      Academy::Training,
      Academy::TrainingType
    ].each(&:delete_all)

    @type = Academy::TrainingType.create!(name: 'Permaculture', description: 'Formation permaculture')
    @training = Academy::Training.create!(
      training_type: @type,
      title: 'Introduction à la permaculture',
      status: 'registrations_open',
      price: 250.00,
      deposit_amount: 80.00,
      max_participants: 20,
      description: 'Une formation de 3 jours sur la permaculture.'
    )
    @training.sessions.create!(
      start_date: Date.new(2026, 4, 10),
      end_date: Date.new(2026, 4, 12)
    )
  end

  test 'public training info returns training details when registrations are open' do
    get "/api/v1/public/academy/trainings/#{@training.id}", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal @training.title, body['title']
    assert_equal 250.0, body['price']
    assert_equal 80.0, body['depositAmount']
    assert_equal 20, body['spotsRemaining']
    assert_equal 'Permaculture', body['trainingType']['name']
    assert_equal 1, body['sessions'].size
  end

  test 'public training info returns gone when training is not open for registration' do
    @training.update!(status: 'draft')

    get "/api/v1/public/academy/trainings/#{@training.id}", as: :json
    assert_response :gone
  end

  test 'public training info shows correct spots remaining' do
    5.times do |i|
      @training.registrations.create!(
        contact_name: "Participant #{i}",
        payment_status: 'paid',
        registered_at: Time.current
      )
    end

    get "/api/v1/public/academy/trainings/#{@training.id}", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 15, body['spotsRemaining']
  end

  test 'registration model validates carpooling values' do
    reg = Academy::TrainingRegistration.new(
      training: @training,
      contact_name: 'Test User',
      payment_status: 'pending',
      registered_at: Time.current,
      carpooling: 'invalid'
    )
    assert_not reg.valid?
    assert reg.errors[:carpooling].any?

    reg.carpooling = 'seeking'
    assert reg.valid?
  end

  test 'registration model accepts all valid carpooling options' do
    %w[none seeking offering].each do |option|
      reg = Academy::TrainingRegistration.new(
        training: @training,
        contact_name: 'Test User',
        payment_status: 'pending',
        registered_at: Time.current,
        carpooling: option
      )
      assert reg.valid?, "Expected carpooling='#{option}' to be valid"
    end
  end

  test 'training deposit_amount validation' do
    @training.deposit_amount = -10
    assert_not @training.valid?
    assert @training.errors[:deposit_amount].any?

    @training.deposit_amount = 0
    assert @training.valid?

    @training.deposit_amount = 80
    assert @training.valid?
  end

  test 'academy serializer includes new fields' do
    reg = @training.registrations.create!(
      contact_name: 'Jean Dupont',
      contact_email: 'jean@test.be',
      phone: '+32 470 12 34 56',
      departure_city: 'Bruxelles',
      departure_postal_code: '1000',
      departure_country: 'BE',
      carpooling: 'offering',
      payment_status: 'paid',
      amount_paid: 250.0,
      payment_amount: 250.0,
      registered_at: Time.current
    )

    get '/api/v1/academy', as: :json
    assert_response :success

    body = JSON.parse(response.body)
    training_data = body['trainings'].find { |t| t['id'] == @training.id.to_s }
    assert_equal 80.0, training_data['depositAmount']

    reg_data = body['trainingRegistrations'].find { |r| r['id'] == reg.id.to_s }
    assert_equal 'Bruxelles', reg_data['departureCity']
    assert_equal 'offering', reg_data['carpooling']
    assert_equal 250.0, reg_data['paymentAmount']
  end

  test 'webhook creates registration on payment success' do
    payload = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          amount: 25000,
          metadata: {
            training_id: @training.id.to_s,
            contact_name: 'Marie Martin',
            contact_email: 'marie@test.be',
            phone: '+32 470 00 00 00',
            departure_city: 'Namur',
            departure_postal_code: '5000',
            departure_country: 'BE',
            carpooling: 'seeking',
            payment_type: 'full'
          }
        }
      }
    }

    assert_difference 'Academy::TrainingRegistration.count', 1 do
      post '/api/v1/public/stripe-webhooks', params: payload.to_json,
        headers: { 'Content-Type' => 'application/json' }
      assert_response :ok
    end

    reg = Academy::TrainingRegistration.last
    assert_equal 'Marie Martin', reg.contact_name
    assert_equal 'marie@test.be', reg.contact_email
    assert_equal 'seeking', reg.carpooling
    assert_equal 'Namur', reg.departure_city
    assert_equal 'paid', reg.payment_status
    assert_equal 250.0, reg.amount_paid.to_f
    assert_equal 'pi_test_123', reg.stripe_payment_intent_id
  end

  test 'webhook creates registration with partial status for deposit payment' do
    payload = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_deposit_456',
          amount: 8000,
          metadata: {
            training_id: @training.id.to_s,
            contact_name: 'Pierre Dumont',
            contact_email: 'pierre@test.be',
            phone: '+32 470 11 11 11',
            departure_city: 'Liège',
            departure_postal_code: '4000',
            departure_country: 'BE',
            carpooling: 'none',
            payment_type: 'deposit'
          }
        }
      }
    }

    assert_difference 'Academy::TrainingRegistration.count', 1 do
      post '/api/v1/public/stripe-webhooks', params: payload.to_json,
        headers: { 'Content-Type' => 'application/json' }
      assert_response :ok
    end

    reg = Academy::TrainingRegistration.last
    assert_equal 'partial', reg.payment_status
    assert_equal 80.0, reg.amount_paid.to_f
    assert_equal 'pi_test_deposit_456', reg.stripe_payment_intent_id
  end

  test 'webhook does not duplicate registration for same payment intent' do
    @training.registrations.create!(
      contact_name: 'Already Registered',
      payment_status: 'paid',
      registered_at: Time.current,
      stripe_payment_intent_id: 'pi_test_dupe'
    )

    payload = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_dupe',
          amount: 25000,
          metadata: {
            training_id: @training.id.to_s,
            contact_name: 'Duplicate Person',
            contact_email: 'dupe@test.be',
            payment_type: 'full'
          }
        }
      }
    }

    assert_no_difference 'Academy::TrainingRegistration.count' do
      post '/api/v1/public/stripe-webhooks', params: payload.to_json,
        headers: { 'Content-Type' => 'application/json' }
      assert_response :ok
    end
  end
end
