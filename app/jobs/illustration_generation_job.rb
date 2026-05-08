class IllustrationGenerationJob < ApplicationJob
  queue_as :illustrations

  retry_on Plants::GeminiImageClient::RateLimitError, wait: 10.seconds, attempts: 1
  discard_on ActiveRecord::RecordNotFound

  def perform(illustration_job_id)
    job = Plant::IllustrationJob.find(illustration_job_id)
    return if job.completed? || job.running?

    job.update!(status: "running", started_at: Time.current)

    prompt = Plants::IllustrationPromptComposer.new(
      species: job.species,
      style: :a2s,
      feedback: job.feedback
    ).compose
    job.update!(prompt_used: prompt, vds_version: Plants::Vds.version)

    bytes = Plants::GeminiImageClient.new.generate(prompt: prompt)

    species = job.species
    species.silhouette_illustration.purge_later if species.silhouette_illustration.attached?
    content_type = bytes[0..1].bytes == [255, 216] ? "image/jpeg" : "image/png"
    extension = content_type == "image/jpeg" ? "jpg" : "png"
    species.silhouette_illustration.attach(
      io: StringIO.new(bytes),
      filename: "#{species.slug}-illustration.#{extension}",
      content_type: content_type
    )

    job.update!(
      status: "completed",
      finished_at: Time.current,
      byte_size: bytes.bytesize
    )
    broadcast(job)
  rescue => e
    job.update!(
      status: "failed",
      finished_at: Time.current,
      error_message: e.message,
      error_class: e.class.name,
      gemini_attempts: job.gemini_attempts.to_i + 1
    ) if job
    broadcast(job) if job
    raise
  end

  private

  def broadcast(job)
    payload = {
      id: job.id,
      species_id: job.species_id,
      status: job.status,
      error_message: job.error_message
    }
    ActionCable.server.broadcast("illustration_jobs", payload)
  end
end
