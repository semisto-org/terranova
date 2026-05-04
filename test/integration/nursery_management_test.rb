require 'test_helper'

class NurseryManagementTest < ActionDispatch::IntegrationTest
  setup do
    [
      Nursery::Transfer,
      Nursery::OrderLine,
      Nursery::Order,
      Nursery::MotherPlant,
      Nursery::StockBatch,
      Nursery::Container,
      Nursery::Nursery
    ].each(&:delete_all)

    @nursery = Nursery::Nursery.create!(
      name: 'Pépinière Semisto Wallonie',
      nursery_type: 'semisto',
      integration: 'platform',
      city: 'LLN',
      postal_code: '1348',
      country: 'Belgique'
    )

    @container = Nursery::Container.create!(
      name: 'Godet 9cm',
      short_name: 'G9',
      sort_order: 1
    )

    @species_malus = Plant::Species.find_or_create_by!(latin_name: 'Malus domestica') { |s| s.plant_type = 'tree' }
    @species_ribes = Plant::Species.find_or_create_by!(latin_name: 'Ribes nigrum') { |s| s.plant_type = 'shrub' }
    @species_corylus = Plant::Species.find_or_create_by!(latin_name: 'Corylus avellana') { |s| s.plant_type = 'tree' }
  end

  test 'add stock batch flow works' do
    post '/api/v1/nursery/stock-batches', params: {
      nursery_id: @nursery.id,
      species_id: @species_malus.id,
      container_id: @container.id,
      quantity: 50,
      growth_stage: 'young',
      price_euros: 12.5
    }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 50, body['quantity']
    assert_equal 50, body['availableQuantity']
    assert_equal 0, body['reservedQuantity']
    assert_equal 'available', body['status']
    assert_equal 'Malus domestica', body['speciesName']
  end

  test 'in_production batch requires availability date or label' do
    invalid = Nursery::StockBatch.new(
      nursery: @nursery, container: @container, species: @species_malus,
      quantity: 0, growth_stage: 'seed', status: 'in_production', price_euros: 0
    )
    refute invalid.valid?
    assert_includes invalid.errors[:expected_availability_on].join, 'en production'

    post '/api/v1/nursery/stock-batches', params: {
      nursery_id: @nursery.id,
      species_id: @species_malus.id,
      container_id: @container.id,
      quantity: 0,
      growth_stage: 'seed',
      status: 'in_production',
      availability_label: 'septembre 2026',
      price_euros: 0
    }, as: :json
    assert_response :created
    assert_equal 'in_production', JSON.parse(response.body)['status']
    assert_equal 'septembre 2026', JSON.parse(response.body)['availabilityLabel']
  end

  test 'quick status update endpoint works' do
    batch = Nursery::StockBatch.create!(
      nursery: @nursery, container: @container, species: @species_malus,
      quantity: 10, available_quantity: 10, growth_stage: 'young',
      status: 'available', price_euros: 5
    )
    patch "/api/v1/nursery/stock-batches/#{batch.id}/status", params: { status: 'sold_out' }, as: :json
    assert_response :success
    assert_equal 'sold_out', JSON.parse(response.body)['status']
  end

  test 'create stock batch tolerates null availability_label / notes / origin' do
    # Regression: bulk imports were sending these fields as null and the
    # controller previously forwarded them straight to a NOT NULL column,
    # producing a 500. The controller must coerce nil → DB default.
    post '/api/v1/nursery/stock-batches', params: {
      nursery_id: @nursery.id,
      species_id: @species_malus.id,
      container_id: @container.id,
      quantity: 5,
      growth_stage: 'young',
      status: 'available',
      availability_label: nil,
      notes: nil,
      origin: nil,
      price_euros: 5
    }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 5, body['quantity']
    assert_equal 'available', body['status']
  end

  test 'order processing workflow updates statuses and stock' do
    batch = Nursery::StockBatch.create!(
      nursery: @nursery,
      container: @container,
      species: @species_ribes,
      quantity: 10,
      available_quantity: 10,
      reserved_quantity: 0,
      growth_stage: 'young',
      price_euros: 8
    )

    post '/api/v1/nursery/orders', params: {
      pickup_nursery_id: @nursery.id,
      customer_name: 'Pierre Martin',
      customer_email: 'pierre@example.com',
      is_member: true,
      price_level: 'standard',
      lines: [
        { stock_batch_id: batch.id, quantity: 4, unit_price_euros: 8, pay_in_semos: false }
      ]
    }, as: :json
    assert_response :created
    order_id = JSON.parse(response.body)['id']

    patch "/api/v1/nursery/orders/#{order_id}/process", as: :json
    assert_response :success
    assert_equal 'processing', JSON.parse(response.body)['status']
    batch.reload
    assert_equal 6, batch.available_quantity
    assert_equal 4, batch.reserved_quantity

    patch "/api/v1/nursery/orders/#{order_id}/ready", as: :json
    assert_response :success
    assert_equal 'ready', JSON.parse(response.body)['status']

    patch "/api/v1/nursery/orders/#{order_id}/picked-up", as: :json
    assert_response :success
    assert_equal 'picked-up', JSON.parse(response.body)['status']
    batch.reload
    assert_equal 6, batch.available_quantity
    assert_equal 0, batch.reserved_quantity
  end

  test 'mother plant validation flow works' do
    mother = Nursery::MotherPlant.create!(
      species_id: 'sp-200',
      species_name: 'Mentha spicata',
      place_name: 'Jardin test',
      place_address: 'Rue test',
      planting_date: Date.current - 30,
      source: 'member-proposal',
      status: 'pending',
      quantity: 5
    )

    patch "/api/v1/nursery/mother-plants/#{mother.id}/validate", params: { validated_by: 'Marie Dupont' }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'validated', body['status']
    assert_equal 'Marie Dupont', body['validatedBy']
    assert_not_nil body['validatedAt']
  end

  test 'catalog endpoint exposes platform quantities and manual availability' do
    manual_nursery = Nursery::Nursery.create!(
      name: 'Partner manual',
      nursery_type: 'partner',
      integration: 'manual',
      city: 'Namur',
      postal_code: '5000',
      country: 'Belgique'
    )
    Nursery::StockBatch.create!(
      nursery: manual_nursery,
      container: @container,
      species: @species_corylus,
      quantity: 12,
      available_quantity: 12,
      reserved_quantity: 0,
      growth_stage: 'young',
      price_euros: 18
    )

    get '/api/v1/nursery/catalog', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    manual = body.find { |row| row['nurseryIntegration'] == 'manual' }
    assert_not_nil manual
    assert_nil manual['availableQuantity']
    assert_equal true, manual['available']
  end
end
