require 'test_helper'

class GuildsAndLabsTest < ActionDispatch::IntegrationTest
  setup do
    [LabMembership, Lab, GuildMembership, Guild].each(&:delete_all)

    @member = Member.first || Member.create!(
      first_name: 'Alice',
      last_name: 'Test',
      email: 'alice-labs@example.test',
      avatar: '',
      status: 'active',
      is_admin: false,
      joined_at: Date.current
    )
  end

  test 'create a lab and assign members' do
    lab = Lab.create!(name: 'Wallonie-Bruxelles', slug: 'wallonie-bruxelles')
    member = @member

    LabMembership.create!(lab: lab, member: member)

    assert_equal 1, lab.members.count
    assert_includes member.labs, lab
  end

  test 'lab slug must be unique' do
    Lab.create!(name: 'Lab A', slug: 'lab-a')
    duplicate = Lab.new(name: 'Lab B', slug: 'lab-a')
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:slug], 'has already been taken'
  end

  test 'member cannot join same lab twice' do
    lab = Lab.create!(name: 'Lab A', slug: 'lab-a')
    member = @member

    LabMembership.create!(lab: lab, member: member)
    duplicate = LabMembership.new(lab: lab, member: member)
    assert_not duplicate.valid?
  end
end
