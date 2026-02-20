require 'test_helper'

class NurseryExtendedTest < ActionDispatch::IntegrationTest
  setup do
    [
      Nursery::TimesheetEntry, Nursery::ScheduleSlot, Nursery::DocumentationEntry,
      Nursery::TeamMember, Nursery::Transfer, Nursery::OrderLine, Nursery::Order,
      Nursery::MotherPlant, Nursery::StockBatch, Nursery::Container, Nursery::Nursery
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
      name: 'Godet 9cm', short_name: 'G9', sort_order: 1
    )
  end

  # --- Nurseries CRUD ---

  test 'create nursery' do
    post '/api/v1/nursery/nurseries', params: {
      name: 'Partner Nursery', nursery_type: 'partner', integration: 'manual',
      city: 'Namur', postal_code: '5000', country: 'Belgique'
    }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 'Partner Nursery', body['name']
    assert_equal 'partner', body['type']
  end

  test 'update nursery' do
    patch "/api/v1/nursery/nurseries/#{@nursery.id}", params: { name: 'Renamed' }, as: :json
    assert_response :success
    assert_equal 'Renamed', JSON.parse(response.body)['name']
  end

  test 'delete nursery' do
    n = Nursery::Nursery.create!(name: 'Delete me', nursery_type: 'partner', integration: 'manual')
    delete "/api/v1/nursery/nurseries/#{n.id}", as: :json
    assert_response :no_content
    assert_raises(ActiveRecord::RecordNotFound) { n.reload }
  end

  # --- Containers CRUD ---

  test 'create container' do
    post '/api/v1/nursery/containers', params: {
      name: 'Pot 3L', short_name: 'P3', sort_order: 2, volume_liters: 3.0
    }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 'Pot 3L', body['name']
    assert_equal 3.0, body['volumeLiters']
  end

  test 'update container' do
    patch "/api/v1/nursery/containers/#{@container.id}", params: { name: 'Godet 11cm' }, as: :json
    assert_response :success
    assert_equal 'Godet 11cm', JSON.parse(response.body)['name']
  end

  test 'delete container without stock batches' do
    c = Nursery::Container.create!(name: 'Temp', short_name: 'T', sort_order: 99)
    delete "/api/v1/nursery/containers/#{c.id}", as: :json
    assert_response :no_content
  end

  # --- Show order ---

  test 'show order returns order with lines' do
    batch = Nursery::StockBatch.create!(
      nursery: @nursery, container: @container,
      species_id: 'sp-1', species_name: 'Malus domestica',
      quantity: 20, available_quantity: 20, reserved_quantity: 0,
      growth_stage: 'young', price_euros: 10
    )
    post '/api/v1/nursery/orders', params: {
      pickup_nursery_id: @nursery.id,
      customer_name: 'Test', customer_email: 'test@example.com',
      is_member: false, price_level: 'standard',
      lines: [{ stock_batch_id: batch.id, quantity: 3, unit_price_euros: 10 }]
    }, as: :json
    assert_response :created
    order_id = JSON.parse(response.body)['id']

    get "/api/v1/nursery/orders/#{order_id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['lines'].length
    assert_equal 'Malus domestica', body['lines'][0]['speciesName']
  end

  # --- Transfers ---

  test 'transfer lifecycle: create → start → complete' do
    order = Nursery::Order.create!(
      order_number: 'PEP-2026-T001', customer_name: 'Transfer Test',
      customer_email: 't@test.com', status: 'processing',
      price_level: 'standard', pickup_nursery: @nursery
    )

    post '/api/v1/nursery/transfers', params: {
      order_id: order.id, scheduled_date: Date.current.iso8601,
      driver_name: 'Jean', vehicle_info: 'Berlingo',
      stops: [{ nurseryId: @nursery.id.to_s, type: 'pickup' }]
    }, as: :json
    assert_response :created
    transfer_id = JSON.parse(response.body)['id']
    assert_equal 'planned', JSON.parse(response.body)['status']

    patch "/api/v1/nursery/transfers/#{transfer_id}/start", as: :json
    assert_response :success
    assert_equal 'in-progress', JSON.parse(response.body)['status']

    patch "/api/v1/nursery/transfers/#{transfer_id}/complete", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'completed', body['status']
    assert_not_nil body['completedAt']
  end

  test 'cancel transfer' do
    order = Nursery::Order.create!(
      order_number: 'PEP-2026-T002', customer_name: 'Cancel Test',
      customer_email: 'c@test.com', status: 'new',
      price_level: 'standard', pickup_nursery: @nursery
    )
    transfer = Nursery::Transfer.create!(
      order: order, status: 'planned', scheduled_date: Date.current
    )

    patch "/api/v1/nursery/transfers/#{transfer.id}/cancel", as: :json
    assert_response :success
    assert_equal 'cancelled', JSON.parse(response.body)['status']
  end

  # --- Team Members ---

  test 'team member CRUD' do
    post '/api/v1/nursery/team', params: {
      nursery_id: @nursery.id, name: 'Alice Martin', email: 'alice@example.com',
      role: 'manager', start_date: Date.current.iso8601
    }, as: :json
    assert_response :created
    member_id = JSON.parse(response.body)['id']
    assert_equal 'Alice Martin', JSON.parse(response.body)['name']
    assert_equal 'manager', JSON.parse(response.body)['role']

    patch "/api/v1/nursery/team/#{member_id}", params: { role: 'employee' }, as: :json
    assert_response :success
    assert_equal 'employee', JSON.parse(response.body)['role']

    get '/api/v1/nursery/team', as: :json
    assert_response :success
    assert_equal 1, JSON.parse(response.body).length

    delete "/api/v1/nursery/team/#{member_id}", as: :json
    assert_response :no_content
  end

  # --- Schedule ---

  test 'schedule slot CRUD' do
    member = Nursery::TeamMember.create!(
      name: 'Bob', email: 'bob@example.com', role: 'employee',
      nursery: @nursery, nursery_name: @nursery.name, start_date: Date.current
    )

    post '/api/v1/nursery/schedule', params: {
      member_id: member.id, date: Date.current.iso8601,
      start_time: '08:00', end_time: '12:00', activity: 'Rempotage'
    }, as: :json
    assert_response :created
    slot_id = JSON.parse(response.body)['id']
    assert_equal '08:00', JSON.parse(response.body)['startTime']

    patch "/api/v1/nursery/schedule/#{slot_id}", params: { end_time: '13:00' }, as: :json
    assert_response :success
    assert_equal '13:00', JSON.parse(response.body)['endTime']

    get '/api/v1/nursery/schedule', params: { week_start: Date.current.beginning_of_week.iso8601 }, as: :json
    assert_response :success

    delete "/api/v1/nursery/schedule/#{slot_id}", as: :json
    assert_response :no_content
  end

  # --- Documentation ---

  test 'documentation CRUD' do
    post '/api/v1/nursery/documentation', params: {
      entry_type: 'journal', title: 'Semis de mars',
      content: 'Début des semis...', author_id: 'member-1',
      author_name: 'Marie', nursery_id: @nursery.id, tags: ['semis', 'mars']
    }, as: :json
    assert_response :created
    doc_id = JSON.parse(response.body)['id']
    assert_equal 'journal', JSON.parse(response.body)['type']
    assert_equal ['semis', 'mars'], JSON.parse(response.body)['tags']

    patch "/api/v1/nursery/documentation/#{doc_id}", params: { title: 'Semis de mars 2026' }, as: :json
    assert_response :success
    assert_equal 'Semis de mars 2026', JSON.parse(response.body)['title']

    get '/api/v1/nursery/documentation', params: { type: 'journal' }, as: :json
    assert_response :success
    assert_equal 1, JSON.parse(response.body).length

    delete "/api/v1/nursery/documentation/#{doc_id}", as: :json
    assert_response :no_content
  end

  # --- Timesheets ---

  test 'timesheet CRUD' do
    member = Nursery::TeamMember.create!(
      name: 'Clara', email: 'clara@example.com', role: 'intern',
      nursery: @nursery, nursery_name: @nursery.name, start_date: Date.current
    )

    post '/api/v1/nursery/timesheets', params: {
      member_id: member.id, date: Date.current.iso8601,
      category: 'watering', hours: 3.5, description: 'Arrosage matinal'
    }, as: :json
    assert_response :created
    entry_id = JSON.parse(response.body)['id']
    assert_equal 3.5, JSON.parse(response.body)['hours']
    assert_equal 'watering', JSON.parse(response.body)['category']

    patch "/api/v1/nursery/timesheets/#{entry_id}", params: { hours: 4.0 }, as: :json
    assert_response :success
    assert_equal 4.0, JSON.parse(response.body)['hours']

    get '/api/v1/nursery/timesheets', params: { category: 'watering' }, as: :json
    assert_response :success
    assert_equal 1, JSON.parse(response.body).length

    delete "/api/v1/nursery/timesheets/#{entry_id}", as: :json
    assert_response :no_content
  end

  # --- Dashboard ---

  test 'dashboard includes schedule and alerts' do
    get '/api/v1/nursery/dashboard', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_kind_of Integer, body['lowStockCount']
    assert_kind_of Integer, body['pendingOrdersCount']
    assert_kind_of Integer, body['pendingTransfersCount']
    assert_kind_of Integer, body['pendingValidationsCount']
    assert_kind_of Array, body['alerts']
    assert_kind_of Array, body['todaySchedule']
    assert_kind_of Array, body['recentOrders']
  end

  # --- Index includes all data ---

  test 'index payload includes all sections' do
    get '/api/v1/nursery', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    %w[nurseries containers stockBatches motherPlants orders transfers
       teamMembers schedule documentation timesheets catalog dashboard].each do |key|
      assert body.key?(key), "Missing key: #{key}"
    end
  end

  # --- Edge Cases ---

  test 'order cancellation releases reserved stock' do
    batch = Nursery::StockBatch.create!(
      nursery: @nursery, container: @container,
      species_id: 'sp-edge', species_name: 'Edge Species',
      quantity: 20, available_quantity: 20, reserved_quantity: 0,
      growth_stage: 'young', price_euros: 5
    )

    post '/api/v1/nursery/orders', params: {
      pickup_nursery_id: @nursery.id, customer_name: 'Edge Test',
      customer_email: 'edge@example.com', is_member: false, price_level: 'standard',
      lines: [{ stock_batch_id: batch.id, quantity: 8, unit_price_euros: 5 }]
    }, as: :json
    order_id = JSON.parse(response.body)['id']

    patch "/api/v1/nursery/orders/#{order_id}/process", as: :json
    batch.reload
    assert_equal 12, batch.available_quantity
    assert_equal 8, batch.reserved_quantity

    patch "/api/v1/nursery/orders/#{order_id}/cancel", as: :json
    batch.reload
    assert_equal 20, batch.available_quantity
    assert_equal 0, batch.reserved_quantity
  end

  test 'mother plant rejection records notes' do
    mp = Nursery::MotherPlant.create!(
      species_id: 'sp-rej', species_name: 'Reject Test',
      place_name: 'Test', place_address: 'Rue', planting_date: Date.current,
      source: 'member-proposal', status: 'pending', quantity: 1
    )

    patch "/api/v1/nursery/mother-plants/#{mp.id}/reject", params: {
      validated_by: 'Admin', notes: 'Location inaccessible'
    }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'rejected', body['status']
    assert_equal 'Location inaccessible', body['notes']
  end
end
