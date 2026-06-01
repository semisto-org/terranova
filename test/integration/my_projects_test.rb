require 'test_helper'

class MyProjectsTest < ActionDispatch::IntegrationTest
  setup do
    @member = Member.create!(
      first_name: 'Mo', last_name: 'H', email: "mo-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current, member_kind: 'human', membership_type: 'effective'
    )
    Thread.current[:test_member] = @member

    @mine = PoleProject.create!(name: 'Communication', pole: 'academy')
    @other = PoleProject.create!(name: 'Pas la mienne', pole: 'academy')
    ProjectMembership.create!(projectable: @mine, member: @member, role: 'member')
    @list = TaskList.create!(name: 'À faire', taskable: @mine)
  end

  teardown { Thread.current[:test_member] = nil }

  test 'my-projects returns only projects the member belongs to, with members and lists' do
    get '/api/v1/my-projects', as: :json
    assert_response :success

    body = JSON.parse(response.body)
    names = body['projects'].map { |p| p['projectName'] }
    assert_includes names, 'Communication'
    assert_not_includes names, 'Pas la mienne'

    mine = body['projects'].find { |p| p['projectName'] == 'Communication' }
    assert_equal 'lab-project', mine['projectType']
    assert_equal [@member.id.to_s], mine['members'].map { |m| m['id'] }
    assert_equal ['À faire'], mine['taskLists'].map { |tl| tl['name'] }
  end
end
