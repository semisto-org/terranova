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
end
