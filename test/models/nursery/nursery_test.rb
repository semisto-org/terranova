require 'test_helper'

class Nursery::NurseryTest < ActiveSupport::TestCase
  setup do
    Nursery::Nursery.delete_all
  end

  test 'valid nursery creates successfully' do
    nursery = Nursery::Nursery.new(
      name: 'Pépinière Test',
      nursery_type: 'semisto',
      integration: 'platform',
      city: 'Bruxelles',
      postal_code: '1000',
      country: 'Belgique'
    )
    assert nursery.valid?
    assert nursery.save
  end

  test 'requires name' do
    nursery = Nursery::Nursery.new(nursery_type: 'semisto', integration: 'platform')
    assert_not nursery.valid?
    assert_includes nursery.errors[:name], "can't be blank"
  end

  test 'validates nursery_type inclusion' do
    nursery = Nursery::Nursery.new(name: 'Test', nursery_type: 'invalid', integration: 'platform')
    assert_not nursery.valid?
    assert_includes nursery.errors[:nursery_type], 'is not included in the list'
  end

  test 'validates integration inclusion' do
    nursery = Nursery::Nursery.new(name: 'Test', nursery_type: 'semisto', integration: 'invalid')
    assert_not nursery.valid?
    assert_includes nursery.errors[:integration], 'is not included in the list'
  end
end
