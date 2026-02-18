require 'test_helper'

class Nursery::TeamMemberTest < ActiveSupport::TestCase
  setup do
    Nursery::TimesheetEntry.delete_all
    Nursery::ScheduleSlot.delete_all
    Nursery::TeamMember.delete_all
    Nursery::Nursery.delete_all

    @nursery = Nursery::Nursery.create!(
      name: 'Test', nursery_type: 'semisto', integration: 'platform',
      city: 'LLN', postal_code: '1348', country: 'Belgique'
    )
  end

  test 'valid team member' do
    m = Nursery::TeamMember.new(
      name: 'Alice', email: 'alice@example.com', role: 'manager',
      nursery: @nursery, nursery_name: @nursery.name, start_date: Date.current
    )
    assert m.valid?
  end

  test 'validates role inclusion' do
    m = Nursery::TeamMember.new(
      name: 'Bob', email: 'bob@example.com', role: 'ceo',
      nursery: @nursery, nursery_name: @nursery.name, start_date: Date.current
    )
    assert_not m.valid?
    assert_includes m.errors[:role], 'is not included in the list'
  end

  test 'requires name, email, start_date' do
    m = Nursery::TeamMember.new(nursery: @nursery, role: 'employee')
    assert_not m.valid?
    assert_includes m.errors[:name], "can't be blank"
    assert_includes m.errors[:email], "can't be blank"
    assert_includes m.errors[:start_date], "can't be blank"
  end
end
