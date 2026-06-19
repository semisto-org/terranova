require 'test_helper'

# Digest email calme (#106). Couvre : agrégation (UN seul email récapitulatif,
# pas un par événement), respect des heures calmes (aucun envoi hors plage),
# idempotence (pas de doublon sur la journée), opt-out, et le cas « rien à dire ».
class NotificationDigestJobTest < ActiveJob::TestCase
  include ActionMailer::TestHelper

  setup do
    @member = create_member(first_name: 'Ada')
    @project = PoleProject.create!(name: 'Communication', pole: 'academy')
    @list = TaskList.create!(name: 'À faire', taskable: @project)
    # Heures Bruxelles en juin = CEST (UTC+2). Plage de push par défaut 8h–19h
    # Bruxelles = 6h–17h UTC.
    @push_time = Time.utc(2026, 6, 19, 9, 0)   # 11h Bruxelles → push autorisé
    @quiet_time = Time.utc(2026, 6, 19, 4, 0)  # 6h Bruxelles → heures calmes
  end

  test 'envoie UN seul digest agrégeant toutes les notifications non-lues' do
    create_unread_notification(@member, name: 'Tâche 1')
    create_unread_notification(@member, name: 'Tâche 2')

    assert_emails 1 do
      NotificationDigestJob.perform_now(now: @push_time)
    end

    mail = ActionMailer::Base.deliveries.last
    assert_equal [@member.email], mail.to
    # Corps décodé (le brut est encodé quoted-printable, accents compris).
    text_body = mail.text_part.body.decoded
    assert_match 'Tâche 1', text_body
    assert_match 'Tâche 2', text_body
    assert_equal Date.new(2026, 6, 19), @member.reload.digest_last_sent_on
  end

  test 'ne pousse aucun email pendant les heures calmes' do
    create_unread_notification(@member, name: 'Tâche 1')

    assert_no_emails do
      NotificationDigestJob.perform_now(now: @quiet_time)
    end
    assert_nil @member.reload.digest_last_sent_on
  end

  test 'idempotent — un second passage le même jour ne renvoie rien' do
    create_unread_notification(@member, name: 'Tâche 1')

    assert_emails 1 do
      NotificationDigestJob.perform_now(now: @push_time)
    end
    assert_no_emails do
      NotificationDigestJob.perform_now(now: @push_time)
    end
  end

  test "respecte l'opt-out du digest" do
    @member.update!(email_digest_opt_in: false)
    create_unread_notification(@member, name: 'Tâche 1')

    assert_no_emails do
      NotificationDigestJob.perform_now(now: @push_time)
    end
  end

  test "n'envoie rien quand il n'y a aucune notification non-lue" do
    assert_no_emails do
      NotificationDigestJob.perform_now(now: @push_time)
    end
    assert_nil @member.reload.digest_last_sent_on
  end

  test 'ignore les notifications déjà lues' do
    note = create_unread_notification(@member, name: 'Tâche 1')
    note.mark_read!

    assert_no_emails do
      NotificationDigestJob.perform_now(now: @push_time)
    end
  end

  private

  def create_member(first_name:)
    Member.create!(
      first_name: first_name, last_name: 'H',
      email: "#{first_name.downcase}-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current, member_kind: 'human',
      membership_type: 'effective'
    )
  end

  def create_unread_notification(member, name:)
    task = @list.tasks.create!(name: name, status: 'pending')
    event = ActivityEvent.create!(action: 'task_assigned', subject: task, actor: nil, projectable: @project)
    Notification.create!(recipient: member, activity_event: event, notifiable: task, kind: 'assignment')
  end
end
