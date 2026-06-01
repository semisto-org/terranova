require 'test_helper'

class ProjectsUpdateTest < ActionDispatch::IntegrationTest
  setup do
    [Academy::Training, Academy::TrainingType].each(&:delete_all)
    @type = Academy::TrainingType.create!(name: 'Permaculture')
    @training = Academy::Training.create!(
      training_type: @type, title: 'Concepteur·rice 2026-2027',
      status: 'registrations_open', price: 0, max_participants: 20,
      description: 'Description initiale'
    )
  end

  # Régression : éditer l'équipe d'une formation envoyait description: null,
  # ce qui violait la contrainte NOT NULL de academy_trainings.description.
  test 'updating a training with null description does not raise and keeps NOT NULL safe' do
    patch "/api/v1/projects/training/#{@training.id}",
      params: { name: 'Concepteur·rice 2026-2027', description: nil, status: 'registrations_open' }.to_json,
      headers: { 'Content-Type' => 'application/json' }

    assert_response :success
    assert_not_nil @training.reload.description
    assert_equal 'Description initiale', @training.description, 'un null ne doit pas écraser la description existante'
  end

  test 'updating a training with empty description sets it to blank string' do
    patch "/api/v1/projects/training/#{@training.id}",
      params: { name: 'Concepteur·rice 2026-2027', description: '', status: 'registrations_open' }.to_json,
      headers: { 'Content-Type' => 'application/json' }

    assert_response :success
    assert_equal '', @training.reload.description
  end
end
