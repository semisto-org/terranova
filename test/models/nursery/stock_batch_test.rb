require 'test_helper'

class Nursery::StockBatchTest < ActiveSupport::TestCase
  setup do
    Nursery::StockBatch.delete_all
    Nursery::Container.delete_all
    Nursery::Nursery.delete_all

    @nursery = Nursery::Nursery.create!(
      name: 'Test Nursery', nursery_type: 'semisto', integration: 'platform',
      city: 'LLN', postal_code: '1348', country: 'Belgique'
    )
    @container = Nursery::Container.create!(name: 'Godet 9cm', short_name: 'G9', sort_order: 1)
    @species = Plant::Species.create!(latin_name: 'Malus domestica', plant_type: 'Arbre fruitier')
  end

  test 'valid stock batch' do
    batch = Nursery::StockBatch.new(
      nursery: @nursery, container: @container, species: @species,
      quantity: 50, available_quantity: 50, reserved_quantity: 0,
      growth_stage: 'young', price_euros: 12.50
    )
    assert batch.valid?
  end

  test 'requires species' do
    batch = Nursery::StockBatch.new(nursery: @nursery, container: @container, growth_stage: 'young')
    assert_not batch.valid?
    assert_includes batch.errors[:species], "must exist"
  end

  test 'validates growth_stage inclusion' do
    batch = Nursery::StockBatch.new(
      nursery: @nursery, container: @container, species: @species,
      growth_stage: 'giant'
    )
    assert_not batch.valid?
    assert_includes batch.errors[:growth_stage], 'is not included in the list'
  end

  test 'belongs to nursery and container' do
    batch = Nursery::StockBatch.create!(
      nursery: @nursery, container: @container, species: @species,
      quantity: 10, available_quantity: 10, reserved_quantity: 0,
      growth_stage: 'seedling', price_euros: 5
    )
    assert_equal @nursery, batch.nursery
    assert_equal @container, batch.container
  end
end
