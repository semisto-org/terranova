require 'test_helper'

module Academy
  class TaskGeneratorTest < ActiveSupport::TestCase
    setup do
      @type = Academy::TrainingType.create!(
        name: "Focus #{SecureRandom.hex(3)}",
        task_templates: [
          { "name" => "Envoyer feedback", "scope" => "activity", "anchor" => "end", "offset_days" => -90 },
          { "name" => "Réserver la salle", "scope" => "session", "anchor" => "start", "offset_days" => -7 },
        ]
      )
      @training = Academy::Training.create!(title: "Cursus", status: "idea", training_type: @type)
    end

    test 'activity-scoped task is seeded at training creation (no date until a session exists)' do
      task = @training.tasks.find_by(name: "Envoyer feedback")
      assert task, "la tâche d'activité doit être créée"
      assert_nil task.due_date
      assert_nil task.academy_training_session_id
    end

    test 'creating a session generates session tasks and dates the activity task' do
      Academy::TrainingSession.create!(training: @training, start_date: Date.new(2026, 9, 1), end_date: Date.new(2026, 9, 3))
      @training.reload

      session_task = @training.tasks.find_by(name: "Réserver la salle — 1 Sep 2026")
      assert session_task, "la tâche de session doit être générée"
      assert_equal Date.new(2026, 8, 25), session_task.due_date # 1 sept - 7j
      assert session_task.academy_training_session_id.present?

      activity_task = @training.tasks.find_by(name: "Envoyer feedback")
      assert_equal Date.new(2026, 6, 5), activity_task.due_date # 3 sept - 90j
    end

    test 'generation is idempotent for a session' do
      session = Academy::TrainingSession.create!(training: @training, start_date: Date.new(2026, 9, 1), end_date: Date.new(2026, 9, 3))
      count = @training.reload.tasks.count
      Academy::TaskGenerator.for_session(session)
      assert_equal count, @training.reload.tasks.count
    end

    test 'no templates means no generated tasks' do
      bare_type = Academy::TrainingType.create!(name: "Vide #{SecureRandom.hex(3)}")
      training = Academy::Training.create!(title: "Sans template", status: "idea", training_type: bare_type)
      Academy::TrainingSession.create!(training: training, start_date: Date.current, end_date: Date.current)
      assert_equal 0, training.reload.tasks.count
    end
  end
end
