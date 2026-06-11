# frozen_string_literal: true

# Notification d'échéance proche (#104) — tourne chaque matin via solid_queue
# (config/recurring.yml). Décisions actées (10/06) : J-1 (la veille de
# l'échéance), et la tâche doit avoir un assigné pour avoir un destinataire.
#
# Idempotent : un rejeu le même jour ne recrée ni événement ni notification
# (garde sur l'ActivityEvent du jour + index unique du fan-out).
class TaskDueSoonNotificationJob < ApplicationJob
  queue_as :default

  def perform
    Task.where(due_date: Date.tomorrow)
        .where.not(status: "completed")
        .where.not(assignee_id: nil)
        .find_each do |task|
      next if already_recorded_today?(task)

      NotificationService.record!(
        action: "task_due_soon", subject: task,
        kind_for: ->(_) { "due_soon" }
      )
    end
  end

  private

  def already_recorded_today?(task)
    ActivityEvent.exists?(
      action: "task_due_soon", subject: task,
      created_at: Time.current.all_day
    )
  end
end
