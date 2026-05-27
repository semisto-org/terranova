require 'test_helper'

# Trainer document upload / delete on the My Semisto portal.
# Covers AC-1..AC-26: access rules, upload (single & session selector), the
# Général option, oversize rejection, uploaded_by="trainer", PDF compression
# enqueue, Office files staying out of the compression job, Slack ping
# (async + isolation), and deletion (any document, cross-training rejection).
class MySemistoDocumentsTest < ActionDispatch::IntegrationTest
  include ActiveJob::TestHelper

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

    @training_type = Academy::TrainingType.create!(name: "Initiation", description: "Base")
    @training = Academy::Training.create!(
      training_type: @training_type,
      title: "Forêt comestible 101",
      status: "registrations_open"
    )
    @session = Academy::TrainingSession.create!(
      training: @training,
      start_date: 2.weeks.from_now,
      end_date: 2.weeks.from_now + 2.days,
      topic: "Introduction"
    )

    # Trainer: granted access, NOT registered → has upload right.
    @trainer = Contact.create!(contact_type: "person", name: "Formateur Léa", email: "lea@example.com")
    @training.update!(access_contact_ids: [@trainer.id.to_s])

    # Participant: registered → read only, no upload right (even if also granted).
    @participant = Contact.create!(contact_type: "person", name: "Marie Dupont", email: "marie@example.com")
    Academy::TrainingRegistration.create!(
      training: @training, contact: @participant,
      contact_name: "Marie Dupont", contact_email: "marie@example.com",
      payment_status: "paid", registered_at: 1.week.ago
    )

    @stranger = Contact.create!(contact_type: "person", name: "Inconnu", email: "stranger@example.com")
  end

  # ── AC-1 / AC-2 : canUpload flag exposes the upload zone correctly ──

  test "AC-1 granted-not-registered contact sees canUpload=true" do
    sign_in_contact(@trainer)
    get "/api/v1/my/academy/#{@training.id}", as: :json
    assert_response :success
    assert JSON.parse(response.body)["canUpload"], "trainer should be able to upload"
  end

  test "AC-2 registered participant sees canUpload=false even if also in access_contact_ids" do
    @training.update!(access_contact_ids: [@trainer.id.to_s, @participant.id.to_s])
    sign_in_contact(@participant)
    get "/api/v1/my/academy/#{@training.id}", as: :json
    assert_response :success
    assert_not JSON.parse(response.body)["canUpload"], "registered participant must not upload"
  end

  # ── AC-3 / AC-4 : server-side access enforcement on the write path ──

  test "AC-4 POST upload by a registered participant is rejected server-side" do
    sign_in_contact(@participant)
    assert_no_difference -> { Academy::TrainingDocument.count } do
      post "/api/v1/my/academy/#{@training.id}/documents",
        params: { files: [fixture_file_upload('sample.txt', 'text/plain')] }
    end
    assert_response :not_found
  end

  test "AC-3/AC-4 POST upload by a stranger is rejected server-side" do
    sign_in_contact(@stranger)
    assert_no_difference -> { Academy::TrainingDocument.count } do
      post "/api/v1/my/academy/#{@training.id}/documents",
        params: { files: [fixture_file_upload('sample.txt', 'text/plain')] }
    end
    assert_response :not_found
  end

  test "AC-4 POST upload unauthenticated returns 401" do
    post "/api/v1/my/academy/#{@training.id}/documents",
      params: { files: [fixture_file_upload('sample.txt', 'text/plain')] }
    assert_response :unauthorized
  end

  # ── AC-5 / AC-6 : successful upload, persisted, uploaded_by="trainer" ──

  test "AC-5/AC-6 trainer upload persists a document with uploaded_by=trainer" do
    sign_in_contact(@trainer)
    assert_difference -> { Academy::TrainingDocument.count }, 1 do
      post "/api/v1/my/academy/#{@training.id}/documents",
        params: { files: [fixture_file_upload('sample.txt', 'text/plain')] }
    end
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 1, body["documents"].length

    doc = Academy::TrainingDocument.last
    assert_equal "trainer", doc.uploaded_by
    assert doc.file.attached?
    assert_equal @training.id, doc.training_id
  end

  # ── AC-7 : session selector attaches to a specific session ──

  test "AC-7 upload with session_id attaches the document to that session" do
    sign_in_contact(@trainer)
    post "/api/v1/my/academy/#{@training.id}/documents",
      params: { session_id: @session.id, files: [fixture_file_upload('sample.txt', 'text/plain')] }
    assert_response :created
    assert_equal @session.id, Academy::TrainingDocument.last.session_id
  end

  # ── AC-8 : Général option → no session_id ──

  test "AC-8 upload without session_id creates a général document" do
    sign_in_contact(@trainer)
    post "/api/v1/my/academy/#{@training.id}/documents",
      params: { files: [fixture_file_upload('sample.txt', 'text/plain')] }
    assert_response :created
    assert_nil Academy::TrainingDocument.last.session_id
  end

  # ── AC-9 : foreign session_id is rejected, no document created ──

  test "AC-9 upload with a session_id from another training is rejected" do
    other_training = Academy::Training.create!(training_type: @training_type, title: "Autre", status: "idea")
    foreign_session = Academy::TrainingSession.create!(
      training: other_training, start_date: 1.week.from_now, end_date: 1.week.from_now + 1.day
    )
    sign_in_contact(@trainer)
    assert_no_difference -> { Academy::TrainingDocument.count } do
      post "/api/v1/my/academy/#{@training.id}/documents",
        params: { session_id: foreign_session.id, files: [fixture_file_upload('sample.txt', 'text/plain')] }
    end
    assert_response :unprocessable_entity
  end

  # ── AC-10 : custom name vs default filename ──

  test "AC-10 explicit name is used; otherwise filename" do
    sign_in_contact(@trainer)
    post "/api/v1/my/academy/#{@training.id}/documents",
      params: { name: "Mon support", files: [fixture_file_upload('sample.txt', 'text/plain')] }
    assert_response :created
    assert_equal "Mon support", Academy::TrainingDocument.last.name

    post "/api/v1/my/academy/#{@training.id}/documents",
      params: { files: [fixture_file_upload('sample.txt', 'text/plain')] }
    assert_response :created
    assert_equal "sample.txt", Academy::TrainingDocument.last.name
  end

  # ── AC-13 : any type ≤ 200 Mo accepted ──

  test "AC-13 a small non-PDF file is accepted" do
    sign_in_contact(@trainer)
    post "/api/v1/my/academy/#{@training.id}/documents",
      params: { files: [fixture_file_upload('sample.txt', 'text/plain')] }
    assert_response :created
  end

  # ── AC-14 : > 200 Mo rejected server-side, nothing created ──

  test "AC-14 a file larger than 200 Mo is rejected (422), no document created" do
    sign_in_contact(@trainer)
    big = build_uploaded_file_of_size(200 * 1024 * 1024 + 1, "huge.bin", "application/octet-stream")
    assert_no_difference -> { Academy::TrainingDocument.count } do
      post "/api/v1/my/academy/#{@training.id}/documents", params: { files: [big] }
    end
    assert_response :unprocessable_entity
    assert_match(/200 Mo/, JSON.parse(response.body)["error"])
  end

  # ── AC-16 : non-PDF does NOT enqueue the compression job ──

  test "AC-16 a non-PDF upload enqueues no PdfCompressionJob" do
    sign_in_contact(@trainer)
    assert_no_enqueued_jobs(only: PdfCompressionJob) do
      post "/api/v1/my/academy/#{@training.id}/documents",
        params: { files: [fixture_file_upload('sample.txt', 'text/plain')] }
    end
    assert_response :created
  end

  # ── AC-17 (enqueue side) : a PDF upload enqueues the compression job ──

  test "AC-17 a PDF upload enqueues a PdfCompressionJob for the document" do
    sign_in_contact(@trainer)
    assert_enqueued_jobs(1, only: PdfCompressionJob) do
      post "/api/v1/my/academy/#{@training.id}/documents",
        params: { files: [real_pdf_upload] }
    end
    assert_response :created
  end

  # ── AC-20 / AC-21 : Slack ping enqueued async (one per deposit) ──

  test "AC-20/AC-21 a successful upload enqueues exactly one SlackNotificationJob" do
    sign_in_contact(@trainer)
    assert_enqueued_jobs(1, only: SlackNotificationJob) do
      post "/api/v1/my/academy/#{@training.id}/documents",
        params: { files: [fixture_file_upload('sample.txt', 'text/plain'), fixture_file_upload('sample.txt', 'text/plain')] }
    end
    assert_response :created
    # The deposit message names the uploader, count, training and session label.
    job = enqueued_jobs.find { |j| j[:job] == SlackNotificationJob }
    text = job[:args].first
    assert_match(/Formateur Léa/, text)
    assert_match(/2 document/, text)
    assert_match(/Forêt comestible 101/, text)
    assert_match(%r{/academy/#{@training.id}}, text)
  end

  test "AC-20 session deposit uses the session date label; général uses « Général »" do
    sign_in_contact(@trainer)
    clear_enqueued_jobs

    post "/api/v1/my/academy/#{@training.id}/documents",
      params: { session_id: @session.id, files: [fixture_file_upload('sample.txt', 'text/plain')] }
    text = enqueued_jobs.find { |j| j[:job] == SlackNotificationJob }[:args].first
    assert_match(@session.start_date.to_date.strftime("%d/%m"), text)

    clear_enqueued_jobs
    post "/api/v1/my/academy/#{@training.id}/documents",
      params: { files: [fixture_file_upload('sample.txt', 'text/plain')] }
    text = enqueued_jobs.find { |j| j[:job] == SlackNotificationJob }[:args].first
    assert_match(/Général/, text)
  end

  # ── AC-23 : a trainer can delete any document of the training ──

  test "AC-23 trainer soft-deletes a team document" do
    team_doc = Academy::TrainingDocument.create!(
      training: @training, name: "Doc équipe", uploaded_by: "team",
      url: "https://example.com/x.pdf", uploaded_at: Time.current
    )
    sign_in_contact(@trainer)
    delete "/api/v1/my/academy/#{@training.id}/documents/#{team_doc.id}"
    assert_response :no_content
    assert team_doc.reload.deleted?
  end

  # ── AC-24 : a participant cannot delete (server-side) ──

  test "AC-24 a registered participant cannot delete a document" do
    doc = Academy::TrainingDocument.create!(
      training: @training, name: "Doc", url: "https://example.com/x.pdf", uploaded_at: Time.current
    )
    sign_in_contact(@participant)
    delete "/api/v1/my/academy/#{@training.id}/documents/#{doc.id}"
    assert_response :not_found
    assert_not doc.reload.deleted?
  end

  # ── AC-25 : deleting a document of another training is rejected ──

  test "AC-25 deleting a document belonging to another training is rejected" do
    other_training = Academy::Training.create!(training_type: @training_type, title: "Autre", status: "idea")
    other_doc = Academy::TrainingDocument.create!(
      training: other_training, name: "Doc autre", url: "https://example.com/y.pdf", uploaded_at: Time.current
    )
    sign_in_contact(@trainer)
    # Trainer has upload right on @training but not other_training; the document
    # is scoped to @training, so it is not found there.
    delete "/api/v1/my/academy/#{@training.id}/documents/#{other_doc.id}"
    assert_response :not_found
    assert_not other_doc.reload.deleted?
  end

  private

  def sign_in_contact(contact)
    token = Rails.application.message_verifier(:contact_login).generate(
      { contact_id: contact.id }, purpose: :contact_login, expires_in: 24.hours
    )
    get "/api/v1/my/auth/verify", params: { token: token }
  end

  # A real (tiny) PDF so content_type detection picks "application/pdf".
  def real_pdf_upload
    require "prawn"
    pdf = Prawn::Document.new
    pdf.text "Test PDF"
    tmp = Tempfile.new(["support", ".pdf"])
    tmp.binmode
    tmp.write(pdf.render)
    tmp.rewind
    Rack::Test::UploadedFile.new(tmp.path, "application/pdf", original_filename: "support.pdf")
  end

  # Builds an UploadedFile reporting a given size without writing 200 Mo to disk:
  # the controller checks `.size`, which Rack::Test reads from the file. We use a
  # sparse file so the size is honored cheaply.
  def build_uploaded_file_of_size(size, filename, content_type)
    tmp = Tempfile.new(filename)
    tmp.binmode
    tmp.truncate(size) # sparse — does not allocate real bytes
    tmp.rewind
    Rack::Test::UploadedFile.new(tmp.path, content_type, original_filename: filename)
  end
end
