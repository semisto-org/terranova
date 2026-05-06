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

  test 'successional_role accepts pioneer/nurse/climax' do
    %w[pioneer nurse climax].each do |role|
      species = Plant::Species.new(base_attrs.merge(successional_role: role))
      assert species.valid?, "expected #{role} to be valid"
    end
  end

  test 'successional_role rejects unknown value' do
    species = Plant::Species.new(base_attrs.merge(successional_role: 'middle'))
    assert_not species.valid?
    assert_includes species.errors[:successional_role], 'is not included in the list'
  end

  test 'slug returns parameterized latin_name' do
    species = Plant::Species.new(base_attrs.merge(latin_name: 'Amelanchier canadensis'))
    assert_equal 'amelanchier-canadensis', species.slug
  end

  test 'slug handles uppercase and accented characters' do
    species = Plant::Species.new(base_attrs.merge(latin_name: 'Quercus rôbur'))
    assert_equal 'quercus-robur', species.slug
  end
end
