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

  test 'credential encrypts sensitive fields' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    member = Member.first || Member.create!(first_name: 'Test', last_name: 'User', email: 'cred-test@test.com', status: 'active', joined_at: Date.today, member_kind: 'human', membership_type: 'effective')

    cred = Credential.create!(
      guild: guild,
      service_name: 'Canva',
      username: 'team@semisto.org',
      password: 'super-secret-123',
      url: 'https://canva.com',
      notes: 'Shared team account',
      created_by_id: member.id
    )

    assert_equal 'Canva', cred.service_name
    assert_equal 'team@semisto.org', cred.username
    assert_equal 'super-secret-123', cred.password
    assert_equal 'Shared team account', cred.notes

    # Verify the raw DB value is NOT plaintext
    raw_password = Credential.connection.select_value(
      "SELECT password FROM credentials WHERE id = #{cred.id}"
    )
    assert_not_equal 'super-secret-123', raw_password
  end

  test 'credential requires service_name' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    cred = Credential.new(guild: guild)
    assert_not cred.valid?
    assert_includes cred.errors[:service_name], "can't be blank"
  end

  test 'GET /api/v1/labs returns all labs' do
    Lab.delete_all
    Lab.create!(name: 'Wallonie-Bruxelles', slug: 'wallonie-bruxelles')
    Lab.create!(name: 'Île-de-France', slug: 'ile-de-france')

    get '/api/v1/labs', as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 2, body['labs'].size
  end

  test 'GET /api/v1/labs/:id returns lab with members and guilds' do
    lab = Lab.create!(name: 'Wallonie-Bruxelles', slug: 'wallonie-bruxelles')
    member = Member.first || Member.create!(first_name: 'Test', last_name: 'User', email: 'lab-test@test.com', status: 'active', joined_at: Date.today, member_kind: 'human', membership_type: 'effective')
    LabMembership.create!(lab: lab, member: member)
    Guild.create!(name: 'Design Local', color: 'green', guild_type: 'lab', lab: lab)

    get "/api/v1/labs/#{lab.id}", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 'Wallonie-Bruxelles', body['lab']['name']
    assert_equal 1, body['lab']['memberCount']
    assert_equal 1, body['lab']['guilds'].size
  end

  # === API Tests ===

  test 'GET /api/v1/guilds returns all guilds with details' do
    guild = Guild.create!(name: 'Communication', color: 'blue', guild_type: 'network')
    member = Member.first || Member.create!(first_name: 'Test', last_name: 'User', email: 'api-test@test.com', status: 'active', joined_at: Date.today, member_kind: 'human', membership_type: 'effective')
    GuildMembership.create!(guild: guild, member: member)

    get '/api/v1/guilds', as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert body['guilds'].any? { |g| g['name'] == 'Communication' }
  end

  test 'GET /api/v1/guilds/:id returns guild detail with all associations' do
    guild = Guild.create!(name: 'Communication', color: 'blue', guild_type: 'network')

    get "/api/v1/guilds/#{guild.id}", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 'Communication', body['guild']['name']
    assert body['guild'].key?('documents')
    assert body['guild'].key?('taskLists')
    assert body['guild'].key?('credentials')
    assert body['guild'].key?('knowledgeSections')
  end

  test 'POST /api/v1/guilds creates a guild' do
    post '/api/v1/guilds', params: {
      name: 'New Guild', color: 'purple', guild_type: 'network', description: 'Test'
    }, as: :json
    assert_response :created

    body = JSON.parse(response.body)
    assert_equal 'New Guild', body['guild']['name']
    assert_equal 'network', body['guild']['guildType']
  end

  test 'PATCH /api/v1/guilds/:id updates a guild' do
    guild = Guild.create!(name: 'Old Name', color: 'blue', guild_type: 'network')

    patch "/api/v1/guilds/#{guild.id}", params: { name: 'New Name' }, as: :json
    assert_response :success

    assert_equal 'New Name', guild.reload.name
  end

  test 'DELETE /api/v1/guilds/:id destroys a guild' do
    guild = Guild.create!(name: 'To Delete', color: 'red', guild_type: 'network')

    delete "/api/v1/guilds/#{guild.id}", as: :json
    assert_response :no_content
    assert_nil Guild.find_by(id: guild.id)
  end

  test 'guild task list CRUD via API' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')

    post "/api/v1/guilds/#{guild.id}/task-lists", params: { name: 'Sprint 1' }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    list_id = body['taskList']['id']

    post "/api/v1/guilds/#{guild.id}/task-lists/#{list_id}/actions",
      params: { name: 'Write post', status: 'todo' }, as: :json
    assert_response :created

    get "/api/v1/guilds/#{guild.id}/task-lists", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['taskLists'].size
    assert_equal 1, body['taskLists'][0]['actions'].size
  end

  test 'guild credential CRUD via API with password masking' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')

    post "/api/v1/guilds/#{guild.id}/credentials",
      params: { service_name: 'Canva', username: 'team@test.com', password: 'secret123', url: 'https://canva.com' },
      as: :json
    assert_response :created
    body = JSON.parse(response.body)
    cred_id = body['credential']['id']

    # Password not in default response
    assert_not body['credential'].key?('password')
    assert body['credential']['hasPassword']

    # Reveal endpoint returns password
    get "/api/v1/guilds/#{guild.id}/credentials/#{cred_id}/reveal", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'secret123', body['credential']['password']
  end

  test 'GET knowledge sections filters by guild_id param' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    KnowledgeSection.create!(name: 'Guild Section', guild: guild)
    KnowledgeSection.find_or_create_by!(name: 'Global Section', guild_id: nil)

    # Without filter: only global sections
    get '/api/v1/knowledge/sections', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body['sections'].none? { |s| s['name'] == 'Guild Section' }

    # With guild_id filter: only guild sections
    get "/api/v1/knowledge/sections?guild_id=#{guild.id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body['sections'].any? { |s| s['name'] == 'Guild Section' }
  end

  test 'GET knowledge topics filters by guild_id param' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    section = KnowledgeSection.create!(name: 'Wiki', guild: guild)
    KnowledgeTopic.create!(title: 'Guild Topic', content: 'c', status: 'published', section: section)

    global_section = KnowledgeSection.find_or_create_by!(name: 'Global Test', guild_id: nil)
    KnowledgeTopic.create!(title: 'Global Topic', content: 'c', status: 'published', section: global_section)

    # Without filter: only global topics
    get '/api/v1/knowledge/topics', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body['topics'].none? { |t| t['title'] == 'Guild Topic' }

    # With guild_id filter: only guild topics
    get "/api/v1/knowledge/topics?guild_id=#{guild.id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body['topics'].any? { |t| t['title'] == 'Guild Topic' }
  end
end
