require 'test_helper'

class DesignStudioApiTest < ActionDispatch::IntegrationTest
  setup do
    [AlbumMediaItem, Album, Design::Quote, Design::QuoteLine, Design::ProjectDocument, Design::ProjectTimesheet, Design::TeamMember, Design::Project, Contact, Organization, Member].each(&:delete_all)

    @member = Member.create!(
      first_name: 'Alice',
      last_name: 'Designer',
      email: 'alice@example.test',
      avatar: '',
      status: 'active',
      is_admin: true,
      joined_at: Date.current
    )

    @client = Contact.create!(
      contact_type: 'individual',
      name: 'Client Test',
      email: 'client@example.test'
    )

    @project = Design::Project.create!(
      name: 'Projet Forêt Test',
      client_name: 'Client Test',
      client_email: 'client@example.test',
      phase: 'discovery',
      status: 'active',
      location: 'Yvoir',
      surface_area: 1000,
      author: @member
    )
  end

  test 'index returns projects list' do
    get '/api/v1/design/projects', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body.key?('projects')
    assert_equal 1, body['projects'].size
    assert_equal 'Projet Forêt Test', body['projects'].first['name']
  end

  test 'show project with details' do
    get "/api/v1/design/projects/#{@project.id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal @project.id.to_s, body['id']
    assert_equal 'Projet Forêt Test', body['name']
    assert_equal 'discovery', body['phase']
    assert body.key?('phases')
    assert body.key?('team')
    assert body.key?('documents')
    assert body.key?('quotes')
  end

  test 'create project with valid params' do
    post '/api/v1/design/projects', params: {
      name: 'Nouveau Projet',
      client_name: 'Nouveau Client',
      client_email: 'new@example.test',
      phase: 'design',
      status: 'active',
      location: 'Bruxelles',
      surface_area: 500,
      author_id: @member.id
    }, as: :json

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 'Nouveau Projet', body['name']
    assert_equal 'design', body['phase']
  end

  test 'create project validates required fields' do
    post '/api/v1/design/projects', params: {
      name: '',
      client_name: '',
      phase: 'design'
    }, as: :json

    assert_response :unprocessable_entity
  end

  test 'update project phase and status' do
    patch "/api/v1/design/projects/#{@project.id}", params: {
      phase: 'installation',
      status: 'completed',
      surface_area: 1200
    }, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'installation', body['phase']
    assert_equal 'completed', body['status']
    assert_equal 1200, body['surfaceArea']
  end

  test 'destroy project soft deletes' do
    delete "/api/v1/design/projects/#{@project.id}", as: :json
    assert_response :no_content
    
    @project.reload
    assert @project.deleted_at.present?
  end

  test 'project phases CRUD' do
    # Add phase
    post "/api/v1/design/projects/#{@project.id}/phases", params: {
      name: 'Phase Test',
      description: 'Description phase',
      status: 'in_progress'
    }, as: :json
    
    assert_response :created
    phase = JSON.parse(response.body)
    phase_id = phase['id']
    
    # Update phase
    patch "/api/v1/design/projects/#{@project.id}/phases/#{phase_id}", params: {
      name: 'Phase Renommée',
      status: 'completed'
    }, as: :json
    
    assert_response :success
    assert_equal 'Phase Renommée', JSON.parse(response.body)['name']
    
    # Delete phase
    delete "/api/v1/design/projects/#{@project.id}/phases/#{phase_id}", as: :json
    assert_response :no_content
  end

  test 'project team members management' do
    post "/api/v1/design/projects/#{@project.id}/team_members", params: {
      member_id: @member.id,
      role: 'lead_designer'
    }, as: :json
    
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal @member.id.to_s, body['memberId']
    assert_equal 'lead_designer', body['role']
    
    # Remove team member
    membership_id = body['id']
    delete "/api/v1/design/projects/#{@project.id}/team_members/#{membership_id}", as: :json
    assert_response :no_content
  end
end
