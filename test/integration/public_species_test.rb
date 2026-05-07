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
end
