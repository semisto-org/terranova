require 'test_helper'

class Plant::SpeciesTest < ActiveSupport::TestCase
  def base_attrs
    { latin_name: 'Test species', plant_type: 'tree' }
  end

  test 'strate accepts a value from STRATES' do
    species = Plant::Species.new(base_attrs.merge(strate: 'shrub'))
    assert species.valid?
  end

  test 'strate rejects unknown value' do
    species = Plant::Species.new(base_attrs.merge(strate: 'martian'))
    assert_not species.valid?
    assert_includes species.errors[:strate], 'is not included in the list'
  end

  test 'strate accepts nil' do
    species = Plant::Species.new(base_attrs.merge(strate: nil))
    assert species.valid?
  end
end
