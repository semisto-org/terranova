require 'test_helper'

class DesignProjectClientsTest < ActionDispatch::IntegrationTest
  setup do
    [Design::ProjectClient, Design::Project, Contact].each(&:delete_all)

    @project = Design::Project.create!(
      name: 'Projet clients test',
      client_id: 'client-1',
      client_name: 'Initial',
      client_email: 'initial@test.com',
      city: 'Yvoir',
      area: 1000,
      phase: 'reception',
      status: 'active',
      project_manager_id: ''
    )

    @alice = Contact.create!(contact_type: 'person', name: 'Alice Porteur', email: 'alice@test.com', phone: '+3247')
    @bob = Contact.create!(contact_type: 'person', name: 'Bob Porteur', email: 'bob@test.com', phone: '+3248')
  end

  test 'add existing contact as first client makes it primary and syncs denormalized fields' do
    post "/api/v1/design/#{@project.id}/clients", params: { contact_id: @alice.id }, as: :json
    assert_response :created

    items = response.parsed_body['items']
    assert_equal 1, items.size
    assert_equal @alice.id.to_s, items.first['contactId']
    assert items.first['isPrimary']

    @project.reload
    assert_equal 'Alice Porteur', @project.client_name
    assert_equal 'alice@test.com', @project.client_email
    assert_equal '+3247', @project.client_phone
  end

  test 'add client inline creates the contact (no duplicate on existing email)' do
    assert_difference -> { Contact.count }, 1 do
      post "/api/v1/design/#{@project.id}/clients",
           params: { name: 'Carol New', email: 'carol@test.com', phone: '+3249' }, as: :json
    end
    assert_response :created
    assert_equal 'carol@test.com', response.parsed_body['items'].first['email']

    # même email → pas de doublon de Contact, mais lien rejeté car déjà client
    assert_no_difference -> { Contact.count } do
      post "/api/v1/design/#{@project.id}/clients",
           params: { name: 'Carol Again', email: 'carol@test.com' }, as: :json
    end
    assert_response :unprocessable_entity
  end

  test 'set another client as primary repoints denormalized fields and demotes the former' do
    post "/api/v1/design/#{@project.id}/clients", params: { contact_id: @alice.id }, as: :json
    post "/api/v1/design/#{@project.id}/clients", params: { contact_id: @bob.id }, as: :json
    bob_link = @project.project_clients.find_by(contact_id: @bob.id)

    patch "/api/v1/design/#{@project.id}/clients/#{bob_link.id}", params: { is_primary: true }, as: :json
    assert_response :success

    primaries = response.parsed_body['items'].select { |c| c['isPrimary'] }
    assert_equal 1, primaries.size
    assert_equal @bob.id.to_s, primaries.first['contactId']

    @project.reload
    assert_equal 'Bob Porteur', @project.client_name
    assert_equal 'bob@test.com', @project.client_email
  end

  test 'cannot remove the last client' do
    post "/api/v1/design/#{@project.id}/clients", params: { contact_id: @alice.id }, as: :json
    link = @project.project_clients.first

    delete "/api/v1/design/#{@project.id}/clients/#{link.id}", as: :json
    assert_response :unprocessable_entity
    assert_equal 1, @project.reload.project_clients.count
  end

  test 'removing the primary repromotes another client' do
    post "/api/v1/design/#{@project.id}/clients", params: { contact_id: @alice.id }, as: :json
    post "/api/v1/design/#{@project.id}/clients", params: { contact_id: @bob.id }, as: :json
    alice_link = @project.project_clients.find_by(contact_id: @alice.id)
    assert alice_link.is_primary?

    delete "/api/v1/design/#{@project.id}/clients/#{alice_link.id}", as: :json
    assert_response :success

    items = response.parsed_body['items']
    assert_equal 1, items.size
    assert items.first['isPrimary'], 'remaining client should be promoted to primary'
    assert_equal @bob.id.to_s, items.first['contactId']

    @project.reload
    assert_equal 'Bob Porteur', @project.client_name
  end

  test 'project serialization includes clientContacts' do
    post "/api/v1/design/#{@project.id}/clients", params: { contact_id: @alice.id }, as: :json

    get "/api/v1/design/#{@project.id}", as: :json
    assert_response :success
    body = response.parsed_body
    project = body.fetch('project')
    assert project.key?('clientContacts'), 'project payload should expose clientContacts'
    assert_equal @alice.id.to_s, project['clientContacts'].first['contactId']
  end

  test 'GET clients lists linked contacts with primary first' do
    post "/api/v1/design/#{@project.id}/clients", params: { contact_id: @alice.id }, as: :json
    post "/api/v1/design/#{@project.id}/clients", params: { contact_id: @bob.id }, as: :json

    get "/api/v1/design/#{@project.id}/clients", as: :json
    assert_response :success
    items = response.parsed_body['items']
    assert_equal 2, items.size
    assert items.first['isPrimary']
  end
end
