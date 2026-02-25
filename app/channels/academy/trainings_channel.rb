module Academy
  class TrainingsChannel < ApplicationCable::Channel
    def subscribed
      stream_from "academy_trainings"
    end
  end
end
