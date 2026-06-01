require 'test_helper'

class TrainerDocumentRequestJobTest < ActiveJob::TestCase
  include ActionMailer::TestHelper

  setup do
    [Academy::TrainingSession, Academy::Training, Academy::TrainingType].each(&:delete_all)

    @type = Academy::TrainingType.create!(name: 'Permaculture')
    @training = Academy::Training.create!(
      training_type: @type, title: 'CFC', status: 'registrations_open',
      price: 0, max_participants: 20, description: 'x'
    )
    @trainer = Contact.create!(contact_type: 'person', name: 'Laurence', email: 'laurence@test.be')
  end

  test 'emails trainers of a session that ended yesterday and sets the flag' do
    session = @training.sessions.create!(
      start_date: Date.current - 3, end_date: Date.current - 1,
      trainer_ids: [@trainer.id.to_s]
    )

    assert_enqueued_emails 1 do
      TrainerDocumentRequestJob.perform_now
    end

    assert_not_nil session.reload.trainer_docs_requested_at
  end

  test 'is idempotent — already-notified sessions are skipped' do
    @training.sessions.create!(
      start_date: Date.current - 3, end_date: Date.current - 1,
      trainer_ids: [@trainer.id.to_s], trainer_docs_requested_at: Time.current
    )

    assert_no_enqueued_emails do
      TrainerDocumentRequestJob.perform_now
    end
  end

  test 'ignores sessions that have not ended yet' do
    @training.sessions.create!(
      start_date: Date.current, end_date: Date.current + 2,
      trainer_ids: [@trainer.id.to_s]
    )

    assert_no_enqueued_emails do
      TrainerDocumentRequestJob.perform_now
    end
  end

  test 'ignores sessions without trainers' do
    @training.sessions.create!(
      start_date: Date.current - 3, end_date: Date.current - 1, trainer_ids: []
    )

    assert_no_enqueued_emails do
      TrainerDocumentRequestJob.perform_now
    end
  end
end
