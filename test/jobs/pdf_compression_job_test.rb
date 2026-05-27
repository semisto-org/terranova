require 'test_helper'
require 'prawn'

# AC-17/AC-18/AC-19/AC-16: the compression job replaces the blob only with a
# strictly smaller, still-readable PDF; otherwise it keeps the original; and it
# never touches non-PDF attachments.
class PdfCompressionJobTest < ActiveSupport::TestCase
  setup do
    [Academy::TrainingDocument, Academy::Training, Academy::TrainingType].each(&:delete_all)
    @training_type = Academy::TrainingType.create!(name: "T", description: "d")
    @training = Academy::Training.create!(training_type: @training_type, title: "Form", status: "idea")
  end

  # A deliberately bloated PDF (lots of redundant content streams) that hexapdf
  # can meaningfully optimize.
  def compressible_pdf_bytes
    pdf = Prawn::Document.new
    300.times { |i| pdf.text "Ligne répétée #{i} " * 20 }
    pdf.render
  end

  # Builds + attaches + saves so the file_or_legacy_url_present validation passes.
  def create_doc_with_file(io_bytes, filename, content_type, name: "Doc")
    doc = @training.documents.build(name: name, uploaded_by: "trainer", uploaded_at: Time.current)
    doc.file.attach(io: StringIO.new(io_bytes), filename: filename, content_type: content_type)
    doc.save!
    doc
  end

  test "AC-17/AC-18 a compressible PDF is replaced by a smaller, valid PDF" do
    bytes = compressible_pdf_bytes
    doc = create_doc_with_file(bytes, "support.pdf", "application/pdf", name: "PDF")
    original_size = doc.file.byte_size

    PdfCompressionJob.perform_now(doc.id)
    doc.reload

    assert doc.file.attached?
    assert_equal "application/pdf", doc.file.content_type
    new_bytes = doc.file.download
    assert_operator new_bytes.bytesize, :<, original_size, "compressed PDF should be smaller"
    # AC-18: still a parseable, openable PDF.
    assert_nothing_raised { HexaPDF::Document.new(io: StringIO.new(new_bytes)).pages.count }
  end

  test "AC-19 when compression yields no gain the original blob is kept" do
    bytes = compressible_pdf_bytes
    doc = create_doc_with_file(bytes, "support.pdf", "application/pdf", name: "PDF")
    blob_id_before = doc.file.blob.id

    # Force the "no gain" branch deterministically: compress returns something
    # not strictly smaller than the original.
    PdfCompressionJob.any_instance.stubs(:compress).returns(bytes + "padding")

    PdfCompressionJob.perform_now(doc.id)
    doc.reload

    assert_equal blob_id_before, doc.file.blob.id, "original blob must be kept when no gain"
    assert_equal bytes.bytesize, doc.file.byte_size
  end

  test "AC-19 when hexapdf fails (nil) the original blob is kept" do
    bytes = compressible_pdf_bytes
    doc = create_doc_with_file(bytes, "support.pdf", "application/pdf", name: "PDF")
    blob_id_before = doc.file.blob.id

    PdfCompressionJob.any_instance.stubs(:compress).returns(nil)

    PdfCompressionJob.perform_now(doc.id)
    doc.reload

    assert_equal blob_id_before, doc.file.blob.id, "original blob must be kept on compression failure"
  end

  test "AC-16 a non-PDF attachment is never modified" do
    doc = create_doc_with_file("hello world", "note.txt", "text/plain", name: "Texte")
    blob_id_before = doc.file.blob.id

    PdfCompressionJob.perform_now(doc.id)
    doc.reload

    assert_equal blob_id_before, doc.file.blob.id
    assert_equal "hello world", doc.file.download
  end

  test "missing document is discarded without raising" do
    assert_nothing_raised { PdfCompressionJob.perform_now(-1) }
  end
end
