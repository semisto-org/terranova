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

  test 'checklist idea notes and calendar endpoints work' do
    post '/api/v1/academy/training-types', params: {
      name: 'Design Session',
      checklist_template: ['Checklist A']
    }, as: :json
    assert_response :created
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation checklist'
    }, as: :json
    assert_response :created
    training_id = JSON.parse(response.body)['id']

    patch "/api/v1/academy/trainings/#{training_id}/checklist/toggle/0", as: :json
    assert_response :success
    assert_equal [0], JSON.parse(response.body)['checkedItems']

    post "/api/v1/academy/trainings/#{training_id}/checklist", params: { item: 'Checklist B' }, as: :json
    assert_response :success
    assert_equal 2, JSON.parse(response.body)['checklistItems'].size

    delete "/api/v1/academy/trainings/#{training_id}/checklist/0", as: :json
    assert_response :success
    assert_equal 1, JSON.parse(response.body)['checklistItems'].size

    post "/api/v1/academy/trainings/#{training_id}/sessions", params: {
      start_date: Date.current.iso8601,
      end_date: (Date.current + 1.day).iso8601
    }, as: :json
    assert_response :created

    get '/api/v1/academy/calendar', as: :json
    assert_response :success
    calendar = JSON.parse(response.body)
    assert_equal 1, calendar.size
    assert_equal training_id, calendar.first['trainingId']

    post '/api/v1/academy/idea-notes', params: {
      category: 'subject',
      title: 'Nouvelle idée',
      content: 'Atelier sol vivant',
      tags: ['sol', 'atelier']
    }, as: :json
    assert_response :created
    note_id = JSON.parse(response.body)['id']

    patch "/api/v1/academy/idea-notes/#{note_id}", params: {
      category: 'subject',
      title: 'Idée mise à jour',
      content: 'Contenu ajusté',
      tags: ['atelier']
    }, as: :json
    assert_response :success
    assert_equal 'Idée mise à jour', JSON.parse(response.body)['title']

    delete "/api/v1/academy/idea-notes/#{note_id}", as: :json
    assert_response :no_content
  end

  test 'update endpoints for core academy entities work' do
    post '/api/v1/academy/training-types', params: { name: 'Type A', description: 'v1' }, as: :json
    assert_response :created
    training_type_id = JSON.parse(response.body)['id']

    patch "/api/v1/academy/training-types/#{training_type_id}", params: { name: 'Type A+', description: 'v2' }, as: :json
    assert_response :success
    assert_equal 'Type A+', JSON.parse(response.body)['name']

    post '/api/v1/academy/locations', params: { name: 'Lieu A', address: 'Rue 1', capacity: 10 }, as: :json
    assert_response :created
    location_id = JSON.parse(response.body)['id']

    patch "/api/v1/academy/locations/#{location_id}", params: { name: 'Lieu A+', address: 'Rue 2', capacity: 12 }, as: :json
    assert_response :success
    assert_equal 'Lieu A+', JSON.parse(response.body)['name']
    assert_equal 12, JSON.parse(response.body)['capacity']

    post '/api/v1/academy/trainings', params: { training_type_id: training_type_id, title: 'Formation A', price: 150, max_participants: 10 }, as: :json
    assert_response :created
    training_id = JSON.parse(response.body)['id']

    patch "/api/v1/academy/trainings/#{training_id}", params: { title: 'Formation A+', price: 180, max_participants: 14 }, as: :json
    assert_response :success
    training = JSON.parse(response.body)
    assert_equal 'Formation A+', training['title']
    assert_equal 180.0, training['price']

    post "/api/v1/academy/trainings/#{training_id}/sessions", params: {
      start_date: Date.current.iso8601,
      end_date: Date.current.iso8601,
      location_ids: [location_id]
    }, as: :json
    assert_response :created
    session_id = JSON.parse(response.body)['id']

    patch "/api/v1/academy/sessions/#{session_id}", params: {
      start_date: (Date.current + 1.day).iso8601,
      end_date: (Date.current + 1.day).iso8601,
      location_ids: [location_id],
      trainer_ids: [],
      assistant_ids: []
    }, as: :json
    assert_response :success
    assert_equal (Date.current + 1.day).iso8601, JSON.parse(response.body)['startDate']

    post "/api/v1/academy/trainings/#{training_id}/registrations", params: {
      contact_name: 'Bob',
      contact_email: 'bob@example.com',
      amount_paid: 0,
      payment_status: 'pending'
    }, as: :json
    assert_response :created
    registration_id = JSON.parse(response.body)['id']

    patch "/api/v1/academy/registrations/#{registration_id}", params: {
      contact_name: 'Bob Martin',
      contact_email: 'bob.martin@example.com',
      amount_paid: 50,
      payment_status: 'partial',
      internal_note: 'Acompte reçu'
    }, as: :json
    assert_response :success
    registration = JSON.parse(response.body)
    assert_equal 'Bob Martin', registration['contactName']
    assert_equal 'partial', registration['paymentStatus']

    post "/api/v1/academy/trainings/#{training_id}/expenses", params: {
      category: 'material',
      description: 'Impression supports',
      amount: 35,
      date: Date.current.iso8601
    }, as: :json
    assert_response :created
    expense_id = JSON.parse(response.body)['id']

    patch "/api/v1/academy/expenses/#{expense_id}", params: {
      category: 'material',
      description: 'Supports + badges',
      amount: 45,
      date: Date.current.iso8601
    }, as: :json
    assert_response :success
    assert_equal 45.0, JSON.parse(response.body)['amount']
  end
end
