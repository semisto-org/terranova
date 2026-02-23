require 'test_helper'

class WebsiteControllerTest < ActionDispatch::IntegrationTest
  setup do
    Member.delete_all
    Academy::Training.delete_all
    Event.delete_all
    Page.delete_all

    @training = Academy::Training.create!(
      name: 'Formation Permaculture 101',
      description: 'Initiation à la permaculture',
      status: 'published',
      start_date: Date.current + 30,
      end_date: Date.current + 32
    )

    @event = Event.create!(
      title: 'Atelier Compost',
      start_date: Date.current + 15,
      end_date: Date.current + 15,
      location: 'Les 4 Sources'
    )
  end

  test 'homepage returns expected data structure' do
    get '/api/v1/website/homepage', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert body.key?('hero')
    assert body.key?('featured_trainings')
    assert body.key?('upcoming_events')
    assert body.key?('testimonials')
    assert body.key?('stats')
  end

  test 'trainings returns list of published trainings' do
    get '/api/v1/website/trainings', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert body.key?('trainings')
    assert body['trainings'].size >= 1
    assert_equal 'Formation Permaculture 101', body['trainings'].first['name']
  end

  test 'training_detail returns single training' do
    get "/api/v1/website/trainings/#{@training.id}", as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert_equal @training.id.to_s, body['id']
    assert_equal 'Formation Permaculture 101', body['name']
    assert body.key?('description')
    assert body.key?('dates')
    assert body.key?('registration')
  end

  test 'training_detail returns 404 for non-existent training' do
    get '/api/v1/website/trainings/999999', as: :json
    assert_response :not_found
  end

  test 'events returns list of upcoming events' do
    get '/api/v1/website/events', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert body.key?('events')
  end

  test 'event_detail returns single event' do
    get "/api/v1/website/events/#{@event.id}", as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert_equal @event.id.to_s, body['id']
    assert_equal 'Atelier Compost', body['title']
  end

  test 'contact_form creates contact submission' do
    post '/api/v1/website/contact', params: {
      name: 'Jean Dupont',
      email: 'jean@example.test',
      subject: 'Demande info',
      message: 'Bonjour, je voudrais des informations'
    }, as: :json

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 'success', body['status']
  end

  test 'contact_form validates required fields' do
    post '/api/v1/website/contact', params: {
      name: '',
      email: 'invalid-email',
      message: ''
    }, as: :json

    assert_response :unprocessable_entity
  end

  test 'newsletter_subscribe adds email to list' do
    post '/api/v1/website/newsletter', params: {
      email: 'subscriber@example.test',
      first_name: 'Jean'
    }, as: :json

    assert_response :created
  end

  test 'newsletter_subscribe validates email format' do
    post '/api/v1/website/newsletter', params: {
      email: 'invalid-email'
    }, as: :json

    assert_response :unprocessable_entity
  end

  test 'search returns results' do
    get '/api/v1/website/search?q=permaculture', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert body.key?('results')
    assert body.key?('total_count')
  end

  test 'sitemap returns sitemap data' do
    get '/api/v1/website/sitemap', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert body.key?('pages')
    assert body.key?('trainings')
    assert body.key?('events')
  end
end
