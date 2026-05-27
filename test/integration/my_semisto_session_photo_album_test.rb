require 'test_helper'

# Trainer-managed Google Photos album link, per session, on the My Semisto portal.
# Mirrors the access model of document upload: only a contact granted access AND
# not registered (a "trainer") may set/clear a session's album link. The link is
# read-visible to everyone who can see the training.
class MySemistoSessionPhotoAlbumTest < ActionDispatch::IntegrationTest
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

    @album_url = "https://photos.app.goo.gl/AbCdEf123"

    # Trainer: granted access, NOT registered → has the management right.
    @trainer = Contact.create!(contact_type: "person", name: "Formateur Léa", email: "lea@example.com")
    @training.update!(access_contact_ids: [@trainer.id.to_s])

    # Participant: registered → read only, no management right.
    @participant = Contact.create!(contact_type: "person", name: "Marie Dupont", email: "marie@example.com")
    Academy::TrainingRegistration.create!(
      training: @training, contact: @participant,
      contact_name: "Marie Dupont", contact_email: "marie@example.com",
      payment_status: "paid", registered_at: 1.week.ago
    )

    @stranger = Contact.create!(contact_type: "person", name: "Inconnu", email: "stranger@example.com")
  end

  # ── AC-1 : a trainer sets a session's album link, persisted ──

  test "AC-1 trainer sets the session album link" do
    sign_in_contact(@trainer)
    patch session_album_path(@training, @session), params: { photo_album_url: @album_url }
    assert_response :success
    assert_equal @album_url, JSON.parse(response.body)["session"]["photoAlbumUrl"]
    assert_equal @album_url, @session.reload.photo_album_url
  end

  # ── AC-2 : a registered participant is rejected server-side ──

  test "AC-2 registered participant cannot set the album link" do
    sign_in_contact(@participant)
    patch session_album_path(@training, @session), params: { photo_album_url: @album_url }
    assert_response :not_found
    assert_equal "", @session.reload.photo_album_url
  end

  # ── AC-3 : a stranger is rejected server-side ──

  test "AC-3 stranger cannot set the album link" do
    sign_in_contact(@stranger)
    patch session_album_path(@training, @session), params: { photo_album_url: @album_url }
    assert_response :not_found
    assert_equal "", @session.reload.photo_album_url
  end

  # ── AC-4 : unauthenticated is rejected (401) ──

  test "AC-4 unauthenticated request returns 401" do
    patch session_album_path(@training, @session), params: { photo_album_url: @album_url }
    assert_response :unauthorized
    assert_equal "", @session.reload.photo_album_url
  end

  # ── AC-5 : a session_id from another training is rejected (422) ──

  test "AC-5 a session from another training is rejected" do
    other = Academy::Training.create!(training_type: @training_type, title: "Autre", status: "idea")
    foreign_session = Academy::TrainingSession.create!(
      training: other, start_date: 1.week.from_now, end_date: 1.week.from_now + 1.day
    )
    sign_in_contact(@trainer)
    patch session_album_path(@training, foreign_session), params: { photo_album_url: @album_url }
    assert_response :unprocessable_entity
    assert_equal "", foreign_session.reload.photo_album_url
  end

  # ── AC-6 : a blank value clears the link ──

  test "AC-6 a blank value clears the link" do
    @session.update!(photo_album_url: @album_url)
    sign_in_contact(@trainer)
    patch session_album_path(@training, @session), params: { photo_album_url: "  " }
    assert_response :success
    assert_equal "", @session.reload.photo_album_url
  end

  # ── AC-7 : a malformed URL is rejected (422) ──

  test "AC-7 a non-URL value is rejected" do
    sign_in_contact(@trainer)
    patch session_album_path(@training, @session), params: { photo_album_url: "pas une url" }
    assert_response :unprocessable_entity
    assert_equal "", @session.reload.photo_album_url
  end

  # ── AC-8 : the training detail GET exposes photoAlbumUrl per session ──

  test "AC-8 training detail exposes the session album link" do
    @session.update!(photo_album_url: @album_url)
    sign_in_contact(@trainer)
    get "/api/v1/my/academy/#{@training.id}", as: :json
    assert_response :success
    serialized = JSON.parse(response.body)["sessions"].find { |s| s["id"] == @session.id.to_s }
    assert_equal @album_url, serialized["photoAlbumUrl"]
  end

  private

  def session_album_path(training, session)
    "/api/v1/my/academy/#{training.id}/sessions/#{session.id}/photo-album"
  end

  def sign_in_contact(contact)
    token = Rails.application.message_verifier(:contact_login).generate(
      { contact_id: contact.id }, purpose: :contact_login, expires_in: 24.hours
    )
    get "/api/v1/my/auth/verify", params: { token: token }
  end
end
