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

  test 'registration_confirmation contains a MySemisto CTA to the activity page (#39)' do
    contact = Contact.create!(contact_type: 'person', name: 'Inès', email: 'ines@test.be')
    registration = Academy::TrainingRegistration.create!(
      training: @training, contact: contact, contact_name: 'Inès', contact_email: 'ines@test.be',
      payment_status: 'paid', carpooling: 'none', registered_at: Time.current
    )

    mail = AcademyMailer.registration_confirmation(registration)
    body = mail.html_part&.body&.decoded || mail.body.decoded

    assert_match(/MySemisto/i, body)
    assert_match(%r{/academy/#{@training.id}}, body)
  end

  test 'registration_confirmation still renders without a resolved contact' do
    registration = Academy::TrainingRegistration.create!(
      training: @training, contact_name: 'Sans Contact', contact_email: 'anon@test.be',
      payment_status: 'paid', carpooling: 'none', registered_at: Time.current
    )

    assert_nothing_raised { AcademyMailer.registration_confirmation(registration).body }
  end
end
