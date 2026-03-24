require 'test_helper'

class AcademyCategoriesTest < ActionDispatch::IntegrationTest
  setup do
    [
      Academy::TrainingAttendance,
      Expense,
      Academy::TrainingDocument,
      Academy::TrainingRegistration,
      Academy::TrainingSession,
      Academy::Training,
      Academy::TrainingLocation,
      Academy::TrainingType,
      Contact
    ].each(&:delete_all)

    # Clean up new tables (may not exist yet during Red phase)
    Academy::RegistrationItem.delete_all if defined?(Academy::RegistrationItem)
    Academy::ParticipantCategory.delete_all if defined?(Academy::ParticipantCategory)
    Academy::Setting.delete_all if defined?(Academy::Setting)

    @type = Academy::TrainingType.create!(name: 'Stage découverte', description: 'Intro')
    @training = Academy::Training.create!(
      training_type: @type,
      title: 'Session printemps',
      status: 'idea'
    )
  end

  # ──────────────────────────────────────────────
  # Academy::Setting — volume discount calculation
  # ──────────────────────────────────────────────

  test 'Setting.current creates default settings with 10% per spot and 30% max' do
    setting = Academy::Setting.current
    assert_equal 10.0, setting.volume_discount_per_spot.to_f
    assert_equal 30.0, setting.volume_discount_max.to_f
  end

  test 'Setting.current returns same record on subsequent calls' do
    s1 = Academy::Setting.current
    s2 = Academy::Setting.current
    assert_equal s1.id, s2.id
  end

  test 'discount_for_quantity returns 0 for 1 place' do
    setting = Academy::Setting.current
    assert_equal 0, setting.discount_for_quantity(1)
  end

  test 'discount_for_quantity returns 10% for 2 places' do
    setting = Academy::Setting.current
    assert_in_delta 10.0, setting.discount_for_quantity(2), 0.01
  end

  test 'discount_for_quantity returns 20% for 3 places' do
    setting = Academy::Setting.current
    assert_in_delta 20.0, setting.discount_for_quantity(3), 0.01
  end

  test 'discount_for_quantity caps at 30% for 4+ places' do
    setting = Academy::Setting.current
    assert_in_delta 30.0, setting.discount_for_quantity(4), 0.01
    assert_in_delta 30.0, setting.discount_for_quantity(10), 0.01
  end

  test 'discount_for_quantity returns 0 for 0 or negative' do
    setting = Academy::Setting.current
    assert_equal 0, setting.discount_for_quantity(0)
    assert_equal 0, setting.discount_for_quantity(-1)
  end

  test 'discount_for_quantity with custom settings' do
    setting = Academy::Setting.create!(volume_discount_per_spot: 15.0, volume_discount_max: 25.0)
    assert_in_delta 15.0, setting.discount_for_quantity(2), 0.01
    assert_in_delta 25.0, setting.discount_for_quantity(3), 0.01
    assert_in_delta 25.0, setting.discount_for_quantity(5), 0.01
  end

  # ──────────────────────────────────────────────
  # Academy::ParticipantCategory — CRUD & spots
  # ──────────────────────────────────────────────

  test 'participant category belongs to training and validates label' do
    cat = Academy::ParticipantCategory.new(training: @training, price: 45.0, max_spots: 10)
    assert_not cat.valid?
    assert cat.errors[:label].present?

    cat.label = 'Adulte'
    assert cat.valid?
  end

  test 'participant category validates price >= 0' do
    cat = Academy::ParticipantCategory.new(training: @training, label: 'Test', price: -5, max_spots: 10)
    assert_not cat.valid?
    assert cat.errors[:price].present?
  end

  test 'participant category validates max_spots >= 0' do
    cat = Academy::ParticipantCategory.new(training: @training, label: 'Test', price: 10, max_spots: -1)
    assert_not cat.valid?
    assert cat.errors[:max_spots].present?
  end

  test 'spots_taken returns 0 with no registrations' do
    cat = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 10)
    assert_equal 0, cat.spots_taken
  end

  test 'spots_taken sums quantities from registration items' do
    cat = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 10)

    reg1 = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Alice Dupont',
      payment_status: 'pending', registered_at: Time.current, carpooling: 'none'
    )
    reg2 = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Bob Martin',
      payment_status: 'pending', registered_at: Time.current, carpooling: 'none'
    )

    Academy::RegistrationItem.create!(registration: reg1, participant_category: cat, quantity: 2, unit_price: 45.0)
    Academy::RegistrationItem.create!(registration: reg2, participant_category: cat, quantity: 3, unit_price: 45.0)

    assert_equal 5, cat.spots_taken
    assert_equal 5, cat.spots_remaining
  end

  test 'spots_taken excludes soft-deleted registrations' do
    cat = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 10)

    reg = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Charlie Blanc',
      payment_status: 'pending', registered_at: Time.current, carpooling: 'none'
    )
    Academy::RegistrationItem.create!(registration: reg, participant_category: cat, quantity: 3, unit_price: 45.0)

    assert_equal 3, cat.spots_taken

    reg.soft_delete!
    assert_equal 0, cat.reload.spots_taken
  end

  test 'max_spots 0 means no spots available' do
    cat = Academy::ParticipantCategory.create!(training: @training, label: 'Fermé', price: 45.0, max_spots: 0)
    assert_equal 0, cat.spots_remaining
  end

  test 'participant category supports soft delete' do
    cat = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 10)
    cat.soft_delete!

    assert_equal 0, Academy::ParticipantCategory.where(training: @training).count
    assert_equal 1, Academy::ParticipantCategory.with_deleted.where(training: @training).count
  end

  test 'participant category cannot be destroyed if registration items exist' do
    cat = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 10)

    reg = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Test User',
      payment_status: 'pending', registered_at: Time.current, carpooling: 'none'
    )
    Academy::RegistrationItem.create!(registration: reg, participant_category: cat, quantity: 1, unit_price: 45.0)

    assert_not cat.destroy
  end

  # ──────────────────────────────────────────────
  # Academy::RegistrationItem — subtotal compute
  # ──────────────────────────────────────────────

  test 'registration item computes subtotal without discount' do
    cat = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 10)
    reg = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Test User',
      payment_status: 'pending', registered_at: Time.current, carpooling: 'none'
    )

    item = Academy::RegistrationItem.create!(
      registration: reg, participant_category: cat,
      quantity: 2, unit_price: 45.0, discount_percent: 0
    )

    assert_in_delta 90.0, item.subtotal.to_f, 0.01
  end

  test 'registration item computes subtotal with 10% discount' do
    cat = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 10)
    reg = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Test User',
      payment_status: 'pending', registered_at: Time.current, carpooling: 'none'
    )

    item = Academy::RegistrationItem.create!(
      registration: reg, participant_category: cat,
      quantity: 2, unit_price: 45.0, discount_percent: 10.0
    )

    # 2 × 45 × 0.90 = 81.0
    assert_in_delta 81.0, item.subtotal.to_f, 0.01
  end

  test 'registration item computes subtotal with 30% discount' do
    cat = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 20)
    reg = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Test User',
      payment_status: 'pending', registered_at: Time.current, carpooling: 'none'
    )

    item = Academy::RegistrationItem.create!(
      registration: reg, participant_category: cat,
      quantity: 4, unit_price: 45.0, discount_percent: 30.0
    )

    # 4 × 45 × 0.70 = 126.0
    assert_in_delta 126.0, item.subtotal.to_f, 0.01
  end

  test 'registration item validates quantity > 0' do
    cat = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 10)
    reg = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Test User',
      payment_status: 'pending', registered_at: Time.current, carpooling: 'none'
    )

    item = Academy::RegistrationItem.new(
      registration: reg, participant_category: cat,
      quantity: 0, unit_price: 45.0
    )
    assert_not item.valid?
    assert item.errors[:quantity].present?
  end

  test 'registration item validates discount_percent between 0 and 100' do
    cat = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 10)
    reg = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Test User',
      payment_status: 'pending', registered_at: Time.current, carpooling: 'none'
    )

    item = Academy::RegistrationItem.new(
      registration: reg, participant_category: cat,
      quantity: 1, unit_price: 45.0, discount_percent: 101
    )
    assert_not item.valid?
    assert item.errors[:discount_percent].present?
  end

  # ──────────────────────────────────────────────
  # Academy::Training — capacity from categories
  # ──────────────────────────────────────────────

  test 'training total_capacity sums category max_spots' do
    Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 15)
    Academy::ParticipantCategory.create!(training: @training, label: 'Enfant', price: 25.0, max_spots: 10)

    assert_equal 25, @training.total_capacity
  end

  test 'training total_spots_taken sums across categories' do
    cat_adult = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 15)
    cat_child = Academy::ParticipantCategory.create!(training: @training, label: 'Enfant', price: 25.0, max_spots: 10)

    reg = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Test Family',
      payment_status: 'pending', registered_at: Time.current, carpooling: 'none'
    )

    Academy::RegistrationItem.create!(registration: reg, participant_category: cat_adult, quantity: 2, unit_price: 45.0)
    Academy::RegistrationItem.create!(registration: reg, participant_category: cat_child, quantity: 1, unit_price: 25.0)

    assert_equal 3, @training.total_spots_taken
    assert_equal 22, @training.total_spots_remaining
  end

  # ──────────────────────────────────────────────
  # Academy::TrainingRegistration — recompute
  # ──────────────────────────────────────────────

  test 'recompute_payment_amount sums registration item subtotals' do
    cat_adult = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 15)
    cat_child = Academy::ParticipantCategory.create!(training: @training, label: 'Enfant', price: 25.0, max_spots: 10)

    reg = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Test Family',
      payment_status: 'pending', registered_at: Time.current, carpooling: 'none'
    )

    # 2 adults at 45€ with 10% discount = 2 × 45 × 0.90 = 81.0
    Academy::RegistrationItem.create!(
      registration: reg, participant_category: cat_adult,
      quantity: 2, unit_price: 45.0, discount_percent: 10.0
    )
    # 1 child at 25€ with no discount = 25.0
    Academy::RegistrationItem.create!(
      registration: reg, participant_category: cat_child,
      quantity: 1, unit_price: 25.0, discount_percent: 0
    )

    reg.recompute_payment_amount!
    assert_in_delta 106.0, reg.reload.payment_amount.to_f, 0.01
  end

  # ──────────────────────────────────────────────
  # TrainingType — default_categories
  # ──────────────────────────────────────────────

  test 'training type stores and retrieves default_categories as JSONB' do
    @type.update!(default_categories: [
      { 'label' => 'Adulte', 'price' => 45.0, 'maxSpots' => 15, 'depositAmount' => 20.0 },
      { 'label' => 'Enfant', 'price' => 25.0, 'maxSpots' => 10, 'depositAmount' => 0.0 }
    ])

    @type.reload
    assert_equal 2, @type.default_categories.size
    assert_equal 'Adulte', @type.default_categories.first['label']
    assert_equal 45.0, @type.default_categories.first['price']
  end

  # ──────────────────────────────────────────────
  # API: Serializers include categories and items
  # ──────────────────────────────────────────────

  test 'academy payload includes participant categories in training serialization' do
    Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 15, position: 0)
    Academy::ParticipantCategory.create!(training: @training, label: 'Enfant', price: 25.0, max_spots: 10, position: 1)

    get '/api/v1/academy', as: :json
    assert_response :success

    body = JSON.parse(response.body)
    training = body['trainings'].find { |t| t['id'] == @training.id.to_s }
    assert training.present?
    assert_equal 2, training['participantCategories'].size
    assert_equal 'Adulte', training['participantCategories'][0]['label']
    assert_equal 45.0, training['participantCategories'][0]['price']
    assert_equal 15, training['participantCategories'][0]['maxSpots']
    assert_equal 25, training['totalCapacity']
    assert_equal 0, training['totalSpotsTaken']
  end

  test 'academy payload includes academy settings' do
    get '/api/v1/academy', as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert body['academySettings'].present?
    assert_equal 10.0, body['academySettings']['volumeDiscountPerSpot']
    assert_equal 30.0, body['academySettings']['volumeDiscountMax']
  end

  test 'training type serialization includes default categories' do
    @type.update!(default_categories: [
      { 'label' => 'Adulte', 'price' => 45.0, 'maxSpots' => 15, 'depositAmount' => 20.0 }
    ])

    get '/api/v1/academy', as: :json
    assert_response :success

    body = JSON.parse(response.body)
    tt = body['trainingTypes'].find { |t| t['id'] == @type.id.to_s }
    assert_equal 1, tt['defaultCategories'].size
    assert_equal 'Adulte', tt['defaultCategories'][0]['label']
  end

  test 'registration serialization includes items' do
    cat = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 15)
    reg = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Test User',
      payment_status: 'pending', registered_at: Time.current, carpooling: 'none'
    )
    Academy::RegistrationItem.create!(
      registration: reg, participant_category: cat,
      quantity: 2, unit_price: 45.0, discount_percent: 10.0
    )

    get '/api/v1/academy', as: :json
    assert_response :success

    body = JSON.parse(response.body)
    registration = body['trainingRegistrations'].find { |r| r['id'] == reg.id.to_s }
    assert registration['items'].present?
    assert_equal 1, registration['items'].size
    assert_equal 2, registration['items'][0]['quantity']
    assert_equal 'Adulte', registration['items'][0]['categoryLabel']
    assert_in_delta 81.0, registration['items'][0]['subtotal'], 0.01
  end

  # ──────────────────────────────────────────────
  # API: Create training with auto-population
  # ──────────────────────────────────────────────

  test 'create training auto-populates categories from training type defaults' do
    @type.update!(default_categories: [
      { 'label' => 'Adulte', 'price' => 45.0, 'maxSpots' => 15, 'depositAmount' => 20.0 },
      { 'label' => 'Enfant', 'price' => 25.0, 'maxSpots' => 10, 'depositAmount' => 0.0 }
    ])

    post '/api/v1/academy/trainings', params: {
      training_type_id: @type.id,
      title: 'New Training'
    }, as: :json
    assert_response :created

    body = JSON.parse(response.body)
    assert_equal 2, body['participantCategories'].size
    assert_equal 'Adulte', body['participantCategories'][0]['label']
    assert_equal 45.0, body['participantCategories'][0]['price']
    assert_equal 15, body['participantCategories'][0]['maxSpots']
    assert_in_delta 20.0, body['participantCategories'][0]['depositAmount'], 0.01
    assert_equal 'Enfant', body['participantCategories'][1]['label']
  end

  test 'create training with explicit categories ignores defaults' do
    @type.update!(default_categories: [
      { 'label' => 'Default', 'price' => 100.0, 'maxSpots' => 20, 'depositAmount' => 0.0 }
    ])

    post '/api/v1/academy/trainings', params: {
      training_type_id: @type.id,
      title: 'Custom Training',
      participant_categories: [
        { label: 'VIP', price: 200.0, max_spots: 5, deposit_amount: 50.0 }
      ]
    }, as: :json
    assert_response :created

    body = JSON.parse(response.body)
    assert_equal 1, body['participantCategories'].size
    assert_equal 'VIP', body['participantCategories'][0]['label']
    assert_equal 200.0, body['participantCategories'][0]['price']
  end

  test 'create training without defaults or explicit categories creates no categories' do
    post '/api/v1/academy/trainings', params: {
      training_type_id: @type.id,
      title: 'Bare Training'
    }, as: :json
    assert_response :created

    body = JSON.parse(response.body)
    assert_equal 0, body['participantCategories'].size
  end

  # ──────────────────────────────────────────────
  # API: Update training with categories CRUD
  # ──────────────────────────────────────────────

  test 'update training creates, updates and soft-deletes categories' do
    cat1 = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 15)
    cat2 = Academy::ParticipantCategory.create!(training: @training, label: 'Enfant', price: 25.0, max_spots: 10)

    patch "/api/v1/academy/trainings/#{@training.id}", params: {
      participant_categories: [
        { id: cat1.id, label: 'Adulte modifié', price: 50.0, max_spots: 20 },
        { id: cat2.id, _destroy: true },
        { label: 'Senior', price: 35.0, max_spots: 8 }
      ]
    }, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    cats = body['participantCategories']
    assert_equal 2, cats.size
    assert_equal 'Adulte modifié', cats.find { |c| c['id'] == cat1.id.to_s }['label']
    assert_equal 50.0, cats.find { |c| c['id'] == cat1.id.to_s }['price']
    assert cats.any? { |c| c['label'] == 'Senior' }

    assert cat2.reload.deleted?
  end

  test 'update training category with registrations prevents destroy' do
    cat = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 15)
    reg = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Test User',
      payment_status: 'pending', registered_at: Time.current, carpooling: 'none'
    )
    Academy::RegistrationItem.create!(registration: reg, participant_category: cat, quantity: 1, unit_price: 45.0)

    patch "/api/v1/academy/trainings/#{@training.id}", params: {
      participant_categories: [
        { id: cat.id, _destroy: true }
      ]
    }, as: :json
    assert_response :unprocessable_entity
  end

  test 'update training changes training type' do
    new_type = Academy::TrainingType.create!(name: 'Atelier pratique', description: 'Hands-on')

    patch "/api/v1/academy/trainings/#{@training.id}", params: {
      training_type_id: new_type.id
    }, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal new_type.id.to_s, body['trainingTypeId']
    assert_equal new_type.id, @training.reload.training_type_id
  end

  # ──────────────────────────────────────────────
  # API: Registration with items
  # ──────────────────────────────────────────────

  test 'create registration with multi-category items' do
    cat_adult = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 100.0, max_spots: 20)
    cat_child = Academy::ParticipantCategory.create!(training: @training, label: 'Enfant', price: 50.0, max_spots: 10)

    post "/api/v1/academy/trainings/#{@training.id}/registrations", params: {
      contact_name: 'Famille Test',
      contact_email: 'famille@test.com',
      carpooling: 'none',
      items: [
        { participant_category_id: cat_adult.id, quantity: 3 },
        { participant_category_id: cat_child.id, quantity: 1 }
      ]
    }, as: :json
    assert_response :created

    body = JSON.parse(response.body)
    assert_equal 2, body['items'].size

    adult_item = body['items'].find { |i| i['categoryLabel'] == 'Adulte' }
    assert_equal 3, adult_item['quantity']
    assert_in_delta 20.0, adult_item['discountPercent'], 0.01
    # 3 × 100 × 0.80 = 240.0
    assert_in_delta 240.0, adult_item['subtotal'], 0.01

    child_item = body['items'].find { |i| i['categoryLabel'] == 'Enfant' }
    assert_equal 1, child_item['quantity']
    assert_in_delta 0.0, child_item['discountPercent'], 0.01
    assert_in_delta 50.0, child_item['subtotal'], 0.01

    # Total payment amount = 240 + 50 = 290
    assert_in_delta 290.0, body['paymentAmount'], 0.01
  end

  test 'create registration without items still works (backward compat)' do
    post "/api/v1/academy/trainings/#{@training.id}/registrations", params: {
      contact_name: 'Simple User',
      carpooling: 'none'
    }, as: :json
    assert_response :created

    body = JSON.parse(response.body)
    assert_equal 0, body['items'].size
  end

  test 'create registration fails when exceeding category capacity' do
    cat = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 100.0, max_spots: 2)

    post "/api/v1/academy/trainings/#{@training.id}/registrations", params: {
      contact_name: 'Too Many',
      carpooling: 'none',
      items: [{ participant_category_id: cat.id, quantity: 5 }]
    }, as: :json
    assert_response :unprocessable_entity
  end

  test 'update registration replaces items and recomputes payment amount' do
    cat_adult = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 100.0, max_spots: 20)
    cat_child = Academy::ParticipantCategory.create!(training: @training, label: 'Enfant', price: 50.0, max_spots: 10)

    # Create registration with 2 adults
    post "/api/v1/academy/trainings/#{@training.id}/registrations", params: {
      contact_name: 'Update Test',
      carpooling: 'none',
      items: [{ participant_category_id: cat_adult.id, quantity: 2 }]
    }, as: :json
    assert_response :created
    reg_id = JSON.parse(response.body)['id']

    # Update: switch to 1 child instead
    patch "/api/v1/academy/registrations/#{reg_id}", params: {
      items: [{ participant_category_id: cat_child.id, quantity: 1 }]
    }, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 1, body['items'].size
    assert_equal 'Enfant', body['items'][0]['categoryLabel']
    assert_equal 1, body['items'][0]['quantity']
    assert_in_delta 50.0, body['paymentAmount'], 0.01

    # Verify old items are gone
    assert_equal 0, cat_adult.spots_taken
    assert_equal 1, cat_child.spots_taken
  end

  # ──────────────────────────────────────────────
  # API: Status validation
  # ──────────────────────────────────────────────

  test 'cannot open registrations without active categories' do
    patch "/api/v1/academy/trainings/#{@training.id}/status", params: { status: 'registrations_open' }, as: :json
    assert_response :unprocessable_entity
  end

  test 'can open registrations with active categories' do
    Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 10)

    patch "/api/v1/academy/trainings/#{@training.id}/status", params: { status: 'registrations_open' }, as: :json
    assert_response :success
  end

  # ──────────────────────────────────────────────
  # API: Settings CRUD
  # ──────────────────────────────────────────────

  test 'get academy settings' do
    get '/api/v1/academy/settings', as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 10.0, body['volumeDiscountPerSpot']
    assert_equal 30.0, body['volumeDiscountMax']
  end

  test 'update academy settings' do
    patch '/api/v1/academy/settings', params: {
      volume_discount_per_spot: 15.0,
      volume_discount_max: 25.0
    }, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 15.0, body['volumeDiscountPerSpot']
    assert_equal 25.0, body['volumeDiscountMax']
  end

  # ──────────────────────────────────────────────
  # API: Training type with default categories
  # ──────────────────────────────────────────────

  test 'update training type with default categories' do
    patch "/api/v1/academy/training-types/#{@type.id}", params: {
      default_categories: [
        { label: 'Adulte', price: 45.0, maxSpots: 15, depositAmount: 20.0 },
        { label: 'Enfant', price: 25.0, maxSpots: 10, depositAmount: 0.0 }
      ]
    }, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 2, body['defaultCategories'].size
  end

  # ──────────────────────────────────────────────
  # API: Reporting uses category-based capacity
  # ──────────────────────────────────────────────

  test 'reporting uses total_capacity for fill rates' do
    Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 20)
    reg = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Test', payment_status: 'paid',
      registered_at: Time.current, carpooling: 'none', amount_paid: 45.0
    )

    get '/api/v1/academy/reporting', as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert body['averageFillRate'] > 0
  end

  # ──────────────────────────────────────────────
  # API Public: training_info with categories
  # ──────────────────────────────────────────────

  test 'public training info returns participant categories with spots' do
    @training.update!(status: 'registrations_open')
    cat_adult = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 100.0, max_spots: 20, deposit_amount: 30.0, position: 0)
    cat_child = Academy::ParticipantCategory.create!(training: @training, label: 'Enfant', price: 50.0, max_spots: 10, deposit_amount: 0.0, position: 1)

    get "/api/v1/public/academy/trainings/#{@training.id}", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 2, body['participantCategories'].size
    assert_equal 'Adulte', body['participantCategories'][0]['label']
    assert_equal 100.0, body['participantCategories'][0]['price']
    assert_equal 20, body['participantCategories'][0]['spotsRemaining']
    assert_in_delta 30.0, body['participantCategories'][0]['depositAmount'], 0.01

    assert body['volumeDiscount'].present?
    assert_equal 10.0, body['volumeDiscount']['perSpot']
    assert_equal 30.0, body['volumeDiscount']['max']
  end

  test 'public training info reflects spots taken in categories' do
    @training.update!(status: 'registrations_open')
    cat = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 100.0, max_spots: 10)

    reg = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Alice',
      payment_status: 'paid', registered_at: Time.current, carpooling: 'none'
    )
    Academy::RegistrationItem.create!(registration: reg, participant_category: cat, quantity: 3, unit_price: 100.0)

    get "/api/v1/public/academy/trainings/#{@training.id}", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 7, body['participantCategories'][0]['spotsRemaining']
  end

  # ──────────────────────────────────────────────
  # Integration: full discount scenario
  # ──────────────────────────────────────────────

  test 'full scenario: multi-category registration with volume discount' do
    setting = Academy::Setting.current  # 10% per spot, 30% max

    cat_adult = Academy::ParticipantCategory.create!(
      training: @training, label: 'Adulte', price: 100.0, max_spots: 20, deposit_amount: 30.0
    )
    cat_child = Academy::ParticipantCategory.create!(
      training: @training, label: 'Enfant', price: 50.0, max_spots: 10, deposit_amount: 0.0
    )

    reg = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Famille Dupont',
      payment_status: 'pending', registered_at: Time.current, carpooling: 'none'
    )

    # 3 adults → discount = min(10 × 2, 30) = 20%
    adult_discount = setting.discount_for_quantity(3)
    assert_in_delta 20.0, adult_discount, 0.01

    adult_item = Academy::RegistrationItem.create!(
      registration: reg, participant_category: cat_adult,
      quantity: 3, unit_price: 100.0, discount_percent: adult_discount
    )
    # 3 × 100 × 0.80 = 240.0
    assert_in_delta 240.0, adult_item.subtotal.to_f, 0.01

    # 1 child → discount = 0%
    child_discount = setting.discount_for_quantity(1)
    assert_equal 0, child_discount

    child_item = Academy::RegistrationItem.create!(
      registration: reg, participant_category: cat_child,
      quantity: 1, unit_price: 50.0, discount_percent: child_discount
    )
    # 1 × 50 × 1.0 = 50.0
    assert_in_delta 50.0, child_item.subtotal.to_f, 0.01

    # Total payment amount
    reg.recompute_payment_amount!
    assert_in_delta 290.0, reg.reload.payment_amount.to_f, 0.01

    # Spots tracking
    assert_equal 3, cat_adult.spots_taken
    assert_equal 17, cat_adult.spots_remaining
    assert_equal 1, cat_child.spots_taken
    assert_equal 9, cat_child.spots_remaining
    assert_equal 4, @training.total_spots_taken
    assert_equal 26, @training.total_spots_remaining
  end
end
