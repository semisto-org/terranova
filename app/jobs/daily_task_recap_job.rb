# frozen_string_literal: true

# Récap quotidien Slack des tâches cochées (#43). Chaque soir (~23h, cf.
# config/recurring.yml), poste sur Slack la liste des tâches passées en
# « completed » dans la journée, groupées par personne, tous projets confondus.
#
# Idempotent et durable : une tâche déjà incluse dans un récap porte
# `recapped_at` et n'est jamais re-postée — même pattern que
# `trainer_docs_requested_at`. Re-jouer le job ne double donc jamais l'envoi.
class DailyTaskRecapJob < ApplicationJob
  queue_as :default

  def perform(date: Date.current)
    tasks = unrecapped_completed_tasks(date).to_a
    return if tasks.empty?

    SlackNotifier.post(text: self.class.build_message(tasks, date))
    Task.where(id: tasks.map(&:id)).update_all(recapped_at: Time.current)
  end

  # Message Slack groupé par personne. Public + pur pour être testable sans Slack.
  def self.build_message(tasks, date = Date.current)
    header = "🌱 *Terranova — tâches terminées le #{I18n.l(date, format: :long, locale: :fr) rescue date.iso8601}*"
    grouped = tasks.group_by { |t| t.completed_by&.then { |m| "#{m.first_name} #{m.last_name}".strip } || "Sans personne" }

    blocks = grouped.sort_by { |name, _| name }.map do |name, person_tasks|
      lines = person_tasks.map { |t| "  • #{t.name}" }
      "*#{name}* (#{person_tasks.size})\n#{lines.join("\n")}"
    end

    "#{header}\n\n#{blocks.join("\n\n")}"
  end

  private

  def unrecapped_completed_tasks(date)
    Task.where(status: "completed", recapped_at: nil)
        .where(completed_at: date.all_day)
        .includes(:completed_by)
        .order(:completed_at)
  end
end
