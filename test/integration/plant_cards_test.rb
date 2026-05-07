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

  test 'verso calendar marks flowering and harvest months' do
    @species.update!(flowering_months: ['mar', 'apr'], harvest_months: ['jun', 'jul'])
    get "/plants/species/#{@species.id}/card"
    assert_match 'class="cal-line"', response.body
    assert_match 'class="cell flow"', response.body
    assert_match 'class="cell harv"', response.body
  end

  test 'verso calendar shows both class for overlapping months' do
    @species.update!(flowering_months: ['aug'], harvest_months: ['aug'])
    get "/plants/species/#{@species.id}/card"
    assert_match 'class="cell both"', response.body
  end

  test 'pollination section renders when fertility or pollinators present' do
    @species.update!(
      fertility: 'partially-self-fertile',
      specific_pollinators: ['bees', 'hoverflies'],
      pollination_distance_m: 30
    )
    get "/plants/species/#{@species.id}/card"
    assert_match 'class="pollin-section"', response.body
    assert_match 'Part. auto-fertile', response.body
    assert_match 'abeilles, syrphes', response.body
    assert_match '&lt; 30 m', response.body
  end

  test 'pollination section hidden when no pollination data' do
    @species.update!(fertility: '', specific_pollinators: [], pollination_distance_m: nil)
    get "/plants/species/#{@species.id}/card"
    assert_no_match 'class="pollin-section"', response.body
  end

  test 'eco services grid renders 12 items with state classes' do
    @species.update!(
      eco_services_provided: ['windbreak', 'mellifere'],
      eco_services_needed: ['nitrogen', 'windbreak']
    )
    get "/plants/species/#{@species.id}/card"
    assert_match 'class="eco-grid"', response.body
    assert_match 'class="eco-item service"', response.body
    assert_match 'class="eco-item need"', response.body
    assert_match 'class="eco-item both"', response.body
    assert_match 'Brise-vent', response.body
    assert_match 'Mellifère', response.body
  end

  test 'resources grid renders 6 categories with parts' do
    @species.update!(resource_parts: { 'edible' => ['fruit', 'flower'], 'medicinal' => ['bark', 'fruit'] })
    get "/plants/species/#{@species.id}/card"
    assert_match 'class="resource-grid-c"', response.body
    assert_match 'Comestible', response.body
    assert_match 'fruit, fleur', response.body
    assert_match 'écorce, fruit', response.body
    # Empty categories show '—'
    assert_match 'Aromatique', response.body
    assert_match 'class="resource-c off"', response.body
  end

  test 'warnings banner shows when species has flags' do
    @species.update!(is_drageonnant: true, toxicity: { 'sheep' => ['seeds'] })
    get "/plants/species/#{@species.id}/card"
    assert_match 'class="warnings-banner"', response.body
    assert_match 'Drageonne', response.body
    assert_match 'Toxique brebis', response.body
  end

  test 'warnings banner hidden when species has no flags' do
    get "/plants/species/#{@species.id}/card"
    assert_no_match 'class="warnings-banner"', response.body
  end

  test 'qr code embeds public slug url and signature renders' do
    @species.update!(latin_name: 'Amelanchier canadensis')
    get "/plants/species/#{@species.id}/card"
    assert_match 'qr-corner', response.body
    assert_match 'Fiche réalisée par', response.body
    assert_match 'plantes.semisto.org', response.body
  end

  test 'batch print returns 200 with multiple species' do
    s2 = Plant::Species.create!(latin_name: 'Quercus robur', plant_type: 'tree')
    s3 = Plant::Species.create!(latin_name: 'Ribes nigrum', plant_type: 'shrub')
    get "/plants/cards?ids=#{@species.id},#{s2.id},#{s3.id}"
    assert_response :success
    assert_match 'Amelanchier canadensis', response.body
    assert_match 'Quercus robur', response.body
    assert_match 'Ribes nigrum', response.body
  end

  test 'batch print rejects more than 24 ids' do
    ids = (1..25).map(&:to_s).join(',')
    get "/plants/cards?ids=#{ids}"
    assert_response :unprocessable_entity
  end

  test 'batch print rejects empty ids' do
    get '/plants/cards?ids='
    assert_response :unprocessable_entity
  end

  test 'batch print silently drops unknown ids' do
    get "/plants/cards?ids=#{@species.id},999999"
    assert_response :success
    assert_match 'Amelanchier canadensis', response.body
  end

  test 'batch print includes both recto and verso pages' do
    s2 = Plant::Species.create!(latin_name: 'Quercus robur', plant_type: 'tree')
    get "/plants/cards?ids=#{@species.id},#{s2.id}"
    assert_response :success
    pages_count = response.body.scan(/class="a4-page"/).size
    assert_equal 2, pages_count  # 1 recto page + 1 verso page
  end

  test 'batch print 5 cards produces 4 pages (2 rectos + 2 versos)' do
    s2 = Plant::Species.create!(latin_name: 'Quercus robur', plant_type: 'tree')
    s3 = Plant::Species.create!(latin_name: 'Ribes nigrum', plant_type: 'shrub')
    s4 = Plant::Species.create!(latin_name: 'Malus domestica', plant_type: 'tree')
    s5 = Plant::Species.create!(latin_name: 'Prunus avium', plant_type: 'tree')
    get "/plants/cards?ids=#{@species.id},#{s2.id},#{s3.id},#{s4.id},#{s5.id}"
    assert_response :success
    pages_count = response.body.scan(/class="a4-page"/).size
    assert_equal 4, pages_count
  end
end
