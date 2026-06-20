# frozen_string_literal: true

module Meetings
  # Gate de validation (#47) : passe un point d'action de `proposed` à
  # `validated` et crée la Task assignée correspondante, rattachée à la réunion
  # (event_id = traçabilité « vient de la réunion X ») et au projet de la
  # réunion. Transactionnel : pas de tâche orpheline si la mise à jour échoue.
  class ActionItemValidator
    class Error < StandardError; end

    def self.call(...)
      new(...).call
    end

    def initialize(item, validated_by:, assignee: nil)
      @item = item
      @validated_by = validated_by
      @assignee = assignee || item.assignee
    end

    def call
      raise Error, "Ce point a déjà été validé." if @item.validated?

      projectable = @item.event.projectable
      raise Error, "La réunion n'est rattachée à aucun projet." if projectable.nil?

      task = nil
      ActiveRecord::Base.transaction do
        # Assigner depuis une réunion fait entrer l'assigné dans l'équipe du
        # projet (une tâche ne peut être assignée qu'à un membre de l'équipe).
        if @assignee && !projectable.project_member_ids.include?(@assignee.id)
          projectable.project_memberships.create!(member: @assignee, role: "member")
          # Rafraîchit le cache d'association : la validation d'appartenance de
          # Task lit project_member_ids sur cette même instance de projectable.
          projectable.project_members.reload
        end

        list = projectable.unified_task_lists.order(:position, :created_at).first ||
               projectable.unified_task_lists.create!(name: "Tâches")

        task = list.tasks.create!(
          name: @item.description,
          status: "pending",
          assignee: @assignee,
          assigned_by: @validated_by,
          event: @item.event # provenance : la tâche vient de cette réunion (#37)
        )

        @item.update!(status: "validated", task: task, assignee: @assignee)
      end

      task
    end
  end
end
