require 'test_helper'

# Bloc Actus / notifications MySemisto (#17).
class AcademyAnnouncementsTest < ActionDispatch::IntegrationTest
  setup do
    @type = Academy::TrainingType.create!(name: "Actu #{SecureRandom.hex(3)}")
    @training = Academy::Training.create!(training_type: @type, title: 'Forêt 101', status: 'registrations_open')
    @other = Academy::Training.create!(training_type: @type, title: 'Autre', status: 'registrations_open')
    @contact = Contact.create!(contact_type: 'person', name: 'Marie', email: "m-#{SecureRandom.hex(3)}@t.be")
    Academy::TrainingRegistration.create!(
      training: @training, contact: @contact, contact_name: 'Marie', contact_email: @contact.email,
      payment_status: 'paid', carpooling: 'none', registered_at: Time.current
    )
  end

  def sign_in_contact(contact)
    token = Rails.application.message_verifier(:contact_login).generate(
      { contact_id: contact.id }, purpose: :contact_login, expires_in: 24.hours
    )
    get "/api/v1/my/auth/verify", params: { token: token }
  end

  test 'admin can create an announcement with confirmed/to_confirm status' do
    post "/api/v1/academy/trainings/#{@training.id}/announcements",
         params: { title: 'Lieu changé', body: 'RDV à la grange', status: 'to_confirm' }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 'to_confirm', body['status']
    assert_equal 'RDV à la grange', body['body']
  end

  test 'invalid status falls back to to_confirm' do
    post "/api/v1/academy/trainings/#{@training.id}/announcements",
         params: { body: 'x', status: 'bogus' }, as: :json
    assert_response :created
    assert_equal 'to_confirm', JSON.parse(response.body)['status']
  end

  test 'participant sees announcements of their own trainings, flagged toConfirm' do
    @training.announcements.create!(body: 'Confirmé !', status: 'confirmed')
    @training.announcements.create!(body: 'Peut-être', status: 'to_confirm')
    @other.announcements.create!(body: 'Pas pour Marie', status: 'confirmed')

    sign_in_contact(@contact)
    get '/api/v1/my/announcements', as: :json
    assert_response :success
    items = JSON.parse(response.body)['items']

    bodies = items.map { |i| i['body'] }
    assert_includes bodies, 'Confirmé !'
    assert_includes bodies, 'Peut-être'
    assert_not_includes bodies, 'Pas pour Marie', 'cloisonnement : pas les actus des autres activités'
    assert(items.find { |i| i['body'] == 'Peut-être' }['toConfirm'])
  end

  test 'admin can update and soft-delete an announcement' do
    a = @training.announcements.create!(body: 'Brouillon', status: 'to_confirm')
    patch "/api/v1/academy/announcements/#{a.id}", params: { status: 'confirmed' }, as: :json
    assert_response :success
    assert_equal 'confirmed', JSON.parse(response.body)['status']

    delete "/api/v1/academy/announcements/#{a.id}", as: :json
    assert_response :no_content
    assert a.reload.deleted?
  end
end
