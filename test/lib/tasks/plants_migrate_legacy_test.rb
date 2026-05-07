require 'test_helper'
require 'rake'

class PlantsMigrateLegacyTest < ActiveSupport::TestCase
  include ActiveSupport::Testing::TimeHelpers
  setup do
    Rails.application.load_tasks if Rake::Task.tasks.empty?
    Rake::Task['plants:migrate_legacy'].reenable
    Plant::Species.delete_all
  end

  test 'maps interests:nitrogen-fixer to eco_services_provided' do
    sp = Plant::Species.create!(latin_name: 'Robinia pseudoacacia', plant_type: 'tree', interests: ['nitrogen-fixer'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.eco_services_provided, 'nitrogen'
  end

  test 'maps interests:pollinator to mellifere' do
    sp = Plant::Species.create!(latin_name: 'Tilia cordata', plant_type: 'tree', interests: ['pollinator'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.eco_services_provided, 'mellifere'
  end

  test 'maps interests:hedge to windbreak' do
    sp = Plant::Species.create!(latin_name: 'Carpinus betulus', plant_type: 'tree', interests: ['hedge'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.eco_services_provided, 'windbreak'
  end

  test 'maps interests:ornamental to resource_parts.sensory' do
    sp = Plant::Species.create!(latin_name: 'Cornus alba', plant_type: 'shrub', interests: ['ornamental'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.resource_parts.fetch('sensory', []), 'ornamental'
  end

  test 'maps ecosystem_needs:nurse-tree to successional_role nurse' do
    sp = Plant::Species.create!(latin_name: 'Alnus glutinosa', plant_type: 'tree', ecosystem_needs: ['nurse-tree'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_equal 'nurse', sp.successional_role
  end

  test 'maps ecosystem_needs:pioneer/climax to role' do
    pioneer = Plant::Species.create!(latin_name: 'Betula pendula', plant_type: 'tree', ecosystem_needs: ['pioneer'])
    climax  = Plant::Species.create!(latin_name: 'Quercus robur',  plant_type: 'tree', ecosystem_needs: ['climax'])
    Rake::Task['plants:migrate_legacy'].invoke
    assert_equal 'pioneer', pioneer.reload.successional_role
    assert_equal 'climax',  climax.reload.successional_role
  end

  test 'maps ecosystem_needs:ground-cover/erosion-control to eco_services_provided' do
    sp = Plant::Species.create!(latin_name: 'Vinca minor', plant_type: 'ground-cover', ecosystem_needs: ['ground-cover', 'erosion-control'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.eco_services_provided, 'ground-cover'
    assert_includes sp.eco_services_provided, 'erosion-control'
  end

  test 'copies edible_parts into resource_parts.edible' do
    sp = Plant::Species.create!(latin_name: 'Fragaria vesca', plant_type: 'ground-cover', edible_parts: ['fruit', 'leaf'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_equal ['fruit', 'leaf'], sp.resource_parts.fetch('edible', []).sort
  end

  test 'maps fragrance strong/medium to resource_parts.sensory.fragrant' do
    strong = Plant::Species.create!(latin_name: 'Rosa damascena', plant_type: 'shrub', fragrance: 'strong')
    medium = Plant::Species.create!(latin_name: 'Lavandula',      plant_type: 'shrub', fragrance: 'medium')
    none   = Plant::Species.create!(latin_name: 'Aspen',          plant_type: 'tree',  fragrance: 'none')
    Rake::Task['plants:migrate_legacy'].invoke
    assert_includes strong.reload.resource_parts.fetch('sensory', []), 'fragrant'
    assert_includes medium.reload.resource_parts.fetch('sensory', []), 'fragrant'
    assert_not_includes Array(none.reload.resource_parts['sensory']), 'fragrant'
  end

  test 'maps fodder_qualities presence to resource_parts.animal browsed' do
    sp = Plant::Species.create!(latin_name: 'Trifolium', plant_type: 'ground-cover', fodder_qualities: ['sheep', 'cattle'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.resource_parts.fetch('animal', []), 'browsed'
  end

  test 'is idempotent — running twice produces same result' do
    sp = Plant::Species.create!(latin_name: 'Robinia pseudoacacia', plant_type: 'tree', interests: ['nitrogen-fixer'])
    Rake::Task['plants:migrate_legacy'].invoke
    Rake::Task['plants:migrate_legacy'].reenable
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_equal ['nitrogen'], sp.eco_services_provided
  end

  test 'never overwrites a manually-set successional_role' do
    sp = Plant::Species.create!(latin_name: 'Alnus glutinosa', plant_type: 'tree',
                                ecosystem_needs: ['nurse-tree'],
                                successional_role: 'climax')
    Rake::Task['plants:migrate_legacy'].invoke
    assert_equal 'climax', sp.reload.successional_role
  end

  test 'does not write to species with no legacy data and nil columns' do
    sp = Plant::Species.create!(latin_name: 'Empty species', plant_type: 'tree')
    before = sp.updated_at
    travel 1.second do
      Rake::Task['plants:migrate_legacy'].reenable
      Rake::Task['plants:migrate_legacy'].invoke
    end
    sp.reload
    assert_equal before.to_i, sp.updated_at.to_i, 'updated_at should not change for clean species'
  end

  test 'preserves existing eco_services_provided values when adding' do
    sp = Plant::Species.create!(latin_name: 'X', plant_type: 'tree',
                                interests: ['nitrogen-fixer'],
                                eco_services_provided: ['mellifere'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_equal ['mellifere', 'nitrogen'], sp.eco_services_provided.sort
  end
end
