require 'test_helper'

class AcademyMailerTest < ActionMailer::TestCase
  setup do
    [Academy::TrainingSession, Academy::Training, Academy::TrainingType].each(&:delete_all)
    @type = Academy::TrainingType.create!(name: 'Permaculture')
    @training = Academy::Training.create!(
      training_type: @type, title: 'CFC', status: 'registrations_open',
      price: 0, max_participants: 20, description: 'x'
    )
    @session = @training.sessions.create!(start_date: Date.current - 2, end_date: Date.current - 1)
    @trainer = Contact.create!(contact_type: 'person', name: 'Laurence', email: 'laurence@test.be')
  end

  test 'trainer_document_request is sent to the trainer and cc formations@semisto.org' do
    mail = AcademyMailer.trainer_document_request(@session, @trainer)

    assert_equal ['laurence@test.be'], mail.to
    assert_includes Array(mail.cc), 'formations@semisto.org'
    assert_match(/documents/i, mail.subject)
  end
end
