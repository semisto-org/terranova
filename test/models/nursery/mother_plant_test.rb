require 'test_helper'

class Nursery::MotherPlantTest < ActiveSupport::TestCase
  setup do
    Nursery::MotherPlant.delete_all
  end

  test 'valid mother plant' do
    mp = Nursery::MotherPlant.new(
      species_id: 'sp-1', species_name: 'Mentha spicata',
      place_name: 'Jardin communautaire', place_address: 'Rue test',
      planting_date: Date.current - 60, source: 'member-proposal',
      status: 'pending', quantity: 3
    )
    assert mp.valid?
  end

  test 'validates source inclusion' do
    mp = Nursery::MotherPlant.new(
      species_id: 'sp-1', species_name: 'Test',
      planting_date: Date.current, source: 'unknown', status: 'pending'
    )
    assert_not mp.valid?
    assert_includes mp.errors[:source], 'is not included in the list'
  end

  test 'validates status inclusion' do
    mp = Nursery::MotherPlant.new(
      species_id: 'sp-1', species_name: 'Test',
      planting_date: Date.current, source: 'design-studio', status: 'approved'
    )
    assert_not mp.valid?
    assert_includes mp.errors[:status], 'is not included in the list'
  end
end
