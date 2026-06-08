require 'test_helper'

# Tâches auto déclenchées par le statut + checklist d'annulation (#35).
class AcademyStatusTasksTest < ActionDispatch::IntegrationTest
  def create_type(task_templates)
    post '/api/v1/academy/training-types', params: {
      name: "Statut #{SecureRandom.hex(3)}",
      task_templates: task_templates,
    }, as: :json
    assert_response :success
    JSON.parse(response.body)['id']
  end

  def create_training(type_id)
    post '/api/v1/academy/trainings', params: { training_type_id: type_id, title: 'Cursus statut' }, as: :json
    assert_response :success
    JSON.parse(response.body)['id']
  end

  def task_names(training_id)
    get "/api/v1/projects/training/#{training_id}/task-lists", as: :json
    assert_response :success
    JSON.parse(response.body)['items'].flat_map { |l| l['tasks'] }
  end

  test 'trigger field is permitted and persisted on a template' do
    post '/api/v1/academy/training-types', params: {
      name: "Statut #{SecureRandom.hex(3)}",
      task_templates: [
        { name: 'Mail post-formation', scope: 'activity', trigger: 'on_status:post_production', offset_days: 1 },
      ],
    }, as: :json
    assert_response :success
    tpl = JSON.parse(response.body)['taskTemplates'].first
    assert_equal 'on_status:post_production', tpl['trigger']
  end

  test 'status-triggered template is NOT seeded on create, only on status change' do
    type_id = create_type([
      { name: 'Mail post-formation', scope: 'activity', trigger: 'on_status:post_production', offset_days: 1 },
    ])
    training_id = create_training(type_id)

    # À la création, la tâche de statut ne doit pas exister.
    assert_not_includes task_names(training_id).map { |t| t['name'] }, 'Mail post-formation'

    patch "/api/v1/academy/trainings/#{training_id}/status", params: { status: 'post_production' }, as: :json
    assert_response :success

    tasks = task_names(training_id)
    mail = tasks.find { |t| t['name'] == 'Mail post-formation' }
    assert mail, 'la tâche on_status doit être générée au passage du statut'
    assert_equal((Date.current + 1).iso8601, mail['dueDate'])
  end

  test 'status-triggered generation is idempotent across status flapping' do
    type_id = create_type([
      { name: 'Mail post-formation', scope: 'activity', trigger: 'on_status:post_production' },
    ])
    training_id = create_training(type_id)

    patch "/api/v1/academy/trainings/#{training_id}/status", params: { status: 'post_production' }, as: :json
    patch "/api/v1/academy/trainings/#{training_id}/status", params: { status: 'in_progress' }, as: :json
    patch "/api/v1/academy/trainings/#{training_id}/status", params: { status: 'post_production' }, as: :json

    count = task_names(training_id).count { |t| t['name'] == 'Mail post-formation' }
    assert_equal 1, count, 'pas de doublon au re-bascule de statut'
  end

  test 'cancelling a training without on_cancel templates creates the default checklist due today' do
    type_id = create_type([])
    training_id = create_training(type_id)

    patch "/api/v1/academy/trainings/#{training_id}/status", params: { status: 'cancelled' }, as: :json
    assert_response :success

    tasks = task_names(training_id)
    cancellation = tasks.select { |t| t['name'].start_with?('Annulation —') }
    assert_equal Academy::TaskGenerator::DEFAULT_CANCELLATION_TASKS.size, cancellation.size
    assert(cancellation.all? { |t| t['dueDate'] == Date.current.iso8601 }, 'échéance = aujourd\'hui')
  end

  test 'cancelling with on_cancel templates uses them instead of the default list' do
    type_id = create_type([
      { name: 'Rembourser via Stripe', scope: 'activity', trigger: 'on_cancel' },
    ])
    training_id = create_training(type_id)

    patch "/api/v1/academy/trainings/#{training_id}/status", params: { status: 'cancelled' }, as: :json
    assert_response :success

    names = task_names(training_id).map { |t| t['name'] }
    assert_includes names, 'Rembourser via Stripe'
    assert_not_includes names, 'Annulation — gérer les remboursements'
  end

  test 'cancellation is idempotent' do
    type_id = create_type([])
    training_id = create_training(type_id)

    patch "/api/v1/academy/trainings/#{training_id}/status", params: { status: 'cancelled' }, as: :json
    patch "/api/v1/academy/trainings/#{training_id}/status", params: { status: 'cancelled' }, as: :json

    cancellation = task_names(training_id).select { |t| t['name'].start_with?('Annulation —') }
    assert_equal Academy::TaskGenerator::DEFAULT_CANCELLATION_TASKS.size, cancellation.size
  end
end
