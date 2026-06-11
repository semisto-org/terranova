require 'test_helper'

# Feedback « à chaud » d'un·e participant·e sur une session, via le portail
# My Semisto. Réservé aux inscrit·es de l'activité (pas les formateurs en accès
# simple). Une seule réponse par (session × participant), non modifiable.
class MySemistoSessionFeedbackTest < ActionDispatch::IntegrationTest
  setup do
    [
      Academy::SessionFeedback,
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
      status: "in_progress"
    )
    # Session déjà passée → le feedback « à chaud » est ouvert.
    @session = Academy::TrainingSession.create!(
      training: @training,
      start_date: 1.week.ago,
      end_date: 5.days.ago,
      topic: "Introduction"
    )

    # Participant·e inscrit·e → peut donner son avis.
    @participant = Contact.create!(contact_type: "person", name: "Marie Dupont", email: "marie@example.com")
    Academy::TrainingRegistration.create!(
      training: @training, contact: @participant,
      contact_name: "Marie Dupont", contact_email: "marie@example.com",
      payment_status: "paid", registered_at: 2.weeks.ago
    )

    # Formateur·rice : accès simple, NON inscrit → pas de droit de feedback.
    @trainer = Contact.create!(contact_type: "person", name: "Formateur Léa", email: "lea@example.com")
    @training.update!(access_contact_ids: [@trainer.id.to_s])

    @stranger = Contact.create!(contact_type: "person", name: "Inconnu", email: "stranger@example.com")
  end

  # ── AC-1 : un·e participant·e dépose un avis sur une session passée ──

  test "AC-1 participant submits feedback on a past session" do
    sign_in_contact(@participant)
    post feedback_path(@training, @session), params: {
      rating: 4, would_recommend: true, comment: "Très chouette journée."
    }
    assert_response :created

    feedback = Academy::SessionFeedback.find_by(session_id: @session.id, contact_id: @participant.id)
    assert_not_nil feedback
    assert_equal 4, feedback.rating
    assert_equal true, feedback.would_recommend
    assert_equal "Très chouette journée.", feedback.comment

    body = JSON.parse(response.body)["feedback"]
    assert_equal 4, body["rating"]
    assert_equal true, body["wouldRecommend"]
  end

  # ── AC-2 : commentaire facultatif (vide accepté) ──

  test "AC-2 comment is optional" do
    sign_in_contact(@participant)
    post feedback_path(@training, @session), params: { rating: 5, would_recommend: false }
    assert_response :created
    assert_equal "", Academy::SessionFeedback.last.comment
    assert_equal false, Academy::SessionFeedback.last.would_recommend
  end

  # ── AC-3 : une seule réponse par participant·e (non modifiable) ──

  test "AC-3 a second submission is rejected with 409" do
    Academy::SessionFeedback.create!(
      session: @session, contact: @participant, rating: 3, would_recommend: true
    )
    sign_in_contact(@participant)
    post feedback_path(@training, @session), params: { rating: 1, would_recommend: false }
    assert_response :conflict
    assert_equal 1, Academy::SessionFeedback.where(session_id: @session.id, contact_id: @participant.id).count
    assert_equal 3, Academy::SessionFeedback.last.rating
  end

  # ── AC-4 : une session future n'accepte pas de feedback ──

  test "AC-4 feedback on a future session is rejected" do
    future = Academy::TrainingSession.create!(
      training: @training, start_date: 1.week.from_now, end_date: 1.week.from_now + 1.day
    )
    sign_in_contact(@participant)
    post feedback_path(@training, future), params: { rating: 4, would_recommend: true }
    assert_response :unprocessable_entity
    assert_equal 0, Academy::SessionFeedback.where(session_id: future.id).count
  end

  # ── AC-5 : un·e formateur·rice non inscrit·e ne peut pas donner d'avis ──

  test "AC-5 a non-registered trainer cannot submit feedback" do
    sign_in_contact(@trainer)
    post feedback_path(@training, @session), params: { rating: 4, would_recommend: true }
    assert_response :not_found
    assert_equal 0, Academy::SessionFeedback.count
  end

  # ── AC-6 : non authentifié → 401 ──

  test "AC-6 unauthenticated request returns 401" do
    post feedback_path(@training, @session), params: { rating: 4, would_recommend: true }
    assert_response :unauthorized
    assert_equal 0, Academy::SessionFeedback.count
  end

  # ── AC-7 : une session d'une autre activité est rejetée (422) ──

  test "AC-7 a session from another training is rejected" do
    other = Academy::Training.create!(training_type: @training_type, title: "Autre", status: "idea")
    foreign = Academy::TrainingSession.create!(
      training: other, start_date: 1.week.ago, end_date: 6.days.ago
    )
    sign_in_contact(@participant)
    post feedback_path(@training, foreign), params: { rating: 4, would_recommend: true }
    assert_response :unprocessable_entity
    assert_equal 0, Academy::SessionFeedback.count
  end

  # ── AC-8 : note hors bornes 1–5 → 422 ──

  test "AC-8 an out-of-range rating is rejected" do
    sign_in_contact(@participant)
    post feedback_path(@training, @session), params: { rating: 6, would_recommend: true }
    assert_response :unprocessable_entity
    assert_equal 0, Academy::SessionFeedback.count
  end

  # ── AC-9 : recommandation manquante → 422 ──

  test "AC-9 a missing recommendation is rejected" do
    sign_in_contact(@participant)
    post feedback_path(@training, @session), params: { rating: 4 }
    assert_response :unprocessable_entity
    assert_equal 0, Academy::SessionFeedback.count
  end

  # ── AC-10 : le détail d'activité expose myFeedback + canGiveFeedback ──

  test "AC-10 training detail exposes own feedback and the participant flag" do
    Academy::SessionFeedback.create!(
      session: @session, contact: @participant, rating: 5, would_recommend: true, comment: "Top"
    )
    sign_in_contact(@participant)
    get "/api/v1/my/academy/#{@training.id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal true, body["canGiveFeedback"]
    serialized = body["sessions"].find { |s| s["id"] == @session.id.to_s }
    assert_equal 5, serialized["myFeedback"]["rating"]
    assert_equal true, serialized["myFeedback"]["wouldRecommend"]
  end

  # ── AC-11 : un·e formateur·rice n'a pas le flag de feedback ──

  test "AC-11 a non-registered trainer does not get the feedback flag" do
    sign_in_contact(@trainer)
    get "/api/v1/my/academy/#{@training.id}", as: :json
    assert_response :success
    assert_equal false, JSON.parse(response.body)["canGiveFeedback"]
  end

  private

  def feedback_path(training, session)
    "/api/v1/my/academy/#{training.id}/sessions/#{session.id}/feedback"
  end

  def sign_in_contact(contact)
    token = Rails.application.message_verifier(:contact_login).generate(
      { contact_id: contact.id }, purpose: :contact_login, expires_in: 24.hours
    )
    get "/api/v1/my/auth/verify", params: { token: token }
  end
end
