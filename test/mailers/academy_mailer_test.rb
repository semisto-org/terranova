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

  test 'registration_confirmation embeds a MySemisto magic-link to the activity (#39)' do
    contact = Contact.create!(contact_type: 'person', name: 'Marie', email: 'marie@test.be')
    registration = Academy::TrainingRegistration.create!(
      training: @training, contact: contact, contact_name: 'Marie',
      contact_email: 'marie@test.be', payment_status: 'paid', registered_at: Time.current
    )

    with_env('MY_SEMISTO_HOST' => 'my.semisto.test') do
      mail = AcademyMailer.registration_confirmation(registration)
      body = mail.body.encoded

      # Lien magic-link basé sur le contact (login par code, pas de doublon),
      # pointant vers la page de l'activité (détails + covoiturage).
      assert_match %r{my\.semisto\.test/api/v1/auth/verify\?token=}, body
      assert_match %r{redirect=.*academy.*#{@training.id}}, body
      assert_match(/MySemisto/i, body)
    end
  end

  private

  def with_env(values)
    previous = {}
    values.each { |k, v| previous[k] = ENV[k]; ENV[k] = v }
    yield
  ensure
    previous.each { |k, v| v.nil? ? ENV.delete(k) : (ENV[k] = v) }
  end
end
