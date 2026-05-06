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
end
