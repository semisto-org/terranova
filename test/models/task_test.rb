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

  test 'assigning a task stamps assigned_at' do
    ProjectMembership.create!(projectable: @project, member: @member, role: 'member')
    task = @list.tasks.create!(name: 'Réserver la salle', status: 'pending', assignee_id: @member.id)
    assert_not_nil task.assigned_at
  end

  test 'completing a task stamps completed_at and clears it when reopened' do
    task = @list.tasks.create!(name: 'Envoyer le mail', status: 'pending')

    task.update!(status: 'completed', completed_by: @member)
    assert_not_nil task.completed_at
    assert_equal @member.id, task.completed_by_id

    task.update!(status: 'pending')
    assert_nil task.completed_at
    assert_nil task.completed_by_id
  end

  test 'scopes select starred, pinged and recently completed' do
    starred = @list.tasks.create!(name: 'Étoilée', status: 'pending', starred_at: Time.current)
    pinged = @list.tasks.create!(name: 'Coucou', status: 'pending', pinged_at: Time.current)
    done = @list.tasks.create!(name: 'Faite', status: 'completed', completed_at: 1.day.ago)
    old_done = @list.tasks.create!(name: 'Vieille', status: 'completed', completed_at: 60.days.ago)

    assert_includes Task.starred, starred
    assert_includes Task.pinged, pinged
    assert_includes Task.recently_completed(14), done
    assert_not_includes Task.recently_completed(14), old_done
  end
end
