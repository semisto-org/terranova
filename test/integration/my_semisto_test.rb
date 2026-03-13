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
