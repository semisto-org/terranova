require 'test_helper'

# Fil support participant ↔ équipe + message → tâche auto (#18/#41).
class AcademyParticipantMessagesTest < ActionDispatch::IntegrationTest
  setup do
    @type = Academy::TrainingType.create!(name: "Msg #{SecureRandom.hex(3)}")
    @training = Academy::Training.create!(training_type: @type, title: 'Forêt 101', status: 'registrations_open')
    @coordinator = Member.create!(first_name: 'Mo', last_name: 'Coord', email: "mo-#{SecureRandom.hex(3)}@t.be", joined_at: Date.current)
    @training.project_memberships.create!(member: @coordinator, role: 'organizer')

    @marie = Contact.create!(contact_type: 'person', name: 'Marie', email: "m-#{SecureRandom.hex(3)}@t.be")
    @bob = Contact.create!(contact_type: 'person', name: 'Bob', email: "b-#{SecureRandom.hex(3)}@t.be")
    [@marie, @bob].each do |c|
      Academy::TrainingRegistration.create!(
        training: @training, contact: c, contact_name: c.name, contact_email: c.email,
        payment_status: 'paid', carpooling: 'none', registered_at: Time.current
      )
    end
  end

  def sign_in_contact(contact)
    token = Rails.application.message_verifier(:contact_login).generate(
      { contact_id: contact.id }, purpose: :contact_login, expires_in: 24.hours
    )
    get "/api/v1/my/auth/verify", params: { token: token }
  end

  test 'a participant message creates a task Répondre à … assigned to the coordinator' do
    sign_in_contact(@marie)
    assert_difference -> { @training.reload.tasks.count }, 1 do
      post "/api/v1/my/academy/#{@training.id}/messages", params: { body: 'À quelle heure on commence ?' }, as: :json
      assert_response :created
    end

    task = @training.tasks.order(:created_at).last
    assert_equal "Répondre à Marie", task.name
    assert_equal @coordinator.id, task.assignee_id
    assert_equal Date.current, task.due_date
  end

  test 'each message creates exactly one task' do
    sign_in_contact(@marie)
    assert_difference -> { @training.reload.tasks.count }, 2 do
      post "/api/v1/my/academy/#{@training.id}/messages", params: { body: 'Question 1' }, as: :json
      post "/api/v1/my/academy/#{@training.id}/messages", params: { body: 'Question 2' }, as: :json
    end
  end

  test 'team reply appears in the participant thread and marks inbound as read' do
    sign_in_contact(@marie)
    post "/api/v1/my/academy/#{@training.id}/messages", params: { body: 'Coucou' }, as: :json

    # Réponse équipe (admin)
    post "/api/v1/academy/trainings/#{@training.id}/messages",
         params: { contact_id: @marie.id, body: 'On commence à 9h' }, as: :json
    assert_response :created

    sign_in_contact(@marie)
    get "/api/v1/my/academy/#{@training.id}/messages", as: :json
    msgs = JSON.parse(response.body)['messages']
    assert_equal ['me', 'team'], msgs.map { |m| m['from'] }

    assert_equal 0, @training.participant_messages.where(sender: 'participant', read_at: nil).count
  end

  test 'a participant only sees their own thread (cloisonnement)' do
    sign_in_contact(@marie)
    post "/api/v1/my/academy/#{@training.id}/messages", params: { body: 'Message de Marie' }, as: :json

    sign_in_contact(@bob)
    get "/api/v1/my/academy/#{@training.id}/messages", as: :json
    bodies = JSON.parse(response.body)['messages'].map { |m| m['body'] }
    assert_not_includes bodies, 'Message de Marie'
  end

  test 'admin sees threads grouped by contact' do
    sign_in_contact(@marie)
    post "/api/v1/my/academy/#{@training.id}/messages", params: { body: 'A' }, as: :json
    sign_in_contact(@bob)
    post "/api/v1/my/academy/#{@training.id}/messages", params: { body: 'B' }, as: :json

    get "/api/v1/academy/trainings/#{@training.id}/messages", as: :json
    threads = JSON.parse(response.body)['threads']
    assert_equal 2, threads.size
  end
end
