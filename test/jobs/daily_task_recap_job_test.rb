require 'test_helper'

# Récap quotidien Slack des tâches cochées (#43).
class DailyTaskRecapJobTest < ActiveJob::TestCase
  setup do
    @type = Academy::TrainingType.create!(name: "Recap #{SecureRandom.hex(3)}")
    @training = Academy::Training.create!(training_type: @type, title: 'Recap T', status: 'in_progress')
    @list = @training.unified_task_lists.create!(name: 'À faire', position: 0)
    @alice = Member.create!(first_name: 'Alice', last_name: 'A', email: "a-#{SecureRandom.hex(3)}@t.be", joined_at: Date.current)
    @bob = Member.create!(first_name: 'Bob', last_name: 'B', email: "b-#{SecureRandom.hex(3)}@t.be", joined_at: Date.current)
  end

  def complete_task(name, member, completed_at: Time.current)
    @list.tasks.create!(name: name, status: 'completed', completed_by_id: member.id, completed_at: completed_at)
  end

  test 'aggregates tasks completed today grouped by person' do
    complete_task('Réserver salle', @alice)
    complete_task('Envoyer mail', @alice)
    complete_task('Appeler traiteur', @bob)

    SlackNotifier.expects(:post).with do |args|
      text = args[:text]
      text.include?('*Alice A* (2)') && text.include?('*Bob B* (1)') &&
        text.include?('Réserver salle') && text.include?('Appeler traiteur')
    end
    DailyTaskRecapJob.perform_now
  end

  test 'posts nothing when no task was completed today' do
    # une tâche complétée il y a 3 jours ne compte pas pour aujourd'hui
    complete_task('Vieux truc', @alice, completed_at: 3.days.ago)
    SlackNotifier.expects(:post).never
    DailyTaskRecapJob.perform_now
  end

  test 'is idempotent — re-running does not re-post already-recapped tasks' do
    complete_task('Réserver salle', @alice)

    SlackNotifier.expects(:post).once
    DailyTaskRecapJob.perform_now   # poste + marque recapped_at
    DailyTaskRecapJob.perform_now   # rien de neuf → aucun envoi
  end

  test 'pending and in_progress tasks are excluded' do
    @list.tasks.create!(name: 'En cours', status: 'in_progress')
    @list.tasks.create!(name: 'À faire', status: 'pending')
    SlackNotifier.expects(:post).never
    DailyTaskRecapJob.perform_now
  end
end
