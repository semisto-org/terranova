require 'test_helper'

class AcademyDefaultPacksTest < ActionDispatch::IntegrationTest
  test 'training type persists and returns default packs' do
    post '/api/v1/academy/training-types', params: {
      name: 'Type Packs',
      default_categories: [{ label: 'Standard', price: 100, max_spots: 10 }],
      default_packs: [
        { name: 'Duo', price: 160, deposit_amount: 50, items: [{ category_label: 'Standard', quantity: 2 }] },
      ],
    }, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 1, body['defaultPacks'].size
    assert_equal 'Duo', body['defaultPacks'][0]['name']
    assert_equal 'Standard', body['defaultPacks'][0]['items'][0]['category_label']
  end

  test 'creating a training of the type copies default categories AND packs' do
    post '/api/v1/academy/training-types', params: {
      name: 'Type Packs Gen',
      default_categories: [
        { label: 'Standard', price: 100, max_spots: 10 },
        { label: 'Réduit', price: 70, max_spots: 5 },
      ],
      default_packs: [
        { name: 'Duo', price: 160, deposit_amount: 50, items: [{ category_label: 'Standard', quantity: 2 }] },
      ],
    }, as: :json
    type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: { training_type_id: type_id, title: 'JF Pro 2027' }, as: :json
    assert_response :success
    body = JSON.parse(response.body)

    # Catégories pré-remplies (existant)
    assert_equal %w[Standard Réduit].sort, body['participantCategories'].map { |c| c['label'] }.sort

    # Packs pré-remplis (nouveau) + item lié à la bonne catégorie
    assert_equal 1, body['packs'].size
    pack = body['packs'][0]
    assert_equal 'Duo', pack['name']
    assert_equal 160.0, pack['price']
    assert_equal 1, pack['items'].size
    assert_equal 'Standard', pack['items'][0]['categoryLabel']
    assert_equal 2, pack['items'][0]['quantity']
  end

  test 'a type without default packs creates a training with no packs' do
    post '/api/v1/academy/training-types', params: {
      name: 'Type Sans Packs',
      default_categories: [{ label: 'Standard', price: 100, max_spots: 10 }],
    }, as: :json
    type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: { training_type_id: type_id, title: 'Sans packs' }, as: :json
    assert_response :success
    assert_equal 0, JSON.parse(response.body)['packs'].size
  end

  test 'a default pack item whose label matches no category is skipped' do
    post '/api/v1/academy/training-types', params: {
      name: 'Type Packs Label Manquant',
      default_categories: [{ label: 'Standard', price: 100, max_spots: 10 }],
      default_packs: [{ name: 'Mixte', price: 200, items: [
        { category_label: 'Standard', quantity: 1 },
        { category_label: 'Inexistante', quantity: 1 },
      ] }],
    }, as: :json
    type_id = JSON.parse(response.body)['id']

    post '/api/v1/academy/trainings', params: { training_type_id: type_id, title: 'JF' }, as: :json
    assert_response :success
    pack = JSON.parse(response.body)['packs'][0]
    assert_equal 1, pack['items'].size # l'item « Inexistante » est ignoré
    assert_equal 'Standard', pack['items'][0]['categoryLabel']
  end
end
