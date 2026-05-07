require 'test_helper'

class PlantsCardFieldsTest < ActionDispatch::IntegrationTest
  setup do
    Plant::Species.delete_all
    Plant::Genus.delete_all
  end

  test 'GET /api/v1/plants/filter_options exposes new card vocabularies' do
    get '/api/v1/plants/filter-options'
    assert_response :success
    payload = JSON.parse(response.body)

    %w[strates successionalRoles ecoServices resourceCategories plantParts
       sensorySubtypes animalSubtypes toxicityTargets specificPollinators
       soilPhValues soilTextures].each do |key|
      assert payload.key?(key), "filter_options missing #{key}"
      assert payload[key].is_a?(Array), "#{key} should be an array"
      assert payload[key].any?, "#{key} should be non-empty"
    end

    # Concrete values
    strate_ids = payload['strates'].map { |o| o['id'] }
    assert_includes strate_ids, 'shrub'
    assert_includes strate_ids, 'canopy'

    role_ids = payload['successionalRoles'].map { |o| o['id'] }
    assert_equal %w[pioneer nurse climax], role_ids

    eco_ids = payload['ecoServices'].map { |o| o['id'] }
    assert_includes eco_ids, 'windbreak'
    assert_includes eco_ids, 'nitrogen'
  end

  test 'PATCH and GET roundtrip the card fields' do
    species = Plant::Species.create!(
      latin_name: 'Amelanchier canadensis',
      plant_type: 'shrub'
    )

    patch "/api/v1/plants/species/#{species.id}", params: {
      strate: 'shrub',
      successional_role: 'nurse',
      lifespan_min_years: 30,
      lifespan_max_years: 50,
      planting_spacing_cm: 300,
      pollination_distance_m: 30,
      is_drageonnant: true,
      allelopathy: '',
      soil_ph: ['acid', 'neutral'],
      soil_texture: ['balanced', 'heavy'],
      specific_pollinators: ['bees', 'hoverflies'],
      eco_services_provided: ['windbreak', 'mellifere', 'birds'],
      eco_services_needed: ['nitrogen', 'cross-pollination'],
      resource_parts: { edible: ['fruit', 'flower'], medicinal: ['bark'] },
      toxicity: { sheep: ['seeds'] }
    }

    assert_response :success

    get "/api/v1/plants/species/#{species.id}"
    assert_response :success
    payload = JSON.parse(response.body)['species']

    assert_equal 'shrub', payload['strate']
    assert_equal 'nurse', payload['successionalRole']
    assert_equal 30, payload['lifespanMinYears']
    assert_equal 50, payload['lifespanMaxYears']
    assert_equal 300, payload['plantingSpacingCm']
    assert_equal 30, payload['pollinationDistanceM']
    assert_equal true, payload['isDrageonnant']
    assert_equal ['acid', 'neutral'], payload['soilPh']
    assert_equal ['balanced', 'heavy'], payload['soilTexture']
    assert_equal ['bees', 'hoverflies'], payload['specificPollinators']
    assert_equal ['windbreak', 'mellifere', 'birds'], payload['ecoServicesProvided']
    assert_equal ['nitrogen', 'cross-pollination'], payload['ecoServicesNeeded']
    assert_equal({ 'edible' => ['fruit', 'flower'], 'medicinal' => ['bark'] }, payload['resourceParts'])
    assert_equal({ 'sheep' => ['seeds'] }, payload['toxicity'])
    assert_equal '', payload['allelopathy']
    assert_equal 'amelanchier-canadensis', payload['slug']
  end
end
