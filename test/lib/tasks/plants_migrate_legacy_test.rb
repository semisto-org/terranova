require 'test_helper'
require 'rake'

class PlantsMigrateLegacyTest < ActiveSupport::TestCase
  include ActiveSupport::Testing::TimeHelpers

  setup do
    Rails.application.load_tasks if Rake::Task.tasks.empty?
    Rake::Task['plants:migrate_legacy'].reenable
    Plant::Species.delete_all
  end

  # ── eco_services_provided via interests ──────────────────────────────────────

  test 'French interest Mellifère → eco_services_provided mellifere' do
    sp = Plant::Species.create!(latin_name: 'Tilia cordata', plant_type: 'tree',
                                interests: ['Mellifère'])
    Rake::Task['plants:migrate_legacy'].invoke
    assert_includes sp.reload.eco_services_provided, 'mellifere'
  end

  test "French interest Fixation d'azote → eco_services_provided nitrogen" do
    sp = Plant::Species.create!(latin_name: 'Robinia pseudoacacia', plant_type: 'tree',
                                interests: ["Fixation d'azote"])
    Rake::Task['plants:migrate_legacy'].invoke
    assert_includes sp.reload.eco_services_provided, 'nitrogen'
  end

  test 'French interest Brise-vent → eco_services_provided windbreak' do
    sp = Plant::Species.create!(latin_name: 'Carpinus betulus', plant_type: 'tree',
                                interests: ['Brise-vent'])
    Rake::Task['plants:migrate_legacy'].invoke
    assert_includes sp.reload.eco_services_provided, 'windbreak'
  end

  # ── resource_parts.sensory via interests ─────────────────────────────────────

  test 'French interest Ornemental → resource_parts.sensory ornamental' do
    sp = Plant::Species.create!(latin_name: 'Cornus alba', plant_type: 'shrub',
                                interests: ['Ornemental'])
    Rake::Task['plants:migrate_legacy'].invoke
    assert_includes sp.reload.resource_parts.fetch('sensory', []), 'ornamental'
  end

  test 'French interest Aromatique → resource_parts.sensory fragrant AND aromatic bucket' do
    sp = Plant::Species.create!(latin_name: 'Lavandula angustifolia', plant_type: 'shrub',
                                interests: ['Aromatique'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.resource_parts.fetch('sensory', []), 'fragrant'
    assert sp.resource_parts.key?('aromatic'), 'aromatic bucket should exist'
  end

  # ── resource_parts.edible via interests ──────────────────────────────────────

  test 'French interest Fruits comestibles → resource_parts.edible fruit' do
    sp = Plant::Species.create!(latin_name: 'Fragaria vesca', plant_type: 'ground-cover',
                                interests: ['Fruits comestibles'])
    Rake::Task['plants:migrate_legacy'].invoke
    assert_includes sp.reload.resource_parts.fetch('edible', []), 'fruit'
  end

  # ── resource_parts.animal via interests ──────────────────────────────────────

  test 'French interest Brouté par les animaux → resource_parts.animal browsed' do
    sp = Plant::Species.create!(latin_name: 'Trifolium repens', plant_type: 'ground-cover',
                                interests: ['Brouté par les animaux'])
    Rake::Task['plants:migrate_legacy'].invoke
    assert_includes sp.reload.resource_parts.fetch('animal', []), 'browsed'
  end

  # ── eco_services_needed via ecosystem_needs ───────────────────────────────────

  test 'French ecosystem_needs Azote → eco_services_needed nitrogen (NOT provided)' do
    sp = Plant::Species.create!(latin_name: 'Quercus robur', plant_type: 'tree',
                                ecosystem_needs: ['Azote'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.eco_services_needed, 'nitrogen'
    assert_not_includes sp.eco_services_provided, 'nitrogen'
  end

  test "French ecosystem_needs À l'abri du vent → eco_services_needed windbreak" do
    sp = Plant::Species.create!(latin_name: 'Prunus domestica', plant_type: 'tree',
                                ecosystem_needs: ["À l'abri du vent"])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.eco_services_needed, 'windbreak'
    assert_not_includes sp.eco_services_provided, 'windbreak'
  end

  # ── edible_parts column translation ──────────────────────────────────────────

  test 'edible_parts Fruits + Feuilles → resource_parts.edible = [fruit, leaf]' do
    sp = Plant::Species.create!(latin_name: 'Fragaria vesca', plant_type: 'ground-cover',
                                edible_parts: ['Fruits', 'Feuilles'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_equal %w[fruit leaf], sp.resource_parts.fetch('edible', []).sort
  end

  test 'French junk in resource_parts.edible is cleaned up and replaced with English' do
    sp = Plant::Species.create!(latin_name: 'Malus domestica', plant_type: 'tree',
                                resource_parts: { 'edible' => ['Fruits'] },
                                edible_parts: ['Feuilles'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    # French 'Fruits' dropped (not in PLANT_PARTS), 'Feuilles' translated to 'leaf'
    assert_equal ['leaf'], sp.resource_parts.fetch('edible', [])
    assert_not_includes sp.resource_parts.fetch('edible', []), 'Fruits'
  end

  # ── fragrance ────────────────────────────────────────────────────────────────

  test 'fragrance light → resource_parts.sensory fragrant' do
    sp = Plant::Species.create!(latin_name: 'Lathyrus odoratus', plant_type: 'climber',
                                fragrance: 'light')
    Rake::Task['plants:migrate_legacy'].invoke
    assert_includes sp.reload.resource_parts.fetch('sensory', []), 'fragrant'
  end

  test 'fragrance none → no fragrant in sensory' do
    sp = Plant::Species.create!(latin_name: 'Betula pendula', plant_type: 'tree',
                                fragrance: 'none')
    Rake::Task['plants:migrate_legacy'].invoke
    assert_not_includes Array(sp.reload.resource_parts['sensory']), 'fragrant'
  end

  # ── fodder_qualities ─────────────────────────────────────────────────────────

  test 'fodder_qualities Moutons → resource_parts.animal browsed' do
    sp = Plant::Species.create!(latin_name: 'Salix viminalis', plant_type: 'tree',
                                fodder_qualities: ['Moutons'])
    Rake::Task['plants:migrate_legacy'].invoke
    assert_includes sp.reload.resource_parts.fetch('animal', []), 'browsed'
  end

  # ── idempotence ───────────────────────────────────────────────────────────────

  test 'is idempotent — running twice produces no extra writes' do
    sp = Plant::Species.create!(latin_name: 'Robinia pseudoacacia', plant_type: 'tree',
                                interests: ["Fixation d'azote"])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    first_updated = sp.updated_at

    Rake::Task['plants:migrate_legacy'].reenable
    travel 2.seconds do
      Rake::Task['plants:migrate_legacy'].invoke
    end
    sp.reload
    assert_equal first_updated.to_i, sp.updated_at.to_i, 'second run must not touch updated_at'
    assert_equal ['nitrogen'], sp.eco_services_provided
  end

  # ── successional_role ────────────────────────────────────────────────────────

  test 'never overwrites a manually-set successional_role' do
    sp = Plant::Species.create!(latin_name: 'Alnus glutinosa', plant_type: 'tree',
                                interests: ['Arbre pionnier'],
                                successional_role: 'climax')
    Rake::Task['plants:migrate_legacy'].invoke
    assert_equal 'climax', sp.reload.successional_role
  end

  # ── no-op for empty species ───────────────────────────────────────────────────

  test 'does not write to species with no legacy data' do
    sp = Plant::Species.create!(latin_name: 'Empty species', plant_type: 'tree')
    before = sp.updated_at
    travel 1.second do
      Rake::Task['plants:migrate_legacy'].reenable
      Rake::Task['plants:migrate_legacy'].invoke
    end
    sp.reload
    assert_equal before.to_i, sp.updated_at.to_i, 'updated_at should not change for clean species'
  end

  # ── additive: existing values preserved ──────────────────────────────────────

  test 'preserves existing eco_services_provided when adding new values' do
    sp = Plant::Species.create!(latin_name: 'Prunus spinosa', plant_type: 'shrub',
                                interests: ['Mellifère'],
                                eco_services_provided: ['windbreak'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.eco_services_provided, 'windbreak'
    assert_includes sp.eco_services_provided, 'mellifere'
  end
end
