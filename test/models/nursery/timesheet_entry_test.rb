require 'test_helper'

class Nursery::TimesheetEntryTest < ActiveSupport::TestCase
  setup do
    Nursery::TimesheetEntry.delete_all
    Nursery::TeamMember.delete_all
    Nursery::Nursery.delete_all

    @nursery = Nursery::Nursery.create!(
      name: 'Test', nursery_type: 'semisto', integration: 'platform',
      city: 'LLN', postal_code: '1348', country: 'Belgique'
    )
    @member = Nursery::TeamMember.create!(
      name: 'Alice', email: 'alice@example.com', role: 'employee',
      nursery: @nursery, nursery_name: @nursery.name, start_date: Date.current
    )
  end

  test 'valid timesheet entry' do
    e = Nursery::TimesheetEntry.new(
      member: @member, member_name: @member.name,
      nursery: @nursery, nursery_name: @nursery.name,
      date: Date.current, category: 'watering', hours: 3.5
    )
    assert e.valid?
  end

  test 'validates category inclusion' do
    e = Nursery::TimesheetEntry.new(
      member: @member, nursery: @nursery,
      date: Date.current, category: 'sleeping', hours: 2
    )
    assert_not e.valid?
    assert_includes e.errors[:category], 'is not included in the list'
  end

  test 'validates hours positive' do
    e = Nursery::TimesheetEntry.new(
      member: @member, nursery: @nursery,
      date: Date.current, category: 'watering', hours: 0
    )
    assert_not e.valid?
    assert_includes e.errors[:hours], 'must be greater than 0'
  end
end
