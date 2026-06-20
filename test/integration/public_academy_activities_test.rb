require 'test_helper'

# API publique des activités aux inscriptions ouvertes (#45), consommée en pull
# par le site Semisto pour la page « Formations ». Les activités hors
# registrations_open ne doivent jamais y apparaître.
class PublicAcademyActivitiesTest < ActionDispatch::IntegrationTest
  setup do
    [Academy::TrainingSession, Academy::Training, Academy::TrainingType].each(&:delete_all)
    @type = Academy::TrainingType.create!(name: 'Cursus')
  end

  test 'only registrations_open trainings are exposed' do
    open = Academy::Training.create!(title: 'Forêt comestible', status: 'registrations_open', training_type: @type)
    open.sessions.create!(start_date: Date.new(2026, 9, 1), end_date: Date.new(2026, 9, 3))
    Academy::Training.create!(title: 'Idée', status: 'idea', training_type: @type)
    Academy::Training.create!(title: 'En préparation', status: 'in_preparation', training_type: @type)

    get '/api/v1/public/academy/trainings', as: :json
    assert_response :success

    titles = JSON.parse(response.body)['activities'].map { |a| a['title'] }
    assert_equal ['Forêt comestible'], titles
  end

  test 'the activity payload carries the fields the public site needs' do
    training = Academy::Training.create!(
      title: 'Taille de printemps', status: 'registrations_open',
      training_type: @type, description: 'Atelier pratique'
    )
    training.sessions.create!(start_date: Date.new(2026, 4, 19), end_date: Date.new(2026, 4, 19))

    get '/api/v1/public/academy/trainings', as: :json
    activity = JSON.parse(response.body)['activities'].first

    assert_equal training.id.to_s, activity['id']
    assert_equal 'Taille de printemps', activity['title']
    assert_equal 'Atelier pratique', activity['description']
    assert_equal 'Cursus', activity['trainingType']
    assert_equal '2026-04-19', activity['firstSessionDate']
    %w[price vatRate spotsRemaining maxParticipants requiresAccommodation locations].each do |key|
      assert activity.key?(key), "le payload doit exposer #{key}"
    end
  end

  test 'no auth is required (public endpoint)' do
    get '/api/v1/public/academy/trainings', as: :json
    assert_response :success
  end
end
