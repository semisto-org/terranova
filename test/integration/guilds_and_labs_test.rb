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

  test 'guild document requires name and file' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')

    doc = GuildDocument.new(guild: guild)
    assert_not doc.valid?
    assert_includes doc.errors[:name], "can't be blank"
  end

  test 'guild document tags filtering' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    member = Member.first || Member.create!(first_name: 'Test', last_name: 'User', email: 'doc-test@test.com', status: 'active', joined_at: Date.today, member_kind: 'human', membership_type: 'effective')

    GuildDocument.create!(
      guild: guild,
      name: 'Brand Guide',
      tags: ['branding', 'design'],
      uploaded_by_id: member.id,
      file: fixture_file_upload('test/fixtures/files/sample.pdf', 'application/pdf')
    )
    GuildDocument.create!(
      guild: guild,
      name: 'Meeting Notes',
      tags: ['admin'],
      file: fixture_file_upload('test/fixtures/files/sample.pdf', 'application/pdf')
    )

    assert_equal 1, GuildDocument.by_tag('branding').count
    assert_equal 2, guild.documents.count
  end

  test 'guild can have task lists with actions' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')

    list = TaskList.create!(name: 'Sprint 1', guild: guild)
    action = Action.create!(name: 'Write newsletter', task_list: list, guild: guild, status: 'todo')

    assert_equal 1, guild.task_lists.count
    assert_equal guild, list.guild
    assert_equal guild, action.guild
  end

  test 'knowledge sections can be scoped to a guild' do
    guild_a = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    guild_b = Guild.create!(name: 'Design', color: 'green', guild_type: 'network')

    KnowledgeSection.where(guild_id: [guild_a.id, guild_b.id]).delete_all

    section_a = KnowledgeSection.create!(name: 'Ressources', guild: guild_a)
    section_b = KnowledgeSection.create!(name: 'Ressources', guild: guild_b)

    # Same name, different guilds: both valid
    assert section_a.valid?
    assert section_b.valid?
    assert_equal 1, guild_a.knowledge_sections.count
  end

  test 'knowledge topic inherits guild from section' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    section = KnowledgeSection.create!(name: 'Wiki', guild: guild)
    topic = KnowledgeTopic.create!(
      title: 'How to post',
      content: 'Steps to post on social media',
      status: 'published',
      section: section
    )

    assert_equal guild, topic.guild
  end

  test 'knowledge topics for_guild scope works' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    section = KnowledgeSection.create!(name: 'Wiki', guild: guild)
    KnowledgeTopic.create!(title: 'Guild Topic', content: 'content', status: 'published', section: section)

    global_section = KnowledgeSection.find_or_create_by!(name: 'Global Section Test', guild_id: nil)
    KnowledgeTopic.create!(title: 'Global Topic', content: 'content', status: 'published', section: global_section)

    assert_equal 1, KnowledgeTopic.for_guild(guild.id).count
  end
end
