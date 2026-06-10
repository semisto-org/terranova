require 'test_helper'

class TallyIntakeTest < ActionDispatch::IntegrationTest
  setup do
    [Design::ProjectClient, Design::Project, Contact].each(&:delete_all)
    ENV.delete('TALLY_SIGNING_SECRET')
  end

  teardown do
    ENV.delete('TALLY_SIGNING_SECRET')
  end

  # Payload Tally réaliste (FORM_RESPONSE du formulaire d'intake w77j70).
  def intake_payload(submission_id: 'sub-1', form_id: 'w77j70')
    {
      eventType: 'FORM_RESPONSE',
      data: {
        submissionId: submission_id,
        responseId: "resp-#{submission_id}",
        formId: form_id,
        fields: [
          { label: 'Votre nom et prénom', type: 'INPUT_TEXT', value: 'Jeanne Demande' },
          { label: 'Votre adresse e-mail', type: 'INPUT_EMAIL', value: 'jeanne@example.com' },
          { label: 'Votre numéro de téléphone', type: 'INPUT_PHONE_NUMBER', value: '+32470112233' },
          { label: 'Rue', type: 'INPUT_TEXT', value: 'Rue des Sources 1' },
          { label: 'Localité', type: 'INPUT_TEXT', value: 'Yvoir' },
          { label: 'Superficie envisagée', type: 'INPUT_TEXT', value: 'environ 2500 m²' },
          { label: 'Type de projet', type: 'MULTIPLE_CHOICE', value: ['o5'],
            options: [{ id: 'o5', text: 'École ou université' }] },
          { label: 'Vous êtes intéressés par', type: 'CHECKBOXES', value: %w[a c],
            options: [{ id: 'a', text: 'Un design' }, { id: 'c', text: 'Du coaching' }] },
          { label: 'Comment avez-vous connu Semisto', type: 'MULTIPLE_CHOICE', value: ['p'],
            options: [{ id: 'p', text: 'Via la presse' }] },
          { label: 'Photos/documents', type: 'FILE_UPLOAD',
            value: [{ url: 'https://storage.tally.so/abc/plan.jpg', name: 'plan.jpg' }] }
        ]
      }
    }.to_json
  end

  def sign(payload, secret)
    Base64.strict_encode64(OpenSSL::HMAC.digest('SHA256', secret, payload))
  end

  def post_webhook(payload, headers: {})
    post '/api/v1/public/tally-webhooks', params: payload,
         headers: { 'CONTENT_TYPE' => 'application/json' }.merge(headers)
  end

  test 'valid submission creates a reception project with mapped fields and primary client' do
    assert_difference -> { Design::Project.count }, 1 do
      post_webhook(intake_payload)
    end
    assert_response :success

    project = Design::Project.find_by(tally_submission_id: 'sub-1')
    assert_not_nil project
    assert_equal 'reception', project.phase
    assert_equal 'active', project.status
    assert_equal 'Jeanne Demande', project.client_name
    assert_equal 'jeanne@example.com', project.client_email
    assert_equal '+32470112233', project.client_phone
    assert_equal 'Rue des Sources 1', project.street
    assert_equal 'Yvoir', project.city
    assert_equal 'public', project.project_type
    assert_equal %w[design personalized_coaching], project.client_interests
    assert_equal 'presse', project.acquisition_channel
    assert_equal '', project.project_manager_id

    # area NON rempli (reste à 0), superficie consignée dans les notes
    assert_equal 0, project.area
    assert_includes project.notes, '2500'
    assert_includes project.notes, 'plan.jpg'
    assert_includes project.notes, 'Demande reçue via Tally'

    # demandeur = contact primaire
    primary = project.primary_client_contact
    assert_not_nil primary
    assert_equal 'jeanne@example.com', primary.email
    assert project.project_clients.find_by(contact_id: primary.id).is_primary?
  end

  test 'replaying the same submission creates no second project nor contact' do
    post_webhook(intake_payload(submission_id: 'sub-dup'))
    assert_response :success

    assert_no_difference ['Design::Project.count', 'Contact.count'] do
      post_webhook(intake_payload(submission_id: 'sub-dup'))
    end
    assert_response :success
    assert_equal 1, Design::Project.where(tally_submission_id: 'sub-dup').count
  end

  test 'submission from another formId is ignored' do
    assert_no_difference -> { Design::Project.count } do
      post_webhook(intake_payload(form_id: 'other999'))
    end
    assert_response :success
  end

  test 'invalid signature with configured secret returns 401 and creates nothing' do
    ENV['TALLY_SIGNING_SECRET'] = 's3cr3t'
    payload = intake_payload(submission_id: 'sub-sig')

    assert_no_difference -> { Design::Project.count } do
      post_webhook(payload, headers: { 'tally-signature' => 'wrong-signature' })
    end
    assert_response :unauthorized
  end

  test 'valid signature with configured secret is accepted' do
    ENV['TALLY_SIGNING_SECRET'] = 's3cr3t'
    payload = intake_payload(submission_id: 'sub-ok')

    assert_difference -> { Design::Project.count }, 1 do
      post_webhook(payload, headers: { 'tally-signature' => sign(payload, 's3cr3t') })
    end
    assert_response :success
  end

  test 'reception phase project does not break the methodology endpoint' do
    post_webhook(intake_payload(submission_id: 'sub-methodo'))
    project = Design::Project.find_by(tally_submission_id: 'sub-methodo')

    get "/api/v1/design/#{project.id}/methodology", as: :json
    assert_response :success
    assert response.parsed_body['steps'].present?
  end

  test 'malformed JSON returns 400' do
    # Content-Type non-JSON : on atteint le `rescue JSON::ParserError` du contrôleur.
    # En application/json, le middleware Rails lèverait ParseError avant l'action
    # (renvoie quand même 400) mais ça casse la génération de la spec OpenAPI.
    post '/api/v1/public/tally-webhooks', params: '{ not json',
         headers: { 'CONTENT_TYPE' => 'text/plain' }
    assert_response :bad_request
  end
end
