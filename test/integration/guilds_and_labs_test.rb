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

  test 'guild with guild_type lab requires lab_id' do
    lab = Lab.create!(name: 'Test Lab', slug: 'test-lab')

    # Network guild: no lab_id needed
    network_guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    assert network_guild.valid?
    assert_nil network_guild.lab_id

    # Lab guild: lab_id required
    lab_guild = Guild.new(name: 'Design', color: 'green', guild_type: 'lab')
    assert_not lab_guild.valid?
    assert_includes lab_guild.errors[:lab_id], "can't be blank"

    # Lab guild with lab_id: valid
    lab_guild.lab = lab
    assert lab_guild.valid?
  end

  test 'existing guilds default to network type' do
    guild = Guild.create!(name: 'Old Guild', color: 'purple')
    assert_equal 'network', guild.guild_type
  end

  test 'guild scopes filter by type' do
    lab = Lab.create!(name: 'Lab', slug: 'lab')
    Guild.create!(name: 'Net Guild', color: 'blue', guild_type: 'network')
    Guild.create!(name: 'Lab Guild', color: 'red', guild_type: 'lab', lab: lab)

    assert_equal 1, Guild.network_guilds.count
    assert_equal 1, Guild.lab_guilds.count
  end
end
