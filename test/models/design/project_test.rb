require 'test_helper'

class DesignProjectTest < ActiveSupport::TestCase
  test 'accepts supported project params values' do
    project = Design::Project.new(
      name: 'Projet test',
      client_id: 'client-1',
      client_name: 'Client',
      phase: 'offre',
      status: 'pending',
      project_type: 'prive',
      acquisition_channel: 'presse',
      client_interests: %w[design implementation_support]
    )

    assert project.valid?
  end

  test 'rejects unsupported enums and interests' do
    project = Design::Project.new(
      name: 'Projet test',
      client_id: 'client-1',
      client_name: 'Client',
      phase: 'offre',
      status: 'pending',
      project_type: 'invalid',
      acquisition_channel: 'bad-channel',
      client_interests: ['design', 'not-supported']
    )

    assert_not project.valid?
    assert_includes project.errors[:project_type], 'is not included in the list'
    assert_includes project.errors[:acquisition_channel], 'is not included in the list'
    assert project.errors[:client_interests].any?
  end
end
