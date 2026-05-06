require 'test_helper'
require 'ostruct'

class PlantCardsHelperTest < ActionView::TestCase
  include PlantCardsHelper

  test 'strate_label returns French label' do
    assert_equal 'Arbrisseau', strate_label('shrub')
    assert_equal 'Canopée', strate_label('canopy')
    assert_nil strate_label(nil)
  end

  test 'strate_color returns hex' do
    assert_equal '#5A9A2F', strate_color('shrub')
    assert_equal '#1B4D14', strate_color('canopy')
  end

  test 'strate_fg returns contrast color' do
    assert_equal '#fff', strate_fg('shrub')
    assert_equal '#2d4a1f', strate_fg('low')
  end

  test 'hardiness_celsius converts USDA zone to Celsius' do
    assert_equal '−29 °C', hardiness_celsius('zone-5')
    assert_equal '−40 °C', hardiness_celsius('zone-3')
    assert_nil hardiness_celsius(nil)
    assert_nil hardiness_celsius('')
    assert_nil hardiness_celsius('zone-99')
  end

  test 'cycle_label and cycle_class' do
    assert_equal 'Vivace', cycle_label('perennial')
    assert_equal 'cycle-perennial', cycle_class('perennial')
    assert_nil cycle_class(nil)
  end

  test 'role_label and role_class' do
    assert_equal 'Pionnier', role_label('pioneer')
    assert_equal 'role-pioneer', role_class('pioneer')
    assert_nil role_class(nil)
  end

  test 'foliage_label' do
    assert_equal 'Caduc', foliage_label('deciduous')
    assert_equal 'Persistant', foliage_label('evergreen')
    assert_equal 'Marcescent', foliage_label('marcescent')
    assert_nil foliage_label(nil)
  end

  test 'root_label' do
    assert_equal 'Traçant', root_label('spreading')
    assert_equal 'Pivotant', root_label('taproot')
  end

  test 'pick_photo returns the first photo with the given role' do
    photos = [
      OpenStruct.new(role: 'general', url: 'a'),
      OpenStruct.new(role: 'flower',  url: 'b'),
      OpenStruct.new(role: 'flower',  url: 'c')
    ]
    assert_equal 'b', pick_photo(photos, 'flower').url
    assert_nil pick_photo(photos, 'fruit')
  end

  test 'cell_state classifies a month' do
    species = Struct.new(:flowering_months, :harvest_months).new(['mar', 'apr'], ['jun', 'jul'])
    assert_equal 'flow', cell_state('mar', species)
    assert_equal 'harv', cell_state('jul', species)
    assert_nil cell_state('feb', species)
    overlap = Struct.new(:flowering_months, :harvest_months).new(['aug'], ['aug'])
    assert_equal 'both', cell_state('aug', overlap)
  end

  test 'card_warnings collects active flags' do
    s = OpenStruct.new(is_drageonnant: true, allelopathy: '', toxicity: { 'sheep' => ['seeds'] })
    warnings = card_warnings(s)
    assert_includes warnings, 'Drageonne'
    assert(warnings.any? { |w| w.include?('Toxique brebis') })
    assert_not(warnings.any? { |w| w.include?('Allélopath') })
  end

  test 'card_warnings is empty when nothing flagged' do
    s = OpenStruct.new(is_drageonnant: false, allelopathy: '', toxicity: {})
    assert_empty card_warnings(s)
  end

  test 'card_warnings includes allelopathy when present' do
    s = OpenStruct.new(is_drageonnant: false, allelopathy: 'Juglone', toxicity: {})
    warnings = card_warnings(s)
    assert(warnings.any? { |w| w.include?('Juglone') })
  end

  test 'qr_svg returns inline SVG' do
    svg = qr_svg('https://example.org/foo')
    assert_match(/^<\?xml|^<svg/, svg)
    assert_includes svg.to_s, 'svg'
  end

  test 'plant_height_px scales 1m=33px' do
    assert_equal 165, plant_height_px(500)
    assert_equal 33, plant_height_px(100)
    assert_nil plant_height_px(nil)
    assert_nil plant_height_px(0)
  end

  test 'silhouette_partial picks correct view' do
    s_shrub = OpenStruct.new(growth_habit: 'arbustif-arrondi', strate: 'shrub')
    assert_equal 'plant_cards/silhouettes/arbustif_arrondi', silhouette_partial(s_shrub)
    s_nil = OpenStruct.new(growth_habit: nil, strate: 'shrub')
    assert_equal 'plant_cards/silhouettes/default', silhouette_partial(s_nil)
  end

  test 'roots_partial picks correct view' do
    s = OpenStruct.new(root_system: 'taproot')
    assert_equal 'plant_cards/roots/taproot', roots_partial(s)
    s_nil = OpenStruct.new(root_system: nil)
    assert_equal 'plant_cards/roots/default', roots_partial(s_nil)
  end
end
