require 'test_helper'

class AcademyManagementTest < ActionDispatch::IntegrationTest
  setup do
    [
      Academy::TrainingAttendance,
      Academy::TrainingExpense,
      Academy::TrainingDocument,
      Academy::TrainingRegistration,
      Academy::TrainingSession,
      Academy::Training,
      Academy::TrainingLocation,
      Academy::TrainingType,
      Academy::IdeaNote
    ].each(&:delete_all)
  end

  test 'academy dashboard returns empty state payload' do
    get '/api/v1/academy', as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 0, body['trainings'].size
    assert_equal 0, body['trainingTypes'].size
    assert_equal 0, body['trainingLocations'].size
  end

  test 'create training from type and manage registrations attendance and reporting' do
    post '/api/v1/academy/training-types', params: {
      name: 'Forêt comestible - initiation',
      description: 'Base Semisto',
      checklist_template: ['Programme validé', 'Salle confirmée'],
      trainer_ids: []
    }, as: :json
    assert_response :created
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/locations', params: {
      name: 'Lieu Test',
      address: 'Rue Test 12',
      capacity: 24,
      has_accommodation: true
    }, as: :json
    assert_response :created
    location_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation pilote',
      price: 210,
      max_participants: 16,
      description: 'Session 1'
    }, as: :json
    assert_response :created
    training_id = JSON.parse(response.body)['id']

    patch "/api/v1/academy/trainings/#{training_id}/status", params: { status: 'registrations_open' }, as: :json
    assert_response :success
    assert_equal 'registrations_open', JSON.parse(response.body)['status']

    post "/api/v1/academy/trainings/#{training_id}/sessions", params: {
      start_date: Date.current.iso8601,
      end_date: Date.current.iso8601,
      location_ids: [location_id],
      trainer_ids: [],
      assistant_ids: [],
      description: 'Jour 1'
    }, as: :json
    assert_response :created
    session_id = JSON.parse(response.body)['id']

    post "/api/v1/academy/trainings/#{training_id}/registrations", params: {
      contact_name: 'Alice Doe',
      contact_email: 'alice@example.com',
      amount_paid: 0,
      payment_status: 'pending'
    }, as: :json
    assert_response :created
    registration_id = JSON.parse(response.body)['id']

    patch "/api/v1/academy/registrations/#{registration_id}/payment-status", params: {
      status: 'paid',
      amount_paid: 210
    }, as: :json
    assert_response :success
    assert_equal 'paid', JSON.parse(response.body)['paymentStatus']

    post '/api/v1/academy/attendance', params: {
      registration_id: registration_id,
      session_id: session_id,
      is_present: true
    }, as: :json
    assert_response :success
    assert_equal true, JSON.parse(response.body)['isPresent']

    post "/api/v1/academy/trainings/#{training_id}/documents", params: {
      name: 'Syllabus',
      document_type: 'pdf',
      url: 'https://example.com/syllabus.pdf'
    }, as: :json
    assert_response :created

    post "/api/v1/academy/trainings/#{training_id}/expenses", params: {
      category: 'location',
      description: 'Location salle',
      amount: 100,
      date: Date.current.iso8601
    }, as: :json
    assert_response :created

    get '/api/v1/academy/reporting', as: :json
    assert_response :success
    reporting = JSON.parse(response.body)
    assert_equal 1, reporting['trainingsCount']
    assert_equal 210.0, reporting['totalRevenue']
    assert_equal 100.0, reporting['totalExpenses']
  end
end
