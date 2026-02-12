require 'test_helper'

class PlantsStep1Test < ActionDispatch::IntegrationTest
  setup do
    [
      Plant::PaletteItem,
      Plant::Palette,
      Plant::ActivityItem,
      Plant::NurseryStock,
      Plant::Location,
      Plant::Note,
      Plant::Photo,
      Plant::Reference,
      Plant::CommonName,
      Plant::Variety,
      Plant::AiSummary,
      Plant::Species,
      Plant::Genus,
      Plant::Contributor
    ].each(&:delete_all)

    @contributor = Plant::Contributor.create!(
      name: 'Test Contributor',
      avatar_url: '',
      joined_at: Date.current,
      lab_id: 'lab-test'
    )

    @genus = Plant::Genus.create!(latin_name: 'Malus', description: 'Pommiers')

    @species = Plant::Species.create!(
      genus: @genus,
      latin_name: 'Malus domestica',
      plant_type: 'tree',
      exposures: ['sun'],
      hardiness: 'zone-7',
      edible_parts: ['fruit'],
      interests: ['edible']
    )

    @variety = Plant::Variety.create!(
      species: @species,
      latin_name: "Malus domestica 'Reinette'",
      productivity: 'high',
      fruit_size: 'medium',
      taste_rating: 4,
      storage_life: '2 months',
      maturity: 'mid',
      disease_resistance: 'medium'
    )

    Plant::CommonName.create!(target_type: 'species', target_id: @species.id, language: 'fr', name: 'Pommier')
    Plant::CommonName.create!(target_type: 'genus', target_id: @genus.id, language: 'fr', name: 'Pommiers')
    Plant::CommonName.create!(target_type: 'variety', target_id: @variety.id, language: 'fr', name: 'Reinette')
    Plant::Reference.create!(target_type: 'species', target_id: @species.id, reference_type: 'link', title: 'Ref', url: 'https://example.com', source: 'web')
    Plant::Photo.create!(target_type: 'species', target_id: @species.id, url: 'https://example.com/photo.jpg', caption: 'photo', contributor: @contributor)
    Plant::Note.create!(target_type: 'species', target_id: @species.id, contributor: @contributor, content: 'note', language: 'fr', photos: [])
    Plant::Location.create!(target_type: 'species', target_id: @species.id, latitude: 50.1, longitude: 4.2, place_name: 'Site test', is_public: true)
    Plant::NurseryStock.create!(target_type: 'species', target_id: @species.id, nursery_id: 'n-1', nursery_name: 'Nursery', quantity: 3, age: '2y', price: 12)
    Plant::ActivityItem.create!(activity_type: 'note_added', contributor: @contributor, target_type: 'species', target_id: @species.id, target_name: @species.latin_name, timestamp: Time.current)
  end

  test 'search returns matching species' do
    get '/api/v1/plants/search', params: { query: 'Malus' }, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    types = body['items'].map { |item| item['type'] }
    assert_includes types, 'genus'
    assert_includes types, 'species'
    assert_includes types, 'variety'
    assert_includes body['items'].map { |item| item['latinName'] }, 'Malus domestica'
  end

  test 'species detail returns rich payload' do
    get "/api/v1/plants/species/#{@species.id}", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 'Malus domestica', body['species']['latinName']
    assert_equal 'Malus', body['genus']['latinName']
    assert_operator body['varieties'].size, :>=, 1
    assert_operator body['references'].size, :>=, 1
    assert_operator body['photos'].size, :>=, 1
    assert_operator body['notes'].size, :>=, 1
    assert_operator body['locations'].size, :>=, 1
    assert_operator body['nurseryStock'].size, :>=, 1
  end

  test 'generate ai summary transitions to success' do
    post '/api/v1/plants/ai-summary', params: { target_type: 'species', target_id: @species.id }, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 'success', body['status']
    assert body['content'].present?
  end

  test 'palette create add move remove item flow works' do
    post '/api/v1/plants/palettes', params: { name: 'Palette test', description: 'desc', created_by: 'tester' }, as: :json
    assert_response :created
    palette = JSON.parse(response.body)

    post "/api/v1/plants/palettes/#{palette['id']}/items", params: { item_type: 'species', item_id: @species.id, strate_key: 'trees', position: 1 }, as: :json
    assert_response :created
    item_id = JSON.parse(response.body)['id']

    patch "/api/v1/plants/palette-items/#{item_id}", params: { strate_key: 'shrubs', position: 2 }, as: :json
    assert_response :success
    assert_equal 'shrubs', JSON.parse(response.body)['strateKey']

    delete "/api/v1/plants/palette-items/#{item_id}", as: :json
    assert_response :no_content
  end

  test 'create contribution endpoints update feed and contributor stats' do
    post '/api/v1/plants/notes',
         params: { target_type: 'species', target_id: @species.id, contributor_id: @contributor.id, content: 'Nouvelle note', language: 'fr', photos: [] },
         as: :json
    assert_response :created

    post '/api/v1/plants/photos',
         params: { target_type: 'species', target_id: @species.id, contributor_id: @contributor.id, url: 'https://example.com/new.jpg', caption: 'new' },
         as: :json
    assert_response :created

    post '/api/v1/plants/references',
         params: { target_type: 'species', target_id: @species.id, reference_type: 'link', title: 'Reference', url: 'https://example.com/ref', source: 'web', contributor_id: @contributor.id },
         as: :json
    assert_response :created

    get '/api/v1/plants/activity', as: :json
    assert_response :success
    types = JSON.parse(response.body)['items'].map { |item| item['type'] }
    assert_includes types, 'note_added'
    assert_includes types, 'photo_added'
    assert_includes types, 'reference_added'

    @contributor.reload
    assert_operator @contributor.notes_written, :>=, 1
    assert_operator @contributor.photos_added, :>=, 1
    assert_operator @contributor.semos_earned, :>=, 10
  end
end
