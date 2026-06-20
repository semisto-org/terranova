require 'test_helper'

# Régression #137 : supprimer une formation peuplée doit cascader le soft-delete
# à ses enfants (sessions, inscriptions, …) pour éviter les orphelins qui
# cassaient l'index Academy (500 via computed_expected_amount sur training nil).
class AcademyTrainingSoftDeleteTest < ActionDispatch::IntegrationTest
  setup do
    @type = Academy::TrainingType.create!(name: "Stage-#{SecureRandom.hex(3)}", description: 'Intro')
    @training = Academy::Training.create!(training_type: @type, title: 'Taille douce', status: 'registrations_open')
    @category = Academy::ParticipantCategory.create!(training: @training, label: 'Adulte', price: 45.0, max_spots: 10)
    @session = Academy::TrainingSession.create!(
      training: @training, start_date: 1.week.from_now, end_date: 1.week.from_now + 1.day, topic: 'Jour 1'
    )
    @registration = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Alice Dupont',
      payment_status: 'pending', registered_at: Time.current, carpooling: 'none'
    )
  end

  test 'destroying a training cascades the soft-delete to its children' do
    delete "/api/v1/academy/trainings/#{@training.id}", as: :json
    assert_response :no_content

    assert Academy::Training.with_deleted.find(@training.id).deleted?
    assert_nil Academy::TrainingSession.find_by(id: @session.id), 'la session doit être masquée'
    assert_nil Academy::TrainingRegistration.find_by(id: @registration.id), "l'inscription doit être masquée"
    assert Academy::TrainingSession.with_deleted.find(@session.id).deleted?
    assert Academy::TrainingRegistration.with_deleted.find(@registration.id).deleted?
  end

  test 'academy index stays 200 after deleting a populated training' do
    delete "/api/v1/academy/trainings/#{@training.id}", as: :json
    assert_response :no_content

    get '/api/v1/academy', as: :json
    assert_response :success

    payload = JSON.parse(response.body)
    session_ids = payload['trainingSessions'].map { |s| s['id'] }
    registration_ids = payload['trainingRegistrations'].map { |r| r['id'] }
    refute_includes session_ids, @session.id.to_s
    refute_includes registration_ids, @registration.id.to_s
  end

  test 'academy index ignores pre-existing orphan children (defense-in-depth)' do
    # Simule un orphelin legacy : enfant vivant dont le parent est soft-deleted
    # sans cascade (l'état qui a provoqué le 500 en prod).
    @training.soft_delete! # cascade masque les enfants…
    @session.restore!      # … on en « ressuscite » un pour simuler l'orphelin legacy
    @registration.restore!

    get '/api/v1/academy', as: :json
    assert_response :success

    payload = JSON.parse(response.body)
    refute_includes payload['trainingSessions'].map { |s| s['id'] }, @session.id.to_s
    refute_includes payload['trainingRegistrations'].map { |r| r['id'] }, @registration.id.to_s
  end

  test 'computed_expected_amount returns 0.0 for an orphan registration' do
    @training.soft_delete!
    @registration.restore! # inscription vivante, training soft-deleted → orpheline
    orphan = Academy::TrainingRegistration.find(@registration.id)

    assert_nil orphan.training, 'le training masqué doit rendre training nil'
    assert_equal 0.0, orphan.computed_expected_amount
  end
end
