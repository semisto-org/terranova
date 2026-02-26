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

  test 'normalizes all analysis subsections with value/note structure' do
    analysis = Design::SiteAnalysis.create!(
      project: @project,
      water: { network: { value: 'city', note: 'metered' } },
      microclimate: { shade: { value: 'afternoon', note: '' } },
      buildings: { heritage: { value: 'listed facade', note: '' } },
      zoning: { categories: %w[zone_agricole], prescriptions: { value: 'low impact', note: '' } }
    )

    Design::SiteAnalysis::SECTION_CORE_FIELDS.each do |section, fields|
      payload = analysis.public_send(section)
      assert_kind_of Hash, payload

      fields.each do |field|
        next if section == :zoning && field == 'categories'

        assert_equal(%w[note value], payload.fetch(field).keys.sort, "#{section}.#{field} not normalized")
      end
    end

    assert_equal ['zone_agricole'], analysis.zoning['categories']
    assert_equal ['zone_agricole'], analysis.zoning_categories
  end
end
