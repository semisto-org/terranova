require 'test_helper'

class AcademyTaskTemplatesTest < ActionDispatch::IntegrationTest
  test 'training type persists and returns task templates' do
    post '/api/v1/academy/training-types', params: {
      name: 'Focus Templates',
      task_templates: [
        { name: 'Envoyer feedback', scope: 'activity', anchor: 'end', offset_days: -90 },
        { name: 'Réserver la salle', scope: 'session', anchor: 'start', offset_days: -7 },
      ],
    }, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 2, body['taskTemplates'].size
    assert_equal 'Réserver la salle', body['taskTemplates'].find { |t| t['scope'] == 'session' }['name']
  end

  test 'creating a training then a session generates the template tasks with dates' do
    post '/api/v1/academy/training-types', params: {
      name: 'Focus Gen',
      task_templates: [
        { name: 'Envoyer feedback', scope: 'activity', anchor: 'end', offset_days: -90 },
        { name: 'Réserver la salle', scope: 'session', anchor: 'start', offset_days: -7 },
      ],
    }, as: :json
    type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: { training_type_id: type_id, title: 'Cursus 2027' }, as: :json
    training_id = JSON.parse(response.body)['id']

    post "/api/v1/academy/trainings/#{training_id}/sessions", params: {
      start_date: '2026-09-01', end_date: '2026-09-03'
    }, as: :json
    assert_response :success

    # Les tâches générées vivent dans les listes de tâches unifiées de l'activité.
    get "/api/v1/projects/training/#{training_id}/task-lists", as: :json
    assert_response :success
    tasks = JSON.parse(response.body)['items'].flat_map { |l| l['tasks'] }
    names = tasks.map { |t| t['name'] }

    assert_includes names, 'Envoyer feedback'
    assert(names.any? { |n| n.start_with?('Réserver la salle —') })

    salle = tasks.find { |t| t['name'].start_with?('Réserver la salle —') }
    assert_equal '2026-08-25', salle['dueDate'] # 1 sept - 7j
    feedback = tasks.find { |t| t['name'] == 'Envoyer feedback' }
    assert_equal '2026-06-05', feedback['dueDate'] # 3 sept - 90j
  end
end
