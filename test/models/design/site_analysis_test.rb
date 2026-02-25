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
      zoning_categories: %w[zone_agricole zone_habitat]
    )

    assert analysis.valid?
  end

  test 'rejects unsupported zoning category' do
    analysis = Design::SiteAnalysis.new(
      project: @project,
      zoning_categories: ['zone_agricole', 'unknown_zone']
    )

    assert_not analysis.valid?
    assert analysis.errors[:zoning_categories].any?
  end
end
