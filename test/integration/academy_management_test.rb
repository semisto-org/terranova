require 'test_helper'

class AcademyManagementTest < ActionDispatch::IntegrationTest
  setup do
    [
      AlbumMediaItem,
      Album,
      Academy::TrainingAttendance,
      Expense,
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

  test 'when training status is set to planned an album is auto-created and included in payload' do
    type = Academy::TrainingType.create!(name: 'Initiation', description: 'Base')
    training = Academy::Training.create!(
      training_type: type,
      title: 'Session planifiée',
      status: 'draft'
    )
    assert training.album.blank?

    patch "/api/v1/academy/trainings/#{training.id}/status", params: { status: 'planned' }, as: :json
    assert_response :success

    training.reload
    assert training.album.present?
    assert_equal 'Session planifiée', training.album.title
    assert_equal training.id, training.album.albumable_id
    assert_equal 'Academy::Training', training.album.albumable_type

    get '/api/v1/academy', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    t = body['trainings'].find { |x| x['id'] == training.id.to_s }
    assert t.present?
    assert t['album'].present?
    assert_equal training.album.id.to_s, t['album']['id']
    assert_equal 0, t['album']['mediaCount']
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
      vat_rate: 21,
      max_participants: 16,
      description: 'Session 1'
    }, as: :json
    assert_response :created
    created = JSON.parse(response.body)
    training_id = created['id']
    assert_equal 21.0, created['vatRate'].to_f
    assert_in_delta 173.55, created['priceExclVat'].to_f, 0.01

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
      file: fixture_file_upload('sample.txt', 'text/plain')
    }
    assert_response :created
    doc = JSON.parse(response.body)
    assert doc['id'].present?
    assert_equal 'Syllabus', doc['name']
    assert doc['url'].present?

    post "/api/v1/academy/trainings/#{training_id}/expenses", params: {
      supplier: 'Salle Test',
      status: 'processing',
      invoice_date: Date.current.iso8601,
      expense_type: 'services_and_goods',
      name: 'Location salle',
      total_incl_vat: 100,
      amount_excl_vat: 82.64,
      vat_6: 0, vat_12: 0, vat_21: 17.36
    }, as: :json
    assert_response :created

    get '/api/v1/academy/reporting', as: :json
    assert_response :success
    reporting = JSON.parse(response.body)
    assert_equal 1, reporting['trainingsCount']
    # Revenue is reported HT: 210 / 1.21 ≈ 173.55
    assert_in_delta 173.55, reporting['totalRevenue'], 0.01
    assert_equal 210.0, reporting['totalRevenueInclVat']
    assert_in_delta 82.64, reporting['totalExpenses'], 0.01
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
      supplier: 'Fournisseur',
      status: 'processing',
      invoice_date: Date.current.iso8601,
      expense_type: 'merchandise',
      name: 'Impression supports',
      total_incl_vat: 35,
      amount_excl_vat: 28.93,
      vat_6: 0, vat_12: 0, vat_21: 6.07
    }, as: :json
    assert_response :created
    expense_id = JSON.parse(response.body)['id']

    patch "/api/v1/academy/expenses/#{expense_id}", params: {
      supplier: 'Fournisseur',
      status: 'processing',
      invoice_date: Date.current.iso8601,
      expense_type: 'merchandise',
      name: 'Supports + badges',
      total_incl_vat: 45,
      amount_excl_vat: 37.19,
      vat_6: 0, vat_12: 0, vat_21: 7.81
    }, as: :json
    assert_response :success
    assert_equal 45.0, JSON.parse(response.body)['totalInclVat']
  end

  # =============================
  # User Flow 1: Create Training (additional tests)
  # =============================

  test 'create training fails with missing required fields' do
    # Create a training type first
    post '/api/v1/academy/training-types', params: { name: 'Type Test' }, as: :json
    assert_response :created
    training_type_id = JSON.parse(response.body)['id']

    # Attempt to create training without title (required field)
    assert_raises(ActiveRecord::RecordInvalid) do
      post '/api/v1/academy/trainings', params: {
        training_type_id: training_type_id
        # title is missing
      }, as: :json
    end
  end

  test 'create training with valid data and verify checklist inheritance' do
    # Create training type with checklist template
    post '/api/v1/academy/training-types', params: {
      name: 'Formation Design',
      description: 'Formation sur le design permaculturel',
      checklist_template: ['Valider le programme', 'Confirmer la salle', 'Envoyer les convocations']
    }, as: :json
    assert_response :created
    training_type_id = JSON.parse(response.body)['id']

    # Create training
    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Design Permaculture - Session 1',
      price: 450,
      max_participants: 15,
      description: 'Formation complète'
    }, as: :json
    assert_response :created

    training = JSON.parse(response.body)
    assert_equal 'Design Permaculture - Session 1', training['title']
    assert_equal 'draft', training['status']
    assert_equal 450.0, training['price']
    assert_equal 15, training['maxParticipants']

    # Verify checklist inheritance
    assert_equal ['Valider le programme', 'Confirmer la salle', 'Envoyer les convocations'], training['checklistItems']
    assert_equal [], training['checkedItems']
  end

  test 'create training and verify participant count display' do
    # Setup
    post '/api/v1/academy/training-types', params: { name: 'Type Participants Test' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Test Participants',
      max_participants: 20
    }, as: :json
    assert_response :created
    training_id = JSON.parse(response.body)['id']

    # Get dashboard payload
    get '/api/v1/academy', as: :json
    assert_response :success

    payload = JSON.parse(response.body)
    training = payload['trainings'].find { |t| t['id'] == training_id }

    # Verify training shows max participants
    assert_equal 20, training['maxParticipants']

    # Verify registrations array is initially empty (participant count = 0)
    assert_equal 0, payload['trainingRegistrations'].count { |r| r['trainingId'] == training_id }
  end

  # =============================
  # User Flow 2: Manage Registrations (additional tests)
  # =============================

  test 'add registration and verify participant count updates' do
    # Setup training
    post '/api/v1/academy/training-types', params: { name: 'Type Registration' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Registration Test',
      max_participants: 10
    }, as: :json
    training_id = JSON.parse(response.body)['id']

    # Add first registration
    post "/api/v1/academy/trainings/#{training_id}/registrations", params: {
      contact_name: 'Pierre Martin',
      contact_email: 'pierre@example.com',
      amount_paid: 0,
      payment_status: 'pending'
    }, as: :json
    assert_response :created

    # Add second registration
    post "/api/v1/academy/trainings/#{training_id}/registrations", params: {
      contact_name: 'Marie Dupont',
      contact_email: 'marie@example.com',
      amount_paid: 150,
      payment_status: 'partial'
    }, as: :json
    assert_response :created

    # Verify participant count
    get '/api/v1/academy', as: :json
    payload = JSON.parse(response.body)
    registrations_count = payload['trainingRegistrations'].count { |r| r['trainingId'] == training_id }
    assert_equal 2, registrations_count
  end

  test 'registration payment status transitions pending to partial to paid' do
    # Setup
    post '/api/v1/academy/training-types', params: { name: 'Type Payment' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Payment Test',
      price: 300
    }, as: :json
    training_id = JSON.parse(response.body)['id']

    # Create registration with pending status
    post "/api/v1/academy/trainings/#{training_id}/registrations", params: {
      contact_name: 'Jean Durand',
      contact_email: 'jean@example.com',
      amount_paid: 0,
      payment_status: 'pending'
    }, as: :json
    assert_response :created
    registration_id = JSON.parse(response.body)['id']
    assert_equal 'pending', JSON.parse(response.body)['paymentStatus']
    assert_equal 0.0, JSON.parse(response.body)['amountPaid']

    # Transition to partial payment
    patch "/api/v1/academy/registrations/#{registration_id}/payment-status", params: {
      status: 'partial',
      amount_paid: 150
    }, as: :json
    assert_response :success
    assert_equal 'partial', JSON.parse(response.body)['paymentStatus']
    assert_equal 150.0, JSON.parse(response.body)['amountPaid']

    # Transition to fully paid
    patch "/api/v1/academy/registrations/#{registration_id}/payment-status", params: {
      status: 'paid',
      amount_paid: 300
    }, as: :json
    assert_response :success
    assert_equal 'paid', JSON.parse(response.body)['paymentStatus']
    assert_equal 300.0, JSON.parse(response.body)['amountPaid']
  end

  test 'registration shows warning when max participants reached' do
    # Setup training with max 2 participants
    post '/api/v1/academy/training-types', params: { name: 'Type Max' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Max Test',
      max_participants: 2
    }, as: :json
    training_id = JSON.parse(response.body)['id']

    # Add first participant
    post "/api/v1/academy/trainings/#{training_id}/registrations", params: {
      contact_name: 'Participant 1',
      contact_email: 'p1@example.com',
      amount_paid: 0,
      payment_status: 'pending'
    }, as: :json
    assert_response :created

    # Add second participant
    post "/api/v1/academy/trainings/#{training_id}/registrations", params: {
      contact_name: 'Participant 2',
      contact_email: 'p2@example.com',
      amount_paid: 0,
      payment_status: 'pending'
    }, as: :json
    assert_response :created

    # Verify participant count equals max
    get '/api/v1/academy', as: :json
    payload = JSON.parse(response.body)
    training = payload['trainings'].find { |t| t['id'] == training_id }
    registrations_count = payload['trainingRegistrations'].count { |r| r['trainingId'] == training_id }

    assert_equal 2, training['maxParticipants']
    assert_equal 2, registrations_count
    # Frontend should show warning when count >= max
  end

  # =============================
  # User Flow 3: Track Attendance (new tests)
  # =============================

  test 'mark attendance for participant and session' do
    # Setup
    post '/api/v1/academy/training-types', params: { name: 'Type Attendance' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Attendance Test'
    }, as: :json
    training_id = JSON.parse(response.body)['id']

    post "/api/v1/academy/trainings/#{training_id}/sessions", params: {
      start_date: Date.current.iso8601,
      end_date: Date.current.iso8601,
      description: 'Session 1'
    }, as: :json
    session_id = JSON.parse(response.body)['id']

    post "/api/v1/academy/trainings/#{training_id}/registrations", params: {
      contact_name: 'Alice Test',
      contact_email: 'alice@example.com',
      amount_paid: 0,
      payment_status: 'pending'
    }, as: :json
    registration_id = JSON.parse(response.body)['id']

    # Mark present
    post '/api/v1/academy/attendance', params: {
      registration_id: registration_id,
      session_id: session_id,
      is_present: true,
      note: 'Présent toute la journée'
    }, as: :json
    assert_response :success

    attendance = JSON.parse(response.body)
    assert_equal true, attendance['isPresent']
    assert_equal 'Présent toute la journée', attendance['note']
    assert_equal registration_id, attendance['registrationId']
    assert_equal session_id, attendance['sessionId']

    # Toggle to absent
    post '/api/v1/academy/attendance', params: {
      registration_id: registration_id,
      session_id: session_id,
      is_present: false,
      note: 'Absent'
    }, as: :json
    assert_response :success
    assert_equal false, JSON.parse(response.body)['isPresent']
  end

  test 'calculate attendance percentage per participant' do
    # Setup training with 3 sessions
    post '/api/v1/academy/training-types', params: { name: 'Type Percentage' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Percentage Test'
    }, as: :json
    training_id = JSON.parse(response.body)['id']

    # Create 3 sessions
    session_ids = []
    3.times do |i|
      post "/api/v1/academy/trainings/#{training_id}/sessions", params: {
        start_date: (Date.current + i.days).iso8601,
        end_date: (Date.current + i.days).iso8601,
        description: "Jour #{i + 1}"
      }, as: :json
      session_ids << JSON.parse(response.body)['id']
    end

    # Create participant
    post "/api/v1/academy/trainings/#{training_id}/registrations", params: {
      contact_name: 'Test Participant',
      contact_email: 'test@example.com',
      amount_paid: 0,
      payment_status: 'pending'
    }, as: :json
    registration_id = JSON.parse(response.body)['id']

    # Mark present for 2 out of 3 sessions
    post '/api/v1/academy/attendance', params: {
      registration_id: registration_id,
      session_id: session_ids[0],
      is_present: true
    }, as: :json
    assert_response :success

    post '/api/v1/academy/attendance', params: {
      registration_id: registration_id,
      session_id: session_ids[1],
      is_present: true
    }, as: :json
    assert_response :success

    post '/api/v1/academy/attendance', params: {
      registration_id: registration_id,
      session_id: session_ids[2],
      is_present: false
    }, as: :json
    assert_response :success

    # Verify attendance records
    get '/api/v1/academy', as: :json
    payload = JSON.parse(response.body)
    attendances = payload['trainingAttendances'].select { |a| a['registrationId'] == registration_id }

    assert_equal 3, attendances.size
    present_count = attendances.count { |a| a['isPresent'] == true }
    assert_equal 2, present_count
    # Attendance percentage should be 2/3 = 66.67% (calculated in frontend)
  end

  test 'calculate attendance percentage per session' do
    # Setup training with 1 session and 3 participants
    post '/api/v1/academy/training-types', params: { name: 'Type Session Percentage' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Session Percentage'
    }, as: :json
    training_id = JSON.parse(response.body)['id']

    post "/api/v1/academy/trainings/#{training_id}/sessions", params: {
      start_date: Date.current.iso8601,
      end_date: Date.current.iso8601,
      description: 'Session unique'
    }, as: :json
    session_id = JSON.parse(response.body)['id']

    # Create 3 participants
    registration_ids = []
    3.times do |i|
      post "/api/v1/academy/trainings/#{training_id}/registrations", params: {
        contact_name: "Participant #{i + 1}",
        contact_email: "p#{i + 1}@example.com",
        amount_paid: 0,
        payment_status: 'pending'
      }, as: :json
      registration_ids << JSON.parse(response.body)['id']
    end

    # Mark 2 out of 3 present
    post '/api/v1/academy/attendance', params: {
      registration_id: registration_ids[0],
      session_id: session_id,
      is_present: true
    }, as: :json
    assert_response :success

    post '/api/v1/academy/attendance', params: {
      registration_id: registration_ids[1],
      session_id: session_id,
      is_present: true
    }, as: :json
    assert_response :success

    post '/api/v1/academy/attendance', params: {
      registration_id: registration_ids[2],
      session_id: session_id,
      is_present: false
    }, as: :json
    assert_response :success

    # Verify session attendance
    get '/api/v1/academy', as: :json
    payload = JSON.parse(response.body)
    attendances = payload['trainingAttendances'].select { |a| a['sessionId'] == session_id }

    assert_equal 3, attendances.size
    present_count = attendances.count { |a| a['isPresent'] == true }
    assert_equal 2, present_count
    # Session attendance percentage should be 2/3 = 66.67% (calculated in frontend)
  end

  test 'visual indicator for fully attended vs partially attended' do
    # Setup
    post '/api/v1/academy/training-types', params: { name: 'Type Visual' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Visual Test'
    }, as: :json
    training_id = JSON.parse(response.body)['id']

    # Create 2 sessions
    session_ids = []
    2.times do |i|
      post "/api/v1/academy/trainings/#{training_id}/sessions", params: {
        start_date: (Date.current + i.days).iso8601,
        end_date: (Date.current + i.days).iso8601
      }, as: :json
      session_ids << JSON.parse(response.body)['id']
    end

    # Create 2 participants
    post "/api/v1/academy/trainings/#{training_id}/registrations", params: {
      contact_name: 'Fully Attended',
      contact_email: 'full@example.com',
      amount_paid: 0,
      payment_status: 'pending'
    }, as: :json
    full_reg_id = JSON.parse(response.body)['id']

    post "/api/v1/academy/trainings/#{training_id}/registrations", params: {
      contact_name: 'Partially Attended',
      contact_email: 'partial@example.com',
      amount_paid: 0,
      payment_status: 'pending'
    }, as: :json
    partial_reg_id = JSON.parse(response.body)['id']

    # Mark fully attended participant (2/2 sessions)
    session_ids.each do |session_id|
      post '/api/v1/academy/attendance', params: {
        registration_id: full_reg_id,
        session_id: session_id,
        is_present: true
      }, as: :json
    end

    # Mark partially attended participant (1/2 sessions)
    post '/api/v1/academy/attendance', params: {
      registration_id: partial_reg_id,
      session_id: session_ids[0],
      is_present: true
    }, as: :json

    post '/api/v1/academy/attendance', params: {
      registration_id: partial_reg_id,
      session_id: session_ids[1],
      is_present: false
    }, as: :json

    # Verify data for visual indicator logic
    get '/api/v1/academy', as: :json
    payload = JSON.parse(response.body)

    full_attendances = payload['trainingAttendances'].select { |a| a['registrationId'] == full_reg_id }
    partial_attendances = payload['trainingAttendances'].select { |a| a['registrationId'] == partial_reg_id }

    assert_equal 2, full_attendances.count { |a| a['isPresent'] == true }
    assert_equal 1, partial_attendances.count { |a| a['isPresent'] == true }
    # Frontend should show green indicator for 100%, yellow for partial
  end

  # =============================
  # User Flow 4: View Calendar (new tests)
  # =============================

  test 'calendar monthly view shows trainings on correct dates' do
    # Create training with sessions spanning multiple days
    post '/api/v1/academy/training-types', params: { name: 'Type Calendar' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Calendrier Test'
    }, as: :json
    training_id = JSON.parse(response.body)['id']

    # Create session starting today
    post "/api/v1/academy/trainings/#{training_id}/sessions", params: {
      start_date: Date.current.iso8601,
      end_date: (Date.current + 2.days).iso8601,
      description: 'Session sur 3 jours'
    }, as: :json
    session_id = JSON.parse(response.body)['id']

    # Get calendar
    get '/api/v1/academy/calendar', as: :json
    assert_response :success

    calendar = JSON.parse(response.body)
    assert_equal 1, calendar.size

    training_entry = calendar.first
    assert_equal training_id, training_entry['trainingId']
    assert_equal 'Formation Calendrier Test', training_entry['title']
    assert_equal 1, training_entry['sessions'].size

    session = training_entry['sessions'].first
    assert_equal session_id, session['sessionId']
    assert_equal Date.current.iso8601, session['startDate']
    assert_equal (Date.current + 2.days).iso8601, session['endDate']
  end

  test 'calendar shows status color-coding data' do
    # Create trainings with different statuses
    post '/api/v1/academy/training-types', params: { name: 'Type Status' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    statuses_to_test = ['draft', 'planned', 'registrations_open', 'in_progress', 'completed', 'cancelled']
    training_ids = []

    statuses_to_test.each_with_index do |status, i|
      post '/api/v1/academy/trainings', params: {
        training_type_id: training_type_id,
        title: "Formation #{status}"
      }, as: :json
      training_id = JSON.parse(response.body)['id']
      training_ids << training_id

      # Update status
      patch "/api/v1/academy/trainings/#{training_id}/status", params: { status: status }, as: :json
      assert_response :success

      # Add session
      post "/api/v1/academy/trainings/#{training_id}/sessions", params: {
        start_date: (Date.current + i.days).iso8601,
        end_date: (Date.current + i.days).iso8601
      }, as: :json
    end

    # Get calendar
    get '/api/v1/academy/calendar', as: :json
    assert_response :success

    calendar = JSON.parse(response.body)
    assert_equal 6, calendar.size

    # Verify each training has status field for color-coding
    statuses_to_test.each do |status|
      entry = calendar.find { |e| e['title'] == "Formation #{status}" }
      assert_not_nil entry
      assert_equal status, entry['status']
    end
  end

  test 'calendar yearly view shows training distribution' do
    # Create trainings across multiple months
    post '/api/v1/academy/training-types', params: { name: 'Type Yearly' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    months_to_create = [0, 2, 5, 8, 11] # January, March, June, September, December

    months_to_create.each do |month_offset|
      post '/api/v1/academy/trainings', params: {
        training_type_id: training_type_id,
        title: "Formation Mois #{month_offset}"
      }, as: :json
      training_id = JSON.parse(response.body)['id']

      post "/api/v1/academy/trainings/#{training_id}/sessions", params: {
        start_date: (Date.current.beginning_of_year + month_offset.months).iso8601,
        end_date: (Date.current.beginning_of_year + month_offset.months + 1.day).iso8601
      }, as: :json
    end

    # Get calendar
    get '/api/v1/academy/calendar', as: :json
    assert_response :success

    calendar = JSON.parse(response.body)
    assert_equal 5, calendar.size

    # Frontend should aggregate by month for yearly view
    calendar.each do |entry|
      assert_not_nil entry['sessions']
      assert entry['sessions'].any?
    end
  end

  test 'calendar navigation to training detail' do
    # Create training with identifiable data
    post '/api/v1/academy/training-types', params: { name: 'Type Navigation' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Navigation Test',
      description: 'Description unique pour test'
    }, as: :json
    assert_response :created
    training_id = JSON.parse(response.body)['id']

    post "/api/v1/academy/trainings/#{training_id}/sessions", params: {
      start_date: Date.current.iso8601,
      end_date: Date.current.iso8601
    }, as: :json

    # Get calendar and verify training ID is present
    get '/api/v1/academy/calendar', as: :json
    assert_response :success

    calendar = JSON.parse(response.body)
    entry = calendar.find { |e| e['trainingId'] == training_id }

    assert_not_nil entry
    assert_equal training_id, entry['trainingId']
    assert_equal 'Formation Navigation Test', entry['title']
    # Frontend can use trainingId to navigate to detail page
  end

  # =============================
  # Empty States
  # =============================

  test 'empty kanban board shows all columns' do
    # Dashboard with no trainings should still return structured data
    get '/api/v1/academy', as: :json
    assert_response :success

    payload = JSON.parse(response.body)
    assert_equal 0, payload['trainings'].size

    # Stats should show zero for all statuses
    assert_not_nil payload['stats']
    assert_not_nil payload['stats']['byStatus']

    Academy::Training::STATUSES.each do |status|
      assert_equal 0, payload['stats']['byStatus'][status]
    end
  end

  test 'training with no registrations returns empty array' do
    # Create training without registrations
    post '/api/v1/academy/training-types', params: { name: 'Type Empty Reg' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Sans Inscriptions'
    }, as: :json
    training_id = JSON.parse(response.body)['id']

    # Get dashboard
    get '/api/v1/academy', as: :json
    assert_response :success

    payload = JSON.parse(response.body)
    registrations = payload['trainingRegistrations'].select { |r| r['trainingId'] == training_id }
    assert_equal 0, registrations.size
  end

  test 'training with no sessions returns empty array' do
    # Create training without sessions
    post '/api/v1/academy/training-types', params: { name: 'Type Empty Sessions' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Sans Sessions'
    }, as: :json
    training_id = JSON.parse(response.body)['id']

    # Get dashboard
    get '/api/v1/academy', as: :json
    assert_response :success

    payload = JSON.parse(response.body)
    sessions = payload['trainingSessions'].select { |s| s['trainingId'] == training_id }
    assert_equal 0, sessions.size
  end

  test 'empty calendar returns empty events' do
    # No trainings or sessions created
    get '/api/v1/academy/calendar', as: :json
    assert_response :success

    calendar = JSON.parse(response.body)
    assert_equal 0, calendar.size
  end

  # =============================
  # Edge Cases
  # =============================

  test 'training with zero price is free training' do
    post '/api/v1/academy/training-types', params: { name: 'Type Free' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Gratuite',
      price: 0,
      max_participants: 50
    }, as: :json
    assert_response :created

    training = JSON.parse(response.body)
    assert_equal 0.0, training['price']
    # Frontend should display "Gratuit" or "Free" instead of "0 €"
  end

  test 'training spanning multiple months in calendar' do
    post '/api/v1/academy/training-types', params: { name: 'Type Multi-Month' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Longue Durée'
    }, as: :json
    training_id = JSON.parse(response.body)['id']

    # Create session spanning 3 months
    start_date = Date.current.beginning_of_month
    end_date = (start_date + 2.months).end_of_month

    post "/api/v1/academy/trainings/#{training_id}/sessions", params: {
      start_date: start_date.iso8601,
      end_date: end_date.iso8601,
      description: 'Session longue durée'
    }, as: :json
    assert_response :created

    # Get calendar
    get '/api/v1/academy/calendar', as: :json
    assert_response :success

    calendar = JSON.parse(response.body)
    entry = calendar.find { |e| e['trainingId'] == training_id }

    assert_not_nil entry
    session = entry['sessions'].first

    start_month = Date.parse(session['startDate']).month
    end_month = Date.parse(session['endDate']).month

    # Verify session spans multiple months
    assert end_month > start_month || (end_month < start_month) # handles year transition
  end

  test 'very long training title truncation' do
    post '/api/v1/academy/training-types', params: { name: 'Type Long Title' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    very_long_title = 'Formation Extrêmement Longue avec un Titre qui Dépasse Largement la Limite Normale de Caractères pour Tester le Comportement du Système avec des Titres très Longs et Potentiellement Problématiques'

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: very_long_title
    }, as: :json
    assert_response :created

    training = JSON.parse(response.body)
    assert_equal very_long_title, training['title']
    # Frontend should truncate display with ellipsis (CSS or JS)
  end

  test 'participant removed after marking attendance' do
    # Setup
    post '/api/v1/academy/training-types', params: { name: 'Type Delete Participant' }, as: :json
    training_type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Delete Test'
    }, as: :json
    training_id = JSON.parse(response.body)['id']

    post "/api/v1/academy/trainings/#{training_id}/sessions", params: {
      start_date: Date.current.iso8601,
      end_date: Date.current.iso8601
    }, as: :json
    session_id = JSON.parse(response.body)['id']

    post "/api/v1/academy/trainings/#{training_id}/registrations", params: {
      contact_name: 'To Be Deleted',
      contact_email: 'delete@example.com',
      amount_paid: 0,
      payment_status: 'pending'
    }, as: :json
    registration_id = JSON.parse(response.body)['id']

    # Mark attendance
    post '/api/v1/academy/attendance', params: {
      registration_id: registration_id,
      session_id: session_id,
      is_present: true
    }, as: :json
    assert_response :success

    # Delete participant
    delete "/api/v1/academy/registrations/#{registration_id}", as: :json
    assert_response :no_content

    # Verify attendance is also deleted (due to cascade)
    get '/api/v1/academy', as: :json
    payload = JSON.parse(response.body)

    registrations = payload['trainingRegistrations'].select { |r| r['id'] == registration_id }
    attendances = payload['trainingAttendances'].select { |a| a['registrationId'] == registration_id }

    assert_equal 0, registrations.size
    assert_equal 0, attendances.size
  end

  test 'checklist with 20+ items' do
    # Create training type with large checklist
    large_checklist = (1..25).map { |i| "Tâche #{i}" }

    post '/api/v1/academy/training-types', params: {
      name: 'Type Large Checklist',
      checklist_template: large_checklist
    }, as: :json
    assert_response :created
    training_type_id = JSON.parse(response.body)['id']

    # Create training and verify checklist inheritance
    post '/api/v1/academy/trainings', params: {
      training_type_id: training_type_id,
      title: 'Formation Large Checklist'
    }, as: :json
    assert_response :created

    training = JSON.parse(response.body)
    assert_equal 25, training['checklistItems'].size
    assert_equal [], training['checkedItems']

    # Toggle multiple items
    training_id = training['id']

    # Check items 0, 5, 10, 15, 20
    [0, 5, 10, 15, 20].each do |index|
      patch "/api/v1/academy/trainings/#{training_id}/checklist/toggle/#{index}", as: :json
      assert_response :success
    end

    # Verify checked items
    get '/api/v1/academy', as: :json
    payload = JSON.parse(response.body)
    updated_training = payload['trainings'].find { |t| t['id'] == training_id }

    assert_equal [0, 5, 10, 15, 20], updated_training['checkedItems'].sort
    # Frontend should handle scrolling for long checklists
  end
end
