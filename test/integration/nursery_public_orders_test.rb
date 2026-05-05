require 'test_helper'

class NurseryPublicOrdersTest < ActionDispatch::IntegrationTest
  setup do
    [
      Nursery::Transfer,
      Nursery::OrderLine,
      Nursery::Order,
      Nursery::StockBatch,
      Nursery::Container,
      Nursery::Nursery
    ].each(&:delete_all)

    @pickup = Nursery::Nursery.create!(
      name: 'Pépinière Wallonie',
      nursery_type: 'semisto',
      integration: 'platform',
      city: 'Yvoir',
      postal_code: '5530',
      country: 'Belgique',
      is_pickup_point: true,
      contact_email: 'pepiniere@example.test'
    )

    @non_pickup = Nursery::Nursery.create!(
      name: 'Pépinière satellite',
      nursery_type: 'semisto',
      integration: 'manual',
      city: 'Liège',
      postal_code: '4000',
      country: 'Belgique',
      is_pickup_point: false
    )

    @container = Nursery::Container.create!(name: 'Godet 9cm', short_name: 'G9', sort_order: 1)

    @species = Plant::Species.find_or_create_by!(latin_name: 'Allium ursinum') { |s| s.plant_type = 'herbaceous' }

    @batch = Nursery::StockBatch.create!(
      nursery: @pickup, container: @container, species: @species,
      quantity: 30, available_quantity: 30, reserved_quantity: 0,
      growth_stage: 'young', status: 'available', price_euros: 4.5
    )
  end

  test 'public catalog endpoint returns batches' do
    get '/api/v1/nursery/catalog', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_kind_of Array, body
    assert_equal 1, body.length
    assert_equal @batch.id.to_s, body.first['stockBatchId']
  end

  test 'public pickup points endpoint lists only is_pickup_point nurseries' do
    get '/api/v1/nursery/public-pickup-points', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    ids = body.map { |n| n['id'] }
    assert_includes ids, @pickup.id.to_s
    refute_includes ids, @non_pickup.id.to_s
  end

  test 'submitting a public order enqueues confirmation + nursery notification emails' do
    ActiveJob::Base.queue_adapter = :test
    ActionMailer::Base.deliveries.clear

    assert_enqueued_emails 2 do
      post '/api/v1/nursery/public-orders', params: {
        customer_name: 'Marie Dupont',
        customer_email: 'marie@example.test',
        pickup_nursery_id: @pickup.id,
        lines: [{ stock_batch_id: @batch.id.to_s, quantity: 1 }]
      }, as: :json
    end

    assert_response :created
    mailer_calls = enqueued_jobs.map { |j| j['arguments'].first(2) }
    assert_includes mailer_calls, ['NurseryMailer', 'order_received_to_nursery']
    assert_includes mailer_calls, ['NurseryMailer', 'order_confirmation_to_customer']
  end

  test 'mailer templates render without errors' do
    order = Nursery::Order.create!(
      customer_name: 'Anna Test', customer_email: 'anna@example.test',
      customer_phone: '+32 470 11 22 33',
      is_member: false, price_level: 'standard',
      pickup_nursery: @pickup, status: 'new',
      order_number: 'PEP-RENDER-0001',
      notes: 'Préférence retrait samedi'
    )
    order.lines.create!(
      stock_batch: @batch, nursery: @pickup, nursery_name: @pickup.name,
      species_name: 'Allium ursinum', variety_name: '',
      container_name: 'G9', quantity: 2,
      unit_price_euros: 4.5, total_euros: 9.0, pay_in_semos: false
    )

    received = NurseryMailer.order_received_to_nursery(order)
    assert_match 'PEP-RENDER-0001', received.subject
    assert_match 'Anna Test', received.body.encoded
    assert_match 'Allium ursinum', received.body.encoded

    confirmation = NurseryMailer.order_confirmation_to_customer(order)
    assert_match 'PEP-RENDER-0001', confirmation.subject
    assert_equal ['anna@example.test'], confirmation.to

    ready = NurseryMailer.order_ready_to_customer(order)
    assert_match 'prête', ready.subject
    assert_equal ['anna@example.test'], ready.to
  end

  test 'order ready enqueues a notification to the customer' do
    ActiveJob::Base.queue_adapter = :test
    order = Nursery::Order.create!(
      customer_name: 'Paul', customer_email: 'paul@example.test',
      is_member: false, price_level: 'standard',
      pickup_nursery: @pickup, status: 'processing',
      order_number: 'PEP-TEST-0001'
    )

    assert_enqueued_emails 1 do
      patch "/api/v1/nursery/orders/#{order.id}/ready", as: :json
    end
    assert_response :success
    mailer_calls = enqueued_jobs.map { |j| j['arguments'].first(2) }
    assert_includes mailer_calls, ['NurseryMailer', 'order_ready_to_customer']
  end

  test 'submits a public order successfully without reserving stock' do
    assert_difference -> { Nursery::Order.count } => 1, -> { Nursery::OrderLine.count } => 1 do
      post '/api/v1/nursery/public-orders', params: {
        customer_name: 'Marie Dupont',
        customer_email: 'marie@example.test',
        customer_phone: '+32 477 12 34 56',
        pickup_nursery_id: @pickup.id,
        notes: 'Retrait samedi matin si possible',
        lines: [{ stock_batch_id: @batch.id.to_s, quantity: 3 }]
      }, as: :json
    end

    assert_response :created
    body = JSON.parse(response.body)
    assert_match(/\APEP-\d{4}-\d{4}\z/, body['orderNumber'])
    assert_in_delta 13.5, body['totalEuros'], 0.001
    assert_equal @pickup.name, body['pickupNurseryName']

    order = Nursery::Order.last
    assert_equal 'new', order.status
    refute order.is_member
    assert_equal 'standard', order.price_level
    assert_equal 'marie@example.test', order.customer_email

    @batch.reload
    assert_equal 30, @batch.available_quantity, 'stock should not be reserved at submission time'
    assert_equal 0, @batch.reserved_quantity
  end

  test 'rejects when stock is insufficient' do
    assert_no_difference -> { Nursery::Order.count } do
      post '/api/v1/nursery/public-orders', params: {
        customer_name: 'X',
        customer_email: 'x@example.test',
        pickup_nursery_id: @pickup.id,
        lines: [{ stock_batch_id: @batch.id.to_s, quantity: 50 }]
      }, as: :json
    end
    assert_response :unprocessable_entity
    assert_match(/insuffisant/i, JSON.parse(response.body)['error'])
  end

  test 'rejects with invalid email' do
    post '/api/v1/nursery/public-orders', params: {
      customer_name: 'Y',
      customer_email: 'not-an-email',
      pickup_nursery_id: @pickup.id,
      lines: [{ stock_batch_id: @batch.id.to_s, quantity: 1 }]
    }, as: :json
    assert_response :unprocessable_entity
    assert_match(/email/i, JSON.parse(response.body)['error'])
  end

  test 'rejects when pickup nursery is not a pickup point' do
    post '/api/v1/nursery/public-orders', params: {
      customer_name: 'Z',
      customer_email: 'z@example.test',
      pickup_nursery_id: @non_pickup.id,
      lines: [{ stock_batch_id: @batch.id.to_s, quantity: 1 }]
    }, as: :json
    assert_response :unprocessable_entity
    assert_match(/retrait/i, JSON.parse(response.body)['error'])
  end

  test 'rejects when lines are empty' do
    post '/api/v1/nursery/public-orders', params: {
      customer_name: 'A',
      customer_email: 'a@example.test',
      pickup_nursery_id: @pickup.id,
      lines: []
    }, as: :json
    assert_response :unprocessable_entity
    assert_match(/panier|vide/i, JSON.parse(response.body)['error'])
  end

  test 'rejects when quantity is out of range' do
    post '/api/v1/nursery/public-orders', params: {
      customer_name: 'A',
      customer_email: 'a@example.test',
      pickup_nursery_id: @pickup.id,
      lines: [{ stock_batch_id: @batch.id.to_s, quantity: 0 }]
    }, as: :json
    assert_response :unprocessable_entity
    assert_match(/quantité/i, JSON.parse(response.body)['error'])
  end
end
