require 'test_helper'

class MySemistoTest < ActionDispatch::IntegrationTest
  setup do
    [
      Academy::TrainingAttendance,
      Academy::TrainingDocument,
      Academy::TrainingRegistration,
      Academy::TrainingSession,
      Academy::Training,
      Academy::TrainingType,
      ContactTag,
      Contact
    ].each(&:delete_all)

    @contact = Contact.create!(
      contact_type: "person",
      name: "Marie Dupont",
      email: "marie@example.com"
    )

    @training_type = Academy::TrainingType.create!(name: "Initiation", description: "Base")
    @training = Academy::Training.create!(
      training_type: @training_type,
      title: "Forêt comestible 101",
      status: "planned",
      description: "Apprenez les bases"
    )

    @session = Academy::TrainingSession.create!(
      training: @training,
      start_date: 2.weeks.from_now,
      end_date: 2.weeks.from_now + 2.days,
      topic: "Introduction"
    )

    @registration = Academy::TrainingRegistration.create!(
      training: @training,
      contact: @contact,
      contact_name: "Marie Dupont",
      contact_email: "marie@example.com",
      payment_status: "paid",
      registered_at: 1.week.ago
    )
  end

  # ── Auth: magic link request ──

  test "POST /api/v1/my/auth/request-link with known email returns 200" do
    post "/api/v1/my/auth/request-link", params: { email: "marie@example.com" }, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal "ok", body["status"]
  end

  test "POST /api/v1/my/auth/request-link with unknown email returns 200 (anti-enumeration)" do
    post "/api/v1/my/auth/request-link", params: { email: "nobody@example.com" }, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal "ok", body["status"]
  end

  test "GET /api/v1/my/auth/verify with valid token creates session and redirects" do
    token = Rails.application.message_verifier(:contact_login).generate(
      { contact_id: @contact.id },
      purpose: :contact_login,
      expires_in: 24.hours
    )

    get "/api/v1/my/auth/verify", params: { token: token }
    assert_redirected_to "/my"
  end

  test "GET /api/v1/my/auth/verify with expired token redirects to login" do
    token = Rails.application.message_verifier(:contact_login).generate(
      { contact_id: @contact.id },
      purpose: :contact_login,
      expires_in: 0.seconds
    )
    sleep 0.1

    get "/api/v1/my/auth/verify", params: { token: token }
    assert_redirected_to "/my/login"
  end

  test "GET /api/v1/my/auth/verify with garbage token redirects to login" do
    get "/api/v1/my/auth/verify", params: { token: "garbage-token-xyz" }
    assert_redirected_to "/my/login"
  end

  # ── Academy API ──

  test "GET /api/v1/my/academy authenticated returns contact trainings" do
    get "/api/v1/my/academy", as: :json, headers: auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body["trainings"].length
    assert_equal @training.id.to_s, body["trainings"][0]["id"]
  end

  test "GET /api/v1/my/academy unauthenticated returns 401" do
    get "/api/v1/my/academy", as: :json
    assert_response :unauthorized
  end

  test "GET /api/v1/my/academy/:id returns training detail with documents" do
    doc = Academy::TrainingDocument.create!(
      training: @training,
      name: "Support de cours",
      url: "https://example.com/doc.pdf",
      uploaded_at: Time.current
    )

    get "/api/v1/my/academy/#{@training.id}", as: :json, headers: auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal @training.id.to_s, body["id"]
    assert_equal 1, body["documents"].length
    assert_equal "Support de cours", body["documents"][0]["name"]
  end

  test "GET /api/v1/my/academy/:id for unrelated training returns 404" do
    other_training = Academy::Training.create!(
      training_type: @training_type,
      title: "Autre formation",
      status: "draft"
    )

    get "/api/v1/my/academy/#{other_training.id}", as: :json, headers: auth_headers
    assert_response :not_found
  end

  test "GET /api/v1/my/academy finds registrations by email match" do
    # Create a registration with email but no contact_id link
    email_contact = Contact.create!(
      contact_type: "person",
      name: "Jean Test",
      email: "jean@example.com"
    )

    other_training = Academy::Training.create!(
      training_type: @training_type,
      title: "Formation email",
      status: "planned"
    )

    Academy::TrainingRegistration.create!(
      training: other_training,
      contact_name: "Jean Test",
      contact_email: "jean@example.com",
      payment_status: "pending",
      registered_at: Time.current
    )

    # Auth as jean
    token = Rails.application.message_verifier(:contact_login).generate(
      { contact_id: email_contact.id },
      purpose: :contact_login,
      expires_in: 24.hours
    )
    get "/api/v1/my/auth/verify", params: { token: token }

    get "/api/v1/my/academy", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body["trainings"].any? { |t| t["title"] == "Formation email" }
  end

  # ── Carpooling API ──

  test "GET /api/v1/my/academy/:id/carpooling returns carpooling data" do
    @registration.update!(
      carpooling: "seeking",
      departure_city: "Namur",
      departure_postal_code: "5000",
      departure_country: "BE"
    )

    # Add a driver
    driver_contact = Contact.create!(contact_type: "person", name: "Pierre Martin", email: "pierre@example.com")
    Academy::TrainingRegistration.create!(
      training: @training,
      contact: driver_contact,
      contact_name: "Pierre Martin",
      contact_email: "pierre@example.com",
      phone: "0478123456",
      payment_status: "paid",
      registered_at: 1.week.ago,
      carpooling: "offering",
      departure_city: "Bruxelles",
      departure_postal_code: "1000",
      departure_country: "BE"
    )

    get "/api/v1/my/academy/#{@training.id}/carpooling", as: :json, headers: auth_headers

    assert_response :success
    body = JSON.parse(response.body)

    assert_equal "seeking", body["myRegistration"]["carpooling"]
    assert_equal "Namur", body["myRegistration"]["departureCity"]
    assert_equal 1, body["drivers"].length
    assert_equal "Pierre", body["drivers"][0]["firstName"]
    assert_equal "phone", body["drivers"][0]["contactMethod"]
    assert_equal "0478123456", body["drivers"][0]["contactValue"]
    assert_equal 0, body["seekers"].length
  end

  test "GET /api/v1/my/academy/:id/carpooling excludes participants with carpooling=none" do
    # Create a registration with carpooling=none — should not appear in lists
    Academy::TrainingRegistration.create!(
      training: @training,
      contact_name: "Invisible",
      contact_email: "invisible@example.com",
      payment_status: "paid",
      registered_at: 1.week.ago,
      carpooling: "none"
    )

    get "/api/v1/my/academy/#{@training.id}/carpooling", as: :json, headers: auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 0, body["drivers"].length
    assert_equal 0, body["seekers"].length
  end

  test "PATCH /api/v1/my/academy/:id/carpooling updates departure info" do
    auth_headers

    patch "/api/v1/my/academy/#{@training.id}/carpooling",
      params: { carpooling: "offering", departure_city: "Liège", departure_postal_code: "4000", departure_country: "BE" },
      as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "offering", body["carpooling"]
    assert_equal "Liège", body["departureCity"]
    assert_equal "4000", body["departurePostalCode"]

    @registration.reload
    assert_equal "offering", @registration.carpooling
    assert_equal "Liège", @registration.departure_city
  end

  test "PATCH /api/v1/my/academy/:id/carpooling rejects invalid carpooling option" do
    auth_headers

    patch "/api/v1/my/academy/#{@training.id}/carpooling",
      params: { carpooling: "invalid_value" },
      as: :json

    assert_response :unprocessable_entity
  end

  test "GET /api/v1/my/academy/:id/carpooling unauthenticated returns 401" do
    get "/api/v1/my/academy/#{@training.id}/carpooling", as: :json
    assert_response :unauthorized
  end

  test "GET /api/v1/my/academy/:id/carpooling for unrelated training returns 404" do
    other_training = Academy::Training.create!(
      training_type: @training_type,
      title: "Autre formation",
      status: "draft"
    )

    get "/api/v1/my/academy/#{other_training.id}/carpooling", as: :json, headers: auth_headers
    assert_response :not_found
  end

  test "carpooling drivers show email when no phone" do
    Academy::TrainingRegistration.create!(
      training: @training,
      contact_name: "Sophie Lemaire",
      contact_email: "sophie@example.com",
      phone: "",
      payment_status: "paid",
      registered_at: 1.week.ago,
      carpooling: "offering",
      departure_city: "Mons",
      departure_postal_code: "7000",
      departure_country: "BE"
    )

    get "/api/v1/my/academy/#{@training.id}/carpooling", as: :json, headers: auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    driver = body["drivers"].find { |d| d["firstName"] == "Sophie" }
    assert_equal "email", driver["contactMethod"]
    assert_equal "sophie@example.com", driver["contactValue"]
  end

  test "carpooling seekers do not expose contact info" do
    Academy::TrainingRegistration.create!(
      training: @training,
      contact_name: "Lucas Bernard",
      contact_email: "lucas@example.com",
      phone: "0499000000",
      payment_status: "paid",
      registered_at: 1.week.ago,
      carpooling: "seeking",
      departure_city: "Charleroi",
      departure_postal_code: "6000",
      departure_country: "BE"
    )

    get "/api/v1/my/academy/#{@training.id}/carpooling", as: :json, headers: auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    seeker = body["seekers"].find { |s| s["firstName"] == "Lucas" }
    assert_not seeker.key?("contactMethod")
    assert_not seeker.key?("contactValue")
  end

  # ── Admin impersonation ──

  test "POST /api/v1/lab/contacts/:id/impersonate generates impersonation token for admin" do
    admin = Member.create!(
      first_name: "Admin", last_name: "Test", email: "admin@test.com",
      password: "testpassword123", is_admin: true, status: :active,
      joined_at: 1.year.ago, member_kind: "human", membership_type: "effective"
    )

    # Login as admin to create session
    post "/login", params: { email: admin.email, password: "testpassword123" }

    post "/api/v1/lab/contacts/#{@contact.id}/impersonate", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert body["url"].start_with?("/my/auth/verify?token=")
  end

  test "impersonation token works to access My Semisto" do
    token = Rails.application.message_verifier(:contact_login).generate(
      { contact_id: @contact.id },
      purpose: :contact_impersonation,
      expires_in: 5.minutes
    )

    get "/api/v1/my/auth/verify", params: { token: token }
    assert_redirected_to "/my"

    # Session should now be set — can access academy
    get "/api/v1/my/academy", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body["trainings"].length
  end

  test "POST /api/v1/lab/contacts/:id/impersonate rejects contact without email" do
    admin = Member.create!(
      first_name: "Admin", last_name: "Test2", email: "admin2@test.com",
      password: "testpassword123", is_admin: true, status: :active,
      joined_at: 1.year.ago, member_kind: "human", membership_type: "effective"
    )
    post "/login", params: { email: admin.email, password: "testpassword123" }

    no_email_contact = Contact.create!(contact_type: "person", name: "Sans Email")

    post "/api/v1/lab/contacts/#{no_email_contact.id}/impersonate", as: :json
    assert_response :unprocessable_entity
  end

  private

  def auth_headers
    # Set up session by going through the verify endpoint first
    token = Rails.application.message_verifier(:contact_login).generate(
      { contact_id: @contact.id },
      purpose: :contact_login,
      expires_in: 24.hours
    )
    get "/api/v1/my/auth/verify", params: { token: token }
    {}
  end
end
