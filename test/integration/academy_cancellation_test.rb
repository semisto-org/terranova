require 'test_helper'

# Flux d'annulation d'une activité Academy (issue #35) : le endpoint dédié passe
# le statut à « cancelled » ET génère la checklist d'annulation codée en dur
# (6 tâches, échéance du jour, non assignées, idempotente). Réservé aux admins.
class AcademyCancellationTest < ActionDispatch::IntegrationTest
  setup do
    Academy::Training.delete_all
    Academy::TrainingType.delete_all
    Task.delete_all
    TaskList.delete_all
    Member.delete_all

    @admin = Member.create!(
      first_name: 'Admin', last_name: 'Academy', email: 'admin-academy@example.test',
      avatar: '', status: 'active', is_admin: true, joined_at: Date.current
    )
    Thread.current[:test_member] = @admin

    @type = Academy::TrainingType.create!(name: 'Initiation', description: 'Base')
    @training = Academy::Training.create!(training_type: @type, title: 'Forêt comestible', status: 'in_preparation')
  end

  teardown { Thread.current[:test_member] = nil }

  test 'cancelling a training sets status to cancelled and generates the cancellation checklist' do
    patch "/api/v1/academy/trainings/#{@training.id}/cancel", as: :json
    assert_response :success
    assert_equal 'cancelled', JSON.parse(response.body)['status']

    @training.reload
    assert_equal 'cancelled', @training.status

    tasks = @training.tasks.where(academy_training_session_id: nil).to_a
    assert_equal Academy::TaskGenerator::CANCELLATION_TASKS, tasks.map(&:name).sort_by { |n| Academy::TaskGenerator::CANCELLATION_TASKS.index(n) }

    today = Time.find_zone!('Europe/Brussels').today
    tasks.each do |task|
      assert_equal today, task.due_date, "#{task.name} devrait être à échéance du jour"
      assert_nil task.assignee_id, "#{task.name} doit être non assignée"
      assert_equal 'pending', task.status
    end
  end

  test 'cancellation checklist is idempotent across de-cancel then re-cancel' do
    patch "/api/v1/academy/trainings/#{@training.id}/cancel", as: :json
    assert_response :success
    initial_count = @training.reload.tasks.count
    assert_equal Academy::TaskGenerator::CANCELLATION_TASKS.size, initial_count

    # Désannulation : on repasse à un autre statut via le sélecteur classique.
    patch "/api/v1/academy/trainings/#{@training.id}/status", params: { status: 'in_preparation' }, as: :json
    assert_response :success

    # Ré-annulation : pas de doublon (dédup par nom).
    patch "/api/v1/academy/trainings/#{@training.id}/cancel", as: :json
    assert_response :success
    assert_equal initial_count, @training.reload.tasks.count
  end

  test 'cancelling is forbidden for non-admin members' do
    non_admin = Member.create!(
      first_name: 'Membre', last_name: 'Lambda', email: 'membre-lambda@example.test',
      avatar: '', status: 'active', is_admin: false, joined_at: Date.current
    )
    Thread.current[:test_member] = non_admin

    patch "/api/v1/academy/trainings/#{@training.id}/cancel", as: :json
    assert_response :forbidden

    @training.reload
    assert_equal 'in_preparation', @training.status
    assert_equal 0, @training.tasks.count
  end
end
