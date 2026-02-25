require 'test_helper'

class DesignSiteAnalysisTest < ActiveSupport::TestCase
  setup do
    @project = Design::Project.create!(
      name: 'Projet analyse',
      client_id: 'client-analysis',
      client_name: 'Client Analyse',
      phase: 'offre',
      status: 'pending'
    )
  end

  test 'accepts supported zoning categories' do
    analysis = Design::SiteAnalysis.new(
      project: @project,
      water_access: true,
      zoning: { categories: %w[zone_agricole zone_habitat] }
    )

    assert analysis.valid?
    assert_equal %w[zone_agricole zone_habitat], analysis.zoning_categories
  end

  test 'rejects unsupported zoning category' do
    analysis = Design::SiteAnalysis.new(
      project: @project,
      zoning: { categories: ['zone_agricole', 'unknown_zone'] }
    )

    assert_not analysis.valid?
    assert analysis.errors[:zoning_categories].any?
  end

  test 'normalizes section fields with value and note keys' do
    analysis = Design::SiteAnalysis.create!(
      project: @project,
      climate: { 'temperature' => { value: 'temperate' } },
      aesthetics: { views: { value: 'valley', note: 'open' } }
    )

    assert_equal({ 'value' => 'temperate', 'note' => '' }, analysis.climate['temperature'])
    assert_equal({ 'value' => 'valley', 'note' => 'open' }, analysis.aesthetics['views'])
    assert_equal({ 'value' => nil, 'note' => '' }, analysis.soil['texture'])
  end

  test 'maps compatibility readers for biodiversity and built environment' do
    analysis = Design::SiteAnalysis.create!(
      project: @project,
      vegetation: { existing_flora: { value: 'fruit trees', note: '' } },
      buildings: { adjacent_buildings: { value: 'houses', note: '' } },
      access_data: { road_access: { value: 'easy', note: '' } }
    )

    assert_equal analysis.vegetation, analysis.biodiversity
    assert_equal analysis.buildings, analysis.built_environment
    assert_equal analysis.access_data, analysis.access
  end
end
