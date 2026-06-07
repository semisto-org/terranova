require 'test_helper'

# Feedback de session + email J+1 (#21/#46).
class AcademySessionFeedbackTest < ActionDispatch::IntegrationTest
  include ActionMailer::TestHelper

  setup do
    @type = Academy::TrainingType.create!(name: "FB #{SecureRandom.hex(3)}")
    @training = Academy::Training.create!(training_type: @type, title: 'Forêt 101', status: 'in_progress')
    @session = @training.sessions.create!(start_date: Date.current - 3, end_date: Date.current - 1)
    @contact = Contact.create!(contact_type: 'person', name: 'Marie', email: "m-#{SecureRandom.hex(3)}@t.be")
    Academy::TrainingRegistration.create!(
      training: @training, contact: @contact, contact_name: 'Marie', contact_email: @contact.email,
      payment_status: 'paid', carpooling: 'none', registered_at: Time.current
    )
  end

  def sign_in_contact(contact)
    token = Rails.application.message_verifier(:contact_login).generate(
      { contact_id: contact.id }, purpose: :contact_login, expires_in: 24.hours
    )
    get "/api/v1/my/auth/verify", params: { token: token }
  end

  test 'a registered participant can submit feedback for a session' do
    sign_in_contact(@contact)
    post "/api/v1/my/academy/#{@training.id}/sessions/#{@session.id}/feedback",
         params: { rating: 9, comment: 'Super journée', anonymous: false }, as: :json
    assert_response :created

    fb = @session.feedbacks.first
    assert_equal 9, fb.rating
    assert_equal @contact.id, fb.contact_id
  end

  test 'anonymous feedback keeps the contact in DB but hides it in the team listing' do
    sign_in_contact(@contact)
    post "/api/v1/my/academy/#{@training.id}/sessions/#{@session.id}/feedback",
         params: { rating: 4, comment: 'Bof', anonymous: true }, as: :json
    assert_response :created

    fb = @session.feedbacks.first
    assert_equal @contact.id, fb.contact_id, 'le contact reste lié en base (RGPD/QUESTIONS #5)'

    get "/api/v1/academy/trainings/#{@training.id}/feedbacks", as: :json
    item = JSON.parse(response.body)['items'].first
    assert_nil item['contactName'], "l'identité est masquée à l'affichage équipe"
    assert_equal true, item['anonymous']
  end

  test 'J+1 job sends exactly one feedback email per registration and is idempotent' do
    assert_enqueued_emails 1 do
      SessionFeedbackEmailJob.perform_now
    end
    assert_not_nil @session.reload.feedback_requested_at

    # Re-run : la session est déjà notifiée → aucun nouvel email.
    assert_enqueued_emails 0 do
      SessionFeedbackEmailJob.perform_now
    end
  end

  test 'feedback requires a rating or a comment' do
    sign_in_contact(@contact)
    post "/api/v1/my/academy/#{@training.id}/sessions/#{@session.id}/feedback",
         params: { anonymous: false }, as: :json
    assert_response :unprocessable_entity
  end
end
