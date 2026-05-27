# frozen_string_literal: true

require "hexapdf"
require "stringio"

# Recompresses a trainer-uploaded PDF after upload and replaces the attached
# blob with the lighter version — but only if the result is valid and actually
# smaller. The original is always preserved on failure or no gain (never a
# degraded or broken PDF in the database).
#
# Only PDFs ever enter this job (the controller gates on
# content_type == "application/pdf"); non-PDF files are never enqueued.
class PdfCompressionJob < ApplicationJob
  queue_as :documents

  # Keep this conservative: a corrupt PDF or a hexapdf edge case should not
  # retry forever. Compression is best-effort — losing it is harmless.
  retry_on StandardError, wait: :polynomially_longer, attempts: 3
  discard_on ActiveRecord::RecordNotFound

  def perform(document_id)
    document = Academy::TrainingDocument.find(document_id)
    return unless document.file.attached?
    return unless document.file.content_type == "application/pdf"

    original_bytes = document.file.download
    original_size = original_bytes.bytesize

    compressed_bytes = compress(original_bytes)

    # Guard: keep the original unless we produced a strictly smaller, non-empty result.
    if compressed_bytes.nil? || compressed_bytes.bytesize.zero? || compressed_bytes.bytesize >= original_size
      Rails.logger.info(
        "[PdfCompressionJob] doc=#{document.id} no gain " \
        "(original=#{original_size} compressed=#{compressed_bytes&.bytesize.inspect}) — keeping original"
      )
      return
    end

    filename = document.file.filename.to_s
    document.file.purge_later
    document.file.attach(
      io: StringIO.new(compressed_bytes),
      filename: filename,
      content_type: "application/pdf"
    )

    Rails.logger.info(
      "[PdfCompressionJob] doc=#{document.id} compressed #{original_size} -> #{compressed_bytes.bytesize} bytes"
    )
  end

  private

  # Returns the recompressed PDF bytes, or nil if hexapdf can't process the file.
  # A parse/write failure here means the source PDF is unusual — we keep the
  # original rather than risk a broken attachment.
  def compress(bytes)
    doc = HexaPDF::Document.new(io: StringIO.new(bytes))
    out = StringIO.new
    out.set_encoding(Encoding::BINARY)
    doc.write(out, optimize: true, validate: true)
    out.string
  rescue HexaPDF::Error, StandardError => e
    Rails.logger.warn("[PdfCompressionJob] hexapdf could not compress: #{e.class}: #{e.message}")
    nil
  end
end
