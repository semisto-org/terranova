require 'test_helper'

class PlantCardsTest < ActionDispatch::IntegrationTest
  setup do
    Plant::Species.delete_all
    Plant::Genus.delete_all

    # Create an admin member and log in
    @admin = Member.create!(
      first_name: 'Admin', last_name: 'Test',
      email: 'admin-card@example.org',
      password: 'testpassword123',
      joined_at: 1.year.ago,
      status: :active,
      member_kind: 'human',
      membership_type: 'effective'
    )
    post '/login', params: { email: @admin.email, password: 'testpassword123' }

    @species = Plant::Species.create!(
      latin_name: 'Amelanchier canadensis',
      plant_type: 'shrub'
    )
  end

  test 'GET /plants/species/:id/card returns 200 with latin name' do
    get "/plants/species/#{@species.id}/card"
    assert_response :success
    assert_match 'Amelanchier canadensis', response.body
  end

  test 'GET card renders strate badge when set' do
    @species.update!(strate: 'shrub')
    get "/plants/species/#{@species.id}/card"
    assert_match 'strate-badge', response.body
    assert_match 'Arbrisseau', response.body
  end

  test 'photos render with role tags and placeholder fallback' do
    contributor = Plant::Contributor.create!(
      name: 'Test',
      avatar_url: '',
      joined_at: Date.current,
      lab_id: 'lab-test'
    )
    Plant::Photo.create!(
      target_type: 'species',
      target_id: @species.id,
      role: 'flower',
      url: 'https://example.org/flower.jpg',
      contributor_id: contributor.id
    )
    get "/plants/species/#{@species.id}/card"
    assert_match 'https://example.org/flower.jpg', response.body
    assert_match 'Floraison', response.body
    assert_match 'Photo manquante', response.body  # fruit placeholder
  end

  test 'cross-section frame renders with human silhouette' do
    get "/plants/species/#{@species.id}/card"
    assert_match 'class="cross-section"', response.body
    assert_match 'class="above-ground"', response.body
    assert_match 'class="below-ground"', response.body
    assert_match 'href="#human-1m70"', response.body
  end

  test 'silhouette partial selected by growth_habit' do
    @species.update!(growth_habit: 'arbustif-arrondi', height_max_cm: 500)
    get "/plants/species/#{@species.id}/card"
    assert_match 'class="plant-bg"', response.body
    # The silhouette renders its trunk
    assert_match 'fill="#5a4a36"', response.body
  end

  test 'silhouette default partial when growth_habit is nil' do
    @species.update!(growth_habit: nil, height_max_cm: 200)
    get "/plants/species/#{@species.id}/card"
    assert_match 'class="plant-bg"', response.body
    # default uses thin 4px trunk
    assert_match 'width="4"', response.body
  end

  test 'roots partial selected by root_system' do
    @species.update!(root_system: 'spreading')
    get "/plants/species/#{@species.id}/card"
    assert_match 'class="roots"', response.body
    # spreading has many curved paths
    assert_match 'M120 22 Q70 26', response.body
  end

  test 'soil scales render with active segments and root type label' do
    @species.update!(
      soil_texture: ['balanced', 'heavy'],
      soil_richness: 'moderate',
      soil_ph: ['acid', 'neutral'],
      root_system: 'spreading'
    )
    get "/plants/species/#{@species.id}/card"
    assert_match 'class="soil-scales"', response.body
    assert_match 'Texture', response.body
    assert_match 'Humus', response.body
    assert_match 'pH', response.body
    assert_match 'Traçant', response.body  # root_type-label
  end

  test 'sky tiles render with foliage, sun, water' do
    @species.update!(
      foliage_type: 'deciduous',
      exposures: ['sun', 'partial-shade'],
      watering_need: '3'
    )
    get "/plants/species/#{@species.id}/card"
    assert_match 'class="sky-tiles"', response.body
    assert_match 'Caduc', response.body
    assert_match 'Modéré', response.body
    assert_match '#sun-full', response.body
  end
end
