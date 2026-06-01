require 'test_helper'

class TaskTest < ActiveSupport::TestCase
  setup do
    @project = PoleProject.create!(name: 'Communication', pole: 'academy')
    @list = TaskList.create!(name: 'À faire', taskable: @project)
    @member = Member.create!(
      first_name: 'Mo', last_name: 'Hammad', email: "mo-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current,
      member_kind: 'human', membership_type: 'effective'
    )
    @outsider = Member.create!(
      first_name: 'Étranger', last_name: 'Au Projet', email: "out-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current,
      member_kind: 'human', membership_type: 'effective'
    )
  end

  test 'assignee must belong to the project team' do
    ProjectMembership.create!(projectable: @project, member: @member, role: 'member')

    task = @list.tasks.build(name: 'Préparer la session', status: 'pending', assignee_id: @member.id)
    assert task.valid?, task.errors.full_messages.to_sentence
  end

  test 'assignee outside the project team is rejected' do
    task = @list.tasks.build(name: 'Préparer la session', status: 'pending', assignee_id: @outsider.id)
    assert_not task.valid?
    assert task.errors[:assignee].any?
  end

  test 'task without assignee remains valid (legacy free-text path)' do
    task = @list.tasks.build(name: 'Tâche sans responsable', status: 'pending', assignee_name: 'Quelqu\'un')
    assert task.valid?, task.errors.full_messages.to_sentence
  end

  test 'editing an existing task does not re-validate an unchanged assignee who left the team' do
    ProjectMembership.create!(projectable: @project, member: @member, role: 'member')
    task = @list.tasks.create!(name: 'Suivi', status: 'pending', assignee_id: @member.id)

    # Le membre quitte l'équipe après coup.
    @project.project_memberships.destroy_all

    # Un simple changement de statut ne doit pas être bloqué.
    task.status = 'in_progress'
    assert task.valid?, task.errors.full_messages.to_sentence
    assert task.save
  end
end
