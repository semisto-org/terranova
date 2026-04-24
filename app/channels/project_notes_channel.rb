# frozen_string_literal: true

class ProjectNotesChannel < ApplicationCable::Channel
  def subscribed
    @projectable = resolve_projectable
    return reject unless @projectable

    stream_from stream_key(@projectable)
  end

  def receive(data)
    projectable = @projectable || resolve_projectable
    return unless projectable

    ActionCable.server.broadcast(stream_key(projectable), data)
  end

  private

  def resolve_projectable
    type_key = params[:type_key]
    id = params[:project_id]
    return nil unless id

    # Legacy: ProjectNotesChannel was lab-only and subscribed with only project_id.
    # Keep backwards-compat for callers that don't pass type_key.
    klass_name = type_key.present? ? Projectable::PROJECT_TYPE_KEYS.key(type_key) : "PoleProject"
    return nil unless klass_name

    klass_name.constantize.find_by(id: id)
  end

  def stream_key(projectable)
    "project_notes_#{projectable.class.name}_#{projectable.id}"
  end
end
