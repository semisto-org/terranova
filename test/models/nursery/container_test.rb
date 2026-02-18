require 'test_helper'

class Nursery::ContainerTest < ActiveSupport::TestCase
  setup do
    Nursery::StockBatch.delete_all
    Nursery::Container.delete_all
  end

  test 'valid container' do
    c = Nursery::Container.new(name: 'Pot 3L', short_name: 'P3', sort_order: 2)
    assert c.valid?
  end

  test 'requires name and short_name' do
    c = Nursery::Container.new(sort_order: 1)
    assert_not c.valid?
    assert_includes c.errors[:name], "can't be blank"
    assert_includes c.errors[:short_name], "can't be blank"
  end
end
