require 'test_helper'

class PublicSpeciesTest < ActionDispatch::IntegrationTest
  setup do
    Plant::Species.delete_all
    @species = Plant::Species.create!(
      latin_name: 'Amelanchier canadensis',
      plant_type: 'shrub'
    )
  end

  test 'GET /s/:slug returns 200 without auth' do
    get '/s/amelanchier-canadensis'
    assert_response :success
    assert_match 'Amelanchier canadensis', response.body
  end

  test 'GET /s/:slug returns 404 for unknown slug' do
    get '/s/martian-plant'
    assert_response :not_found
  end

  test 'public species page payload includes all card-relevant fields' do
    @species.update!(
      common_names_fr: 'Amélanchier',
      strate: 'shrub',
      life_cycle: 'perennial',
      successional_role: 'nurse',
      height_min_cm: 300, height_max_cm: 600,
      spread_min_cm: 200, spread_max_cm: 400,
      planting_spacing_cm: 300,
      growth_habit: 'arbustif-arrondi',
      foliage_type: 'deciduous',
      exposures: ['sun', 'partial-shade'],
      hardiness: 'zone-5',
      watering_need: '3',
      soil_texture: ['balanced'],
      soil_richness: 'moderate',
      soil_ph: ['acid', 'neutral'],
      root_system: 'spreading',
      fertility: 'partially-self-fertile',
      specific_pollinators: ['bees'],
      pollination_distance_m: 30,
      flowering_months: ['mar', 'apr'],
      harvest_months: ['jun', 'jul'],
      is_drageonnant: true,
      toxicity: { 'sheep' => ['seeds'] },
      eco_services_provided: ['windbreak', 'mellifere'],
      eco_services_needed: ['nitrogen'],
      resource_parts: { 'edible' => ['fruit'] }
    )

    get '/s/amelanchier-canadensis'
    assert_response :success

    # The Inertia page renders props as JSON in a data-page attribute.
    # Asserting on key names confirms the serializer wires them correctly.
    body = response.body
    %w[latinName commonNamesFr strate successionalRole lifeCycle foliageType
       hardiness floweringMonths harvestMonths ecoServicesProvided ecoServicesNeeded
       resourceParts toxicity isDrageonnant pollinationDistanceM specificPollinators
       soilPh soilTexture lifespanMinYears lifespanMaxYears plantingSpacingCm
       heightMinCm heightMaxCm spreadMinCm spreadMaxCm slug].each do |key|
      assert_match key, body, "missing key #{key}"
    end
    assert_match 'Amélanchier', body
    assert_match 'partially-self-fertile', body
  end
end
