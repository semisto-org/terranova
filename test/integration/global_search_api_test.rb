require 'test_helper'

class GlobalSearchApiTest < ActionDispatch::IntegrationTest
  setup do
    Design::Project.delete_all
    Contact.delete_all
    Plant::Species.delete_all
    Academy::Training.delete_all
    Academy::TrainingType.delete_all
    Note.delete_all
    Design::ProjectDocument.delete_all
    KnowledgeTopic.delete_all
    NotionRecord.delete_all

    @project = Design::Project.create!(name: 'Projet Forêt Jardin', client_id: 'c-1', client_name: 'Alice', phase: 'offre', status: 'active')
    Contact.create!(name: 'Project Partner', contact_type: 'organization', email: 'partner@example.com')
    Plant::Species.create!(latin_name: 'Malus domestica', plant_type: 'fruit-tree', description: 'Pommier de training')
    training_type = Academy::TrainingType.create!(name: 'Permaculture')
    Academy::Training.create!(title: 'Training verger', status: 'published', training_type: training_type)
    Note.create!(title: 'Note projet', body: 'project launch notes')
    Design::ProjectDocument.create!(name: 'Plan projet', category: 'plan', url: '/files/plan.pdf', uploaded_at: Time.current)
    KnowledgeTopic.create!(title: 'Knowledge Project', content: 'Comment gérer un project', status: 'published')
    NotionRecord.create!(notion_id: 'n1', database_id: 'db1', database_name: 'Projects', title: 'Project hub')
  end

  test 'global search returns grouped sections' do
    get '/api/v1/search/global?q=project', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body['sections'].any?
    assert body['total'] >= 3
  end

  test 'ranking favors title matches' do
    Note.create!(title: 'misc', body: 'project project project')
    get '/api/v1/search/global?q=projet&types=projects,notes', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    project_section = body['sections'].find { |s| s['section'] == 'Projets' }
    assert_equal @project.id, project_section['items'].first['id']
  end

  test 'filter by status works' do
    get '/api/v1/search/global?q=project&types=contacts&status=organization', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['total']
  end
end
