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
end
