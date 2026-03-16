# frozen_string_literal: true

class ProjectNotesChannel < ApplicationCable::Channel
  def subscribed
    @project = PoleProject.find(params[:project_id])
    stream_from "project_notes_#{@project.id}"
  end

  def receive(data)
    project = @project || PoleProject.find_by(id: params[:project_id])
    return unless project

    ActionCable.server.broadcast(
      "project_notes_#{project.id}",
      data
    )
  end
end
