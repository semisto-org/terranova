require 'test_helper'

class NotionRecordsControllerTest < ActionDispatch::IntegrationTest
  setup do
    NotionRecord.delete_all

    @notion_record = NotionRecord.create!(
      notion_id: 'test-page-123',
      database_id: 'db-456',
      database_name: 'Contacts',
      title: 'Test Record',
      properties: { 'Name' => 'Test', 'Email' => 'test@example.com' },
      content_html: '<p>Test content</p>'
    )
  end

  test 'search requires query parameter' do
    get '/api/v1/notion_records/search', as: :json
    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_includes body['error'], 'q parameter is required'
  end

  test 'search returns matching records' do
    get '/api/v1/notion_records/search?q=Test', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert body.key?('results')
    assert body.key?('total')
    assert body['results'].size >= 1
  end

  test 'search filters by database_name' do
    get '/api/v1/notion_records/search?q=Test&database_name=Contacts', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert body['results'].size >= 1
  end

  test 'search supports pagination' do
    get '/api/v1/notion_records/search?q=Test&limit=10&offset=0', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert_equal 10, body['limit']
    assert_equal 0, body['offset']
  end

  test 'upsert creates new record' do
    post '/api/v1/notion_records/upsert', params: {
      notion_id: 'new-page-999',
      database_id: 'db-789',
      database_name: 'New Database',
      title: 'New Record',
      properties: { 'Name' => 'New', 'Status' => 'Active' },
      content_html: '<p>New content</p>'
    }, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'ok', body['status']
    assert body['id'].present?
    assert_equal true, body['created']
    
    assert_equal 2, NotionRecord.count
  end

  test 'upsert updates existing record' do
    post '/api/v1/notion_records/upsert', params: {
      notion_id: 'test-page-123',
      database_id: 'db-456',
      database_name: 'Contacts',
      title: 'Updated Record Title',
      properties: { 'Name' => 'Updated', 'Email' => 'updated@example.com' },
      content_html: '<p>Updated content</p>'
    }, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'ok', body['status']
    assert_equal @notion_record.id, body['id']
    assert_equal false, body['created']
    
    @notion_record.reload
    assert_equal 'Updated Record Title', @notion_record.title
    assert_equal 'updated@example.com', @notion_record.properties['Email']
  end

  test 'upsert validates required fields' do
    post '/api/v1/notion_records/upsert', params: {
      notion_id: '',
      database_id: '',
      title: ''
    }, as: :json

    assert_response :unprocessable_entity
  end
end
